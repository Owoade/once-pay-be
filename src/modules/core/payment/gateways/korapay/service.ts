import { BACKEND_BASE_URL, KORAPAY_SECRET_KEY } from "src/env";
import { PaymentService } from "../../base.js";
import { ServiceMethodReturnType } from "@utils/type";
import { InitiateTransaction, InitiateTransactionResponse, ResolveWebhookResponse, VerifyTransactionResponse } from "../../type.js";
import { KoraPayWebhookPayload } from "./type.js";
import axios from "axios";

class KorapayService implements PaymentService {
    private base_url = "https://api.korapay.com/merchant/api/v1";
    private secret_key = KORAPAY_SECRET_KEY;
    private provider_name = "korapay";
    private notification_url = "https://backpack-trailside-unraveled.ngrok-free.dev/webhooks/korapay"

    constructor() {
        this.initiate_transaction = this.initiate_transaction.bind(this);
        this.verify_transaction = this.verify_transaction.bind(this);
    }

    async initiate_transaction(payload: InitiateTransaction): Promise<ServiceMethodReturnType<InitiateTransactionResponse>> {
        try {
            const axios_response = await axios.post(
                `${this.base_url}/charges/initialize`,
                {
                    amount: payload.amount,
                    currency: "NGN",
                    reference: payload.internal_trx_reference,
                    narration: "once payment",
                    customer: {
                        email: payload.email,
                    },
                    notification_url: this.notification_url,   
                    redirect_url: `${BACKEND_BASE_URL}/transaction/callback/${this.provider_name}/${payload.internal_trx_reference}`,
                },
                {
                    headers: {
                        "Authorization": `Bearer ${this.secret_key}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const korapay_response = axios_response.data;

            if(!korapay_response.status) {
                return {
                    error: {
                        code: 400,
                        message: korapay_response.message
                    }
                }
            }

            const korapay_response_data = korapay_response.data;

            return {
                data: {
                    transaction_reference: korapay_response_data.reference,
                    payment_link: korapay_response_data.checkout_url
                }
            };
        }
    
        catch (err: any) {
            return {
                error: {
                    code: 400,
                    message: err.response.data.message ?? err.response.message
                }
            }
        }
    }

    async verify_transaction(reference: string): Promise<ServiceMethodReturnType<VerifyTransactionResponse>> {
        try {
            const axios_response = await axios.get(
                `${this.base_url}/charges/${reference}`,
                {
                    headers: {
                        "Authorization": `Bearer ${this.secret_key}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const korapay_response = axios_response.data;

            if(!korapay_response.status) {
                return {
                    error: {
                        code: 400,
                        message: korapay_response.message
                    }
                }
            }

            const korapay_response_data = korapay_response.data;

            return {
                data: {
                    status: korapay_response_data.status,
                    raw_transaction_response: korapay_response_data
                }
            };
        }
        catch (err: any) {
            return {
                error: {
                    code: 400,
                    message: err.response.data.message ?? err.response.message
                }
            }
        }
    }

    resolve_webhook(payload: KoraPayWebhookPayload): ServiceMethodReturnType<ResolveWebhookResponse> {
        const event = payload?.event;
        const reference = payload?.data?.reference;

        if (!event || !reference) {
            return {
                error: {
                    code: 400,
                    message: "Invalid korapay webhook payload"
                }
            };
        }

        return {
            data: {
                event: event === "charge.success" ? "successful_transaction" : event === "charge.failed" ? "failed_transaction" : "unrecognized_event",
                status: payload.data.status,
                reference,
                raw_webhook_request: payload
            }
        };
    }
}

const korapay_service = new KorapayService();
export default korapay_service;