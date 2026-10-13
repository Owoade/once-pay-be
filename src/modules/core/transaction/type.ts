export interface TransactionInterface {
    id: number;
    merchant_id: number;
    reference: string;
    amount: number;
    payment_gateway: string;
    payment_gateway_trx_id?: string;
    customer_id: number;
    status: string;
    payment_gateway_status?: string;
    payment_gateway_create_trx_response?: string;
    payment_gateway_webhook_response?: string;
    initiated_at_ms: string | number;
    resolved_at_secs?: number;
    payment_made_at_ms?: number;
    webhook_retry_count: number;
    trx_sync_attempt: number;
    payment_gateway_trx_reference?: string;
    callback_url?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
