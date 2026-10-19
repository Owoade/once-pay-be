export interface PaystackTransaction {
  id: number;
  domain: string;
  status: TransactionStatus;
  reference: string;
  receipt_number: string | null;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string | null;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: string | Record<string, unknown> | null;
  log: TransactionLog;
  fees: number | null;
  fees_split: Record<string, unknown> | null;
  authorization: TransactionAuthorization | null;
  customer: TransactionCustomer;
  plan: Record<string, unknown> | null;
  split: Record<string, unknown>;
  order_id: string | number | null;
  paidAt: string | null;
  createdAt: string;
  requested_amount: number;
  pos_transaction_data: Record<string, unknown> | null;
  source: Record<string, unknown> | null;
  fees_breakdown: Record<string, unknown> | null;
  connect: Record<string, unknown> | null;
  transaction_date: string;
  plan_object: Record<string, unknown>;
  subaccount: Record<string, unknown>;
}

type TransactionStatus =
  | "abandoned"
  | "failed"
  | "ongoing"
  | "pending"
  | "processing"
  | "queued"
  | "reversed"
  | "success";

interface TransactionLog {
  start_time: number;
  time_spent: number;
  attempts: number;
  errors: number;
  success: boolean;
  mobile: boolean;
  input: unknown[];
  history: TransactionHistory[];
}

interface TransactionHistory {
  type: string;
  message: string;
  time: number;
}

interface TransactionAuthorization {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  channel: string;
  card_type: string;
  bank: string;
  country_code: string;
  brand: string;
  reusable: boolean;
  signature: string;
  account_name: string | null;
}

interface TransactionCustomer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  customer_code: string;
  phone: string | null;
  metadata: Record<string, unknown> | null;
  risk_action: string;
  international_format_phone: string | null;
}

export interface PaystackWebhookPayload {
  event: "charge.success" | (string & {});
  data: PaystackTransaction;
}