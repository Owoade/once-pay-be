import { ServiceMethodReturnType } from "@utils/type";
import flutterwave_service from "../payment/gateways/flutterwave/service";
import korapay_service from "../payment/gateways/korapay/service";
import monnify_service from "../payment/gateways/monnify/service";
import seerbit_service from "../payment/gateways/seerbit/service";
import paystack_service from "../payment/gateways/paystack/service";
import { ProcessTransaction, PaymentProcessors, TransactionInterface, TransactionStatus, TransactionSummary } from "./type";
import { InitiateTransactionResponse } from "../payment/type";
import transaction_repo from "./repo";
import cache_repo from "../cache/repo";
import merchant_service from "@modules/merchant/service";

class TransactionService {

    private processors: PaymentProcessors = {
        'flutterwave': flutterwave_service,
        "paystack": paystack_service,
        "korapay": korapay_service,
        "monnify": monnify_service,
        "seerbit": seerbit_service
    }

    private successful_trx_status: TransactionStatus = {
        'flutterwave': "successful",
        'paystack': "success",
        'korapay': "success",
        'monnify': "PAID",
        'seerbit': "00"
    }

    constructor() {}   

    async process_transaction(payload: ProcessTransaction)
    : Promise<ServiceMethodReturnType<InitiateTransactionResponse>> {

        const payment_processor = this.processors[payload.payment_gateway];
        const trx_reference = this.generate_transaction_reference()
        const response = await payment_processor.initiate_transaction({
            email: payload.customer.email,
            amount: payload.amount,
            internal_trx_reference: trx_reference,
            ...(payload.metadata && { metadata: payload.metadata })
        });

        const { error, data: payment_data } = response;

        if(error){
            return { error };
        }

        const trx: TransactionInterface = {
            merchant_id: payload.merchant_id,
            reference: trx_reference,
            amount: payload.amount,
            payment_gateway: payload.payment_gateway,
            customer_id: payload.customer.id!,
            status: "pending",
            webhook_retry_count: 0,
            trx_sync_attempt: 0,
            webhook_call_is_resolved: false,
            initiated_at_ms: Date.now(),
            callback_url: payload.callback_url ?? undefined,
            ...(payload.metadata && { metadata: payload.metadata })
        };

        await transaction_repo.create(trx)
        await cache_repo.set(trx_reference, "TRANSACTION CALLBACK TIMEOUT", 60);

        return { data: payment_data };

    }

    async verify_transaction(filter: Partial<TransactionInterface>)
    : Promise<ServiceMethodReturnType<TransactionInterface>>{

        const existing_trx = await transaction_repo.find(filter);
        if(!existing_trx){
            return { 
                error: {
                    message: "Transaction not found",
                    code: 404
                } 
            };
        }

        if(existing_trx.status === 'successful'){
            return {
                data: existing_trx
            };
        }

        const payment_processor = this.processors[existing_trx.payment_gateway];
        const { error, data } = await payment_processor.verify_transaction(existing_trx.reference);

        console.log({ error, data, method: "#transaction_service.verify_transaction" });

        if(error){
            return { error };
        }

        const payment_gateway_successful_trx_status = this.successful_trx_status[existing_trx.payment_gateway];
        const payment_gateway_trx_status = data!.status;
        const TRANSACTION_IS_SUCCESSFUL = payment_gateway_successful_trx_status === payment_gateway_trx_status;
        const payment_gateway_trx = data!.raw_transaction_response;

        const update_payload = {} as Partial<TransactionInterface>

        if(existing_trx.status !== 'successful' && TRANSACTION_IS_SUCCESSFUL){
            update_payload.status = 'successful';
            update_payload.resolved_in_secs = Math.floor((Date.now() - parseInt(existing_trx.initiated_at_ms as any)) / 1000);
        }
            

        if(existing_trx.payment_gateway_status !== payment_gateway_trx_status)
            update_payload.payment_gateway_status = payment_gateway_trx_status;

        update_payload.payment_gateway_create_trx_response = JSON.stringify(payment_gateway_trx);

        await transaction_repo.update({id: existing_trx.id}, update_payload);

        return {
            data: existing_trx
        }
            
        
    }

    // Raw-SQL rows bypass Sequelize's JSON deserialization — metadata leaves
    // sqlite as text, so parse it before it reaches a caller.
    private parse_metadata(row: Record<string, any>) {
        if (typeof row?.metadata === "string") {
            try {
                row.metadata = JSON.parse(row.metadata);
            } catch {
                // Leave malformed text as-is; the consumer renders it raw.
            }
        }
        return row;
    }

    async get_merchant_transactions(merchant_id: number, options: Partial<Pick<TransactionInterface, 'status'>> & { limit?: number, offset?: number })
    : Promise<ServiceMethodReturnType<{ transactions: Partial<TransactionInterface>[], total: number }>> {
        const { rows, total } = await transaction_repo.get_merchant_transactions(merchant_id, {
            limit: options.limit ?? 20,
            offset: options.offset ?? 0,
            status: options.status,
        });

        const transactions = rows
            .map(this.parse_metadata.bind(this))
            .map(row => ({
                ...this.sanitize_transaction(row as TransactionInterface),
                customer_email: row.customer_email ?? null,
            }));

        return { data: { total, transactions } };
    }

