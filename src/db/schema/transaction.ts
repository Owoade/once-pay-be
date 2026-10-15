import schema_type from '@utils/schema_type';

export const TRANSACTION_TABLE_NAME = 'transactions';

export const TransactionSchema = {
    id: schema_type.primary_key(),
    merchant_id: schema_type.int(),
    reference: schema_type.string(),
    amount: schema_type.decimal(12, 2),
    payment_gateway: schema_type.string(),
    payment_gateway_trx_id: schema_type.optional(() => schema_type.string()),
    payment_gateway_trx_reference: schema_type.optional(() => schema_type.string()),
    customer_id: schema_type.int(),
    status: schema_type.string(),
    payment_gateway_status: schema_type.optional(() => schema_type.string()),
    payment_gateway_create_trx_response: schema_type.optional(() => schema_type.text()),
    payment_gateway_webhook_response: schema_type.optional(() => schema_type.text()),
    initiated_at_ms: schema_type.bigint(),
    resolved_in_secs: schema_type.optional(() => schema_type.int()),
    payment_made_at_ms: schema_type.optional(() => schema_type.optional(() => schema_type.int())),
    webhook_retry_count: schema_type.int(0),
    trx_sync_attempt: schema_type.int(0),
    callback_url: schema_type.optional(() => schema_type.string()),
};
