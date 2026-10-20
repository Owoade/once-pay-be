import { BACKEND_BASE_URL, PAYSTACK_SECRET_KEY } from "src/env";
import { PaymentService } from "../../base.js";
import { InitiateTransaction, InitiateTransactionResponse, ResolveWebhookResponse, VerifyTransactionResponse } from "../../type.js";
import { ServiceMethodReturnType } from "@utils/type";
import axios from "axios";
import { PaystackTransaction, PaystackWebhookPayload } from "./type.js";

class PaystackService implements PaymentService {
    
    private base_url = "https://api.paystack.co";
    private secret_key = PAYSTACK_SECRET_KEY;
    private provider_name = "paystack";

    constructor() {
        this.initiate_transaction = this.initiate_transaction.bind(this);
        this.verify_transaction = this.verify_transaction.bind(this);   
    }

    async initiate_transaction(payload: InitiateTransaction): Promise<ServiceMethodReturnType<InitiateTransactionResponse>> {
        try {
        const axios_response = await axios.post(
            `${this.base_url}/transaction/initialize`,
            {
                email: payload.email,
                amount: payload.amount,
                reference: payload.internal_trx_reference,
                callback_url: `${BACKEND_BASE_URL}/transaction/callback/${this.provider_name}/${payload.internal_trx_reference}`,
                ...(payload.metadata ? { metadata: payload.metadata } : {})
            },
            {
                headers: {
                    "Authorization": `Bearer ${this.secret_key}`,
                    "Content-Type": "application/json"
                }
            }
        );

       const paystack_response = axios_response.data;

       if (paystack_response.status !== true) {
           return {
            error: {
                code: 400,
                message: paystack_response.message
            }
           }
       }

       const paystack_response_data = paystack_response.data;

       return {
           data: {
            transaction_reference: paystack_response_data.reference,
            payment_link: paystack_response_data.authorization_url
           }
       };
       
        }
        catch (err: any) {
            console.error(err)
            return {
                error: {
                    code: 400,
                    message: err.response.data.message ?? err.response.message
                }
            }
        }
    }

    async verify_transaction(key: string): Promise<ServiceMethodReturnType<VerifyTransactionResponse>> {
        try {
            const axios_response = await axios.get(
                `${this.base_url}/transaction/verify/${key}`,
                {
                    headers: {
                        "Authorization": `Bearer ${this.secret_key}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const paystack_response = axios_response.data;

            if (paystack_response.status !== true) {
                return {
                    error: {
                        code: 400,
                        message: paystack_response.message
                    }
                }
            }

            const paystack_response_data = paystack_response.data;

            return {
                data: {
                    status: paystack_response_data.status,
                    raw_transaction_response: paystack_response_data
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
    resolve_webhook(payload: PaystackWebhookPayload): ServiceMethodReturnType<ResolveWebhookResponse> {
        const event = payload?.event;
        const reference = payload?.data?.reference;

        if (!event || !reference) {
            return {
                error: {
                    code: 400,
                    message: "Invalid paystack webhook payload"
                }
            };
        }

        return {
            data: {
                event: event === "charge.success" ? "successful_transaction" : "unrecognized_event",
                status: payload.data.status,
                reference,
                raw_webhook_request: payload
            }
        };
    }
}

const paystack_service = new PaystackService();
export default paystack_service