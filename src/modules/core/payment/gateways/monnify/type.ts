export interface MonnifyTransaction {
  transactionReference: string;
  paymentReference: string;
  amountPaid: number;
  totalPayable: number;
  settlementAmount: number;
  paidOn: string;
  createdOn: string;
  completedOn: string | null;
  paymentStatus: string;
  paymentMethod: string;
  currencyCode: string;
  fee: number;
  customerDTO: MonnifyCustomer;
  metaData: Record<string, unknown> | null;
  paymentSourceInformation: MonnifyPaymentSource[];
}

export interface MonnifyCustomer {
  email: string;
  name: string;
  mobileNumber: string;
}

export interface MonnifyPaymentSource {
  bankCode: string;
  amountPaid: number;
  sessionId: string;
  accountName: string;
  accountNumber: string;
}

export type MonnifyPaymentStatus =
  | "PAID"
  | "PENDING"
  | "OVERPAID"
  | "PARTIALLY_PAID"
  | "FAILED"
  | "EXPIRED";

export type MonnifyPaymentMethod =
  | "ACCOUNT_TRANSFER"
  | "CARD"
  | "USSD";

export type MonnifyEventType =
  | "SUCCESSFUL_TRANSACTION"
  | "FAILED_TRANSACTION"
  | (string & {});

export interface MonnifyWebhookPayload {
  eventType: MonnifyEventType;
  eventData: MonnifyTransaction;
}