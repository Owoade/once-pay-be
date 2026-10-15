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

