import { ServiceMethodReturnType } from "@utils/type";
import { InitiateTransaction, InitiateTransactionResponse, ResolveWebhookResponse, VerifyTransactionResponse } from "./type";

export interface PaymentService {
    initiate_transaction(payload: InitiateTransaction): Promise<ServiceMethodReturnType<InitiateTransactionResponse>>;
    verify_transaction(key: string): Promise<ServiceMethodReturnType<VerifyTransactionResponse>>;
    resolve_webhook(payload: any): ServiceMethodReturnType<ResolveWebhookResponse>;
}
