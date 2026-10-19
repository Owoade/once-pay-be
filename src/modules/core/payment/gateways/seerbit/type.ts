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

export interface SeerbitWebhookEvent {
    paymentReference: string;
    code: string;
    paymentStatus?: string;
    [key: string]: unknown;
}

export interface SeerbitWebhookPayload {
    payload: SeerbitWebhookEvent;
}