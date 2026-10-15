import { BACKEND_BASE_URL, FLUTTERWAVE_SECRET_KEY } from "src/env";
import { PaymentService } from "../../base";
import { InitiateTransaction, InitiateTransactionResponse, VerifyTransactionResponse } from "../../type";
import { ServiceMethodReturnType } from "@utils/type";
import axios, { AxiosError, AxiosResponse } from "axios";

class FlutterwaveService implements PaymentService {

    private provider_name = "flutterwave";
    private base_url = "https://api.flutterwave.com/v3";
    private secret_key = FLUTTERWAVE_SECRET_KEY;

    constructor() {
        this.initiate_transaction = this.initiate_transaction.bind(this);
        this.verify_transaction = this.verify_transaction.bind(this);
    }

    async initiate_transaction(payload: InitiateTransaction): Promise<ServiceMethodReturnType<InitiateTransactionResponse>> {
        try {
            const axios_response = await axios.post(
                `${this.base_url}/payments`,
                {
                    tx_ref: payload.internal_trx_reference,
                    amount: payload.amount,
                    currency: "NGN",
                    redirect_url: `${BACKEND_BASE_URL}/transaction/callback/${this.provider_name}/${payload.internal_trx_reference}`,
                    customer: {
                        email: payload.email
                    },
                    ...(payload.metadata ? { meta: payload.metadata } : {})
                },
                {
                    headers: {
                        "Authorization": `Bearer ${this.secret_key}`,
                        "Content-Type": "application/json"
                    }
                }
            );

                const flutterwave_response = axios_response.data;

            if (flutterwave_response.status !== "success") {
                return {
                    error: {
                        code: 400,
                        message: flutterwave_response.message
                    }
                }
            }

            const flutterwave_response_data = flutterwave_response.data;

            return {
                data: {
                    transaction_reference: flutterwave_response_data.tx_ref,
                    payment_link: flutterwave_response_data.link
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

    async verify_transaction(key: string): Promise<ServiceMethodReturnType<VerifyTransactionResponse>> {
        try {
            const axios_response = await axios.get(
            `${this.base_url}/transactions/verify_by_reference?tx_ref=${key}`,
            {
                headers: {
                    "Authorization": `Bearer ${this.secret_key}`,
                    "Content-Type": "application/json"
                }
            }
            );

            const flutterwave_response = axios_response.data;

            if (flutterwave_response.status !== "success") {
                return {
                    error: {
                        code: 400,
                        message: flutterwave_response.message
                    }
                }
            }

            const flutterwave_response_data = flutterwave_response.data;

            return {
                data: {
                    status: flutterwave_response_data.status,
                    raw_transaction_response: flutterwave_response_data
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
}

const flutterwave_service = new FlutterwaveService();
export default flutterwave_service;