    // One transaction, scoped to the merchant. verify=true goes live to the
    // gateway (refreshing status) instead of returning the stored row.
    async get_merchant_transaction(
        merchant_id: number,
        reference: string,
        verify?: boolean,
    ): Promise<ServiceMethodReturnType<{ transaction: Partial<TransactionInterface> }>> {
        if (verify) {
            const verified = await this.verify_transaction({ reference, merchant_id });
            console.log({verified});
            if (verified.error) return { error: verified.error };
        }

        const row = this.parse_metadata(await transaction_repo.find_merchant_transaction(merchant_id, reference));
        if (!row) {
            return {
                error: {
                    message: "Transaction not found",
                    code: 404
                }
            };
        }

        const transaction = {
            ...this.sanitize_transaction(row as TransactionInterface),
            customer_email: row.customer_email ?? null,
        };

        return { data: { transaction } };
    }

    async get_transaction_summary(merchant_id: number)
    : Promise<ServiceMethodReturnType<TransactionSummary>> {
        const totals = await transaction_repo.get_successful_totals(merchant_id);
        const daily = await transaction_repo.get_daily_successful_volume(merchant_id);

        const amount_by_date = new Map(daily.map(row => [row.date, Number(row.amount)]));

        // Zero-fill so every one of the last 7 days always has a bar.
        const daily_volumes = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            daily_volumes.push({ date, amount: amount_by_date.get(date) ?? 0 });
        }

        return {
            data: {
                total_amount: Number(totals.amount_total ?? 0),
                transaction_count: Number(totals.count ?? 0),
                daily_volumes
            }
        };
    }

    async sync_recent_transactions(){
        const recent_transactions = await transaction_repo.get_recent_transactions_due_for_sync();
        await this.sync_transactions(recent_transactions);
    }

    async sync_delayed_transactions(){
        const delayed_transactions = await transaction_repo.get_delayed_transactions_due_for_sync();
        await this.sync_transactions(delayed_transactions);
    }

    async sync_stale_transactions(){
        const stale_transactions = await transaction_repo.get_stale_transactions_due_for_sync();
        await this.sync_transactions(stale_transactions);
    }

    async sync_transactions(transactions: TransactionInterface[]){ 
        for(const trx of transactions){
            const verified_trx = await this.verify_transaction({ id: trx.id });

            if(verified_trx.data && verified_trx.data.status == 'pending')
                await transaction_repo.increment_trx_sync_attempt({ id: trx.id });
        }
    }

    async handle_transactions_due_for_webhook_call(transactions: TransactionInterface[]){
        for(const trx of transactions){
            const response = await merchant_service.send_webhook(trx);
            
            if(response.error)
                continue

            if(response.data && response.data.webhook_not_set)
                await transaction_repo.update({ id: trx.id }, { webhook_call_is_resolved: true, webhook_call_resolution_reason: 'Webhook not set' });

            if(response.data && response.data.webhook_sent)
                await transaction_repo.update({ id: trx.id }, { webhook_call_is_resolved: true, webhook_call_resolution_reason: 'Webhook sent successfully' });

            await transaction_repo.increment_webhook_retry_count({ id: trx.id });
        }
    }

    async handle_recent_transactions_due_for_webhook_call(){
        const recent_transactions = await transaction_repo.get_recent_transactions_due_for_webhook_call();
        await this.handle_transactions_due_for_webhook_call(recent_transactions);
    }

    async handle_delayed_transactions_due_for_webhook_call(){
        const delayed_transactions = await transaction_repo.get_delayed_transactions_due_for_webhook_call();
        await this.handle_transactions_due_for_webhook_call(delayed_transactions);
    }

    async handle_stale_transactions_due_for_webhook_call(){
        const stale_transactions = await transaction_repo.get_stale_transactions_due_for_webhook_call();
        await this.handle_transactions_due_for_webhook_call(stale_transactions);
    }

    async handle_webhook(payment_gateway: TransactionInterface['payment_gateway'], request: any)
    : Promise<ServiceMethodReturnType<void>> {
        const processor = this.processors[payment_gateway];
        if (!processor) {
            return {
                error: {
                    code: 400,
                    message: "Unsupported payment gateway"
                }
            };
        }

        const response = processor.resolve_webhook(request);

        if(response.error)
            return { error: response.error };

        if(response.data?.event === "successful_transaction"){
            const data = response.data;
            const trx = await transaction_repo.find({ reference: data.reference });
   
            if(trx){
               const update_payload = {} as Partial<TransactionInterface>;
               if(trx.status !== "successful"){
                   update_payload.status = "successful";
                   update_payload.resolved_in_secs = Math.floor((Date.now() - parseInt(trx.initiated_at_ms as any)) / 1000);
                   update_payload.payment_gateway_status = this.successful_trx_status[payment_gateway];
               }
               update_payload.payment_gateway_webhook_response = JSON.stringify(response.data.raw_webhook_request);
               await transaction_repo.update({id: trx.id}, update_payload);
            }
        }

        return {}
    }

    sanitize_transaction(transaction: TransactionInterface): Partial<TransactionInterface> {
        const sanitized_transaction = { ...transaction } as Partial<TransactionInterface>;
        delete sanitized_transaction.merchant_id;
        delete sanitized_transaction.customer_id;
        delete sanitized_transaction.trx_sync_attempt;
        delete sanitized_transaction.webhook_retry_count;
        delete sanitized_transaction.webhook_call_is_resolved;
        delete sanitized_transaction.payment_gateway_webhook_response;
        delete sanitized_transaction.payment_gateway_create_trx_response;
        delete sanitized_transaction.payment_gateway_trx_id;
        delete sanitized_transaction.payment_gateway_trx_reference;
        return sanitized_transaction;
    }

    private generate_transaction_reference(){
        return `trx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
}

const transaction_service = new TransactionService();
export default transaction_service;