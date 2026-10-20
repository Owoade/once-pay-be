import { CustomerInterface } from "../customer/type.js";
import { PaymentService } from "../payment/base.js";

const VALID_PAYMENT_GATEWAYS = ["paystack", "flutterwave", "korapay", "monnify", "seerbit"] as const;

export interface TransactionInterface {
  id?: number;
  merchant_id: number;
  reference: string;
  amount: number;
  payment_gateway: typeof VALID_PAYMENT_GATEWAYS[number];
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
  webhook_call_is_resolved: boolean;
  webhook_call_resolution_reason?: string;
  payment_gateway_trx_reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TransactionSummary {
  total_amount: number;
  transaction_count: number;
  daily_volumes: Array<{ date: string; amount: number }>;
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