import { ServiceMethodReturnType } from "@utils/type";
import flutterwave_service from "../payment/gateways/flutterwave/service";
import korapay_service from "../payment/gateways/korapay/service";
import monnify_service from "../payment/gateways/monnify/service";
import seerbit_service from "../payment/gateways/seerbit/service";
import paystack_service from "../payment/gateways/paystack/service";
import { ProcessTransaction, PaymentProcessors, TransactionInterface, TransactionStatus } from "./type";
import { InitiateTransactionResponse } from "../payment/type";
import transaction_repo from "./repo";
import cache_repo from "../cache/repo";

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
            initiated_at_ms: Date.now()
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

    private generate_transaction_reference(){
        return `trx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
}

const transaction_service = new TransactionService();
export default transaction_service;