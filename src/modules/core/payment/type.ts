export interface InitiateTransaction {
    email: string;
    amount: number;
    internal_trx_reference: string;
    metadata?: Record<string, any>;
}

export interface InitiateTransactionResponse {
    payment_link: string;
    transaction_reference: string;
}

export interface VerifyTransactionResponse {
    status: string;
    raw_transaction_response: any
}

export type WebhookEventName = "successful_transaction" | "failed_transaction" | "unrecognized_event";

export interface ResolveWebhookResponse {
    event: WebhookEventName;
    status: string;
    reference: string;
    raw_webhook_request: any;
}

