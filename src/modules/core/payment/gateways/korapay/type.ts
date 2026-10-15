export interface KoraPayTransaction {
  reference: string;
  status: "success" | "failed" | "pending" | "processing";
  amount: string;
  amount_paid: string;
  fee: string;
  currency: string;
  description: string;
  payer_bank_account: KoraPayPayerBankAccount | null;
}

export interface KoraPayPayerBankAccount {
  account_number: string;
  account_name: string;
  bank_name: string;
}