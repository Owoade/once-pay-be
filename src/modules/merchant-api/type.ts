import { TransactionInterface } from "@modules/core/transaction/type";

export interface InitiateTransactionFromAPI {
    amount: number;
    email: string;
    merchant_id: number,
    payment_gateway: TransactionInterface['payment_gateway'];
    callback_url?: string;
    metadata?: Record<string, any>;
}