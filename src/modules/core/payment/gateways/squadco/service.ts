import { BACKEND_BASE_URL, SQUAD_CO_SECRET_KEY } from "src/env";
import { PaymentService } from "../../base";
import { InitiateTransaction, InitiateTransactionResponse, VerifyTransactionResponse } from "../../type";
import { ServiceMethodReturnType } from "@utils/type";
import axios from "axios";

class SquadCoService implements PaymentService {
    private base_url = "https://sandbox-api-d.squadco.com";
    private secret_key = SQUAD_CO_SECRET_KEY;
    private provider_name = "squadco";

    constructor() {}

    initiate_transaction = async (payload: InitiateTransaction): Promise<ServiceMethodReturnType<InitiateTransactionResponse>> => {
        try {
            const axios_response = await axios.post(
                `${this.base_url}/transaction/initiate`,
                {
                    amount: payload.amount,
                    email: payload.email,
                    transaction_ref: payload.internal_trx_reference,
                    currency: "NGN",
                    initiate_type: "inline",
                    callback_url: `${BACKEND_BASE_URL}/transaction/callback/${this.provider_name}/${payload.internal_trx_reference}`,
                    ...(payload.metadata && { metadata: payload.metadata })
                },
                {
                    headers: {
                        "Authorization": `Bearer ${this.secret_key}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const response_data = axios_response.data;

            if (response_data.status !== 200) {
                return {
                    error: {
                        code: 400,
                        message: response_data.message || "Failed to initiate transaction with Squad Co"
                    }
                };
            }

            return {
                data: {
                    transaction_reference: response_data.data?.transaction_ref,
                    payment_link: response_data.data?.checkout_url || ""
                }
            };
        } catch (err: any) {
            console.error("Squad Co Initiation Error:", err);
            return {
                error: {
                    code: 400,
                    message: err.response?.data?.message || err.message || "An error occurred during Squad Co transaction initiation"
                }
            };
        }
    };

    verify_transaction = async (key: string): Promise<ServiceMethodReturnType<VerifyTransactionResponse>> => {
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

            const response_data = axios_response.data;

            if (response_data.status !== 200 || response_data.success !== true) {
                return {
                    error: {
                        code: 400,
                        message: response_data.message || "Failed to verify transaction with Squad Co"
                    }
                };
            }

            const data = response_data.data;

            return {
                data: {
                    status: data.transaction_status, // e.g., "Success"
                    raw_transaction_response: data
                }
            };
        } catch (err: any) {
            console.error("Squad Co Verification Error:", err);
            return {
                error: {
                    code: 400,
                    message: err.response?.data?.message || err.message || "An error occurred during Squad Co transaction verification"
                }
            };
        }
    };
}

const squadco_service = new SquadCoService();
export default squadco_service;
