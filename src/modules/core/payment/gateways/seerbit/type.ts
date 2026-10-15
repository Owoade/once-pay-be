export interface SeerbitPayment {
    redirectLink: string;
    paymentReference: string;
    amount: number;
    fee?: string;
    currency: string;
    paymentType: string;
    paymentStatus?: string;
    gatewayCode: string;
    gatewayMessage: string;
    gatewayref: string;
    maskedPan: string;
    mode: string;
    country: string;
}

export interface SeerbitQueryResponse {
    code: string;
    message: string;
    payments: SeerbitPayment;
}