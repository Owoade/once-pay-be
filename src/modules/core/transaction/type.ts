import { CustomerInterface } from "../customer/type";
import { PaymentService } from "../payment/base";

export interface TransactionInterface {
  id?: number;
  merchant_id: number;
  reference: string;
  amount: number;
  payment_gateway: "paystack" | "flutterwave" | "korapay" | "monnify" | "seerbit";
  payment_gateway_trx_id?: string;
  customer_id: number;
  status: "successful" | "pending" | "failed";
  payment_gateway_status?: string;
  payment_gateway_create_trx_response?: string;
  payment_gateway_webhook_response?: string;
  initiated_at_ms: number;
  resolved_in_secs?: number;
  payment_made_at_ms?: number;
  webhook_retry_count: number;
  trx_sync_attempt: number;
  payment_gateway_trx_reference?: string;
  callback_url?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProcessTransaction {
  merchant_id: number;
  customer: CustomerInterface;
  amount: number;
  payment_gateway: TransactionInterface["payment_gateway"];
  callback_url?: string;
  metadata?: Record<string, any>;
}

export type PaymentProcessors = Record<
  TransactionInterface["payment_gateway"],
  PaymentService
>;



export type TransactionStatus = Record<TransactionInterface["payment_gateway"], string>;