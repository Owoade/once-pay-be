import customer_service from "@modules/core/customer/service";
import { InitiateTransactionFromAPI} from "./type.js";
import transaction_service from "@modules/core/transaction/service";
import { ServiceMethodReturnType } from "@utils/type";
import { InitiateTransactionResponse } from "@modules/core/payment/type";
import { TransactionInterface } from "@modules/core/transaction/type";
import cache_repo from "@modules/core/cache/repo";
import customer_repo from "@modules/core/customer/repo";

class MerchantApiService {
    constructor(){}

    async initiate_transaction(payload: InitiateTransactionFromAPI): Promise<ServiceMethodReturnType<InitiateTransactionResponse>> {
        const customer = await customer_service.get_customer({merchant_id: payload.merchant_id, email: payload.email});
        const {data, error} = await transaction_service.process_transaction({
            amount: payload.amount,
            customer,
            payment_gateway: payload.payment_gateway,
            callback_url: payload.callback_url,
            metadata: payload.metadata,
            merchant_id: payload.merchant_id,
        })

        if(error){
            return { error }
        }

        return { data }
    }

    async verify_transaction_from_callback(params: { payment_gateway: string, trx_reference: string }): Promise<ServiceMethodReturnType<TransactionInterface>> {
        const CALLBACK_PERIOD_HAS_PASSED = (await cache_repo.get(params.trx_reference)) === null;
        if(CALLBACK_PERIOD_HAS_PASSED){
            return {
                error: {
                    message: "Transaction is invalid or already resolved",
                    code: 408
                }
            };
        }

        const response = await transaction_service.verify_transaction({
            payment_gateway: params.payment_gateway as any,
            reference: params.trx_reference
        });

        if(response.error){
            return { error: response.error };
        }

        const customer = await customer_repo.find({id: response.data!.customer_id}, ['email']);

        (response.data! as any).customer_email = customer.email;

        return { data: response.data };

    }

    // Public listing for merchants: sanitized rows, API-key scoped.
    async list_transactions(filter: { merchant_id: number, limit?: number, offset?: number, status?: string })
    : Promise<ServiceMethodReturnType<{ transactions: Partial<TransactionInterface>[], total: number }>> {
        return transaction_service.get_merchant_transactions(filter.merchant_id, {
            limit: filter.limit,
            offset: filter.offset,
            status: filter.status as any,
        });
    }

    async verify_transaction(filter: Pick<TransactionInterface, 'reference' | 'merchant_id'>): Promise<ServiceMethodReturnType<TransactionInterface>> {
        const response = await transaction_service.verify_transaction({
            reference: filter.reference,
            merchant_id: filter.merchant_id
        });

        if(response.error){
            return { error: response.error };
        }

        const customer = await customer_repo.find({id: response.data!.customer_id}, ['email']);

        (response.data! as any).customer_email = customer?.email ?? null;

        return { data: response.data };
    }
}

const merchant_api_service = new MerchantApiService();
export default merchant_api_service;