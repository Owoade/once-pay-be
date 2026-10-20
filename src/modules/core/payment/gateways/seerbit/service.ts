import { BACKEND_BASE_URL, SEERBIT_PUBLIC_KEY, SEERBIT_SECRET_KEY } from "src/env";
import { PaymentService } from "../../base.js";
import cache_repo from "@modules/core/cache/repo";
import axios from "axios";
import { ServiceMethodReturnType } from "@utils/type";
import { InitiateTransaction, InitiateTransactionResponse, ResolveWebhookResponse, VerifyTransactionResponse } from "../../type.js";
import { SeerbitQueryResponse, SeerbitWebhookPayload } from "./type.js";

class SeerbitService implements PaymentService {
    private base_url = "https://seerbitapi.com/api";
    private public_key = SEERBIT_PUBLIC_KEY;
    private secret_key = SEERBIT_SECRET_KEY;
    private provider_name = "seerbit";

    constructor() {
        this.initiate_transaction = this.initiate_transaction.bind(this);
        this.verify_transaction = this.verify_transaction.bind(this);
    }

    async initiate_transaction(payload: InitiateTransaction): Promise<ServiceMethodReturnType<InitiateTransactionResponse>> {
        const { data: encrypted_key, error } = await this.get_encrypted_key();
        if (error) {
            return {
                error
            };
        }

        try {
            const response = await axios.post(
                `${this.base_url}/v2/payments`,
                {
                    publicKey: this.public_key,
                    amount: String(payload.amount),
                    currency: "NGN",
                    country: "NG",
                    paymentReference: payload.internal_trx_reference,
                    email: payload.email,
                    callbackUrl: `${BACKEND_BASE_URL}/transaction/callback/${this.provider_name}/${payload.internal_trx_reference}`,
                },
                {
                    headers: {
                        Authorization: `Bearer ${encrypted_key}`
                    }
                }
            );

            const seerbit_response = response.data;
            if (seerbit_response.data?.code !== "00") {
                return {
                    error: {
                        code: 400,
                        message: seerbit_response.data?.message ?? seerbit_response.message ?? "Failed to initiate transaction"
                    }
                };
            }

            const seerbit_response_data = seerbit_response.data;

            return {
                data: {
                    payment_link: seerbit_response_data.payments.redirectLink,
                    transaction_reference: payload.internal_trx_reference
                }
            };

        }
        catch (err: any) {
            return {
                error: {
                    code: 400,
                    message: err.response?.data?.message ?? "Failed to initiate transaction"
                }
            };
        }
    }

    async verify_transaction(key: string): Promise<ServiceMethodReturnType<VerifyTransactionResponse>> {

        const { data: encrypted_key, error } = await this.get_encrypted_key();
        if (error) {
            return {
                error
            };
        }

        try {
            const response = await axios.get(
                `${this.base_url}/v3/payments/query/${key}`,
                {
                    headers: {
                        Authorization: `Bearer ${encrypted_key}`
                    }
                }
            );

            const seerbit_response = response.data;
            const seerbit_response_data: SeerbitQueryResponse | undefined = seerbit_response.data;

            if (!seerbit_response_data?.code) {
                return {
                    error: {
                        code: 400,
                        message: seerbit_response.message ?? "Failed to verify transaction"
                    }
                };
            }

            return {
                data: {
                    status: seerbit_response_data.code,
                    raw_transaction_response: seerbit_response_data
                }
            };

        }
        catch (err: any) {
            return {
                error: {
                    code: 400,
                    message: err.response?.data?.message ?? "Failed to verify transaction"
                }
            };
        }
    }

    private async get_encrypted_key(): Promise<ServiceMethodReturnType<string>> {

        const cached_encrypted_key = await cache_repo.get("seerbit_encrypted_key");
        if (cached_encrypted_key) {
            return {
                data: cached_encrypted_key
            };
        }

        try {
            const response = await axios.post(
                `${this.base_url}/v2/encrypt/keys`,
                {
                    key: `${this.secret_key}.${this.public_key}`
                }
            );

            const seerbit_response = response.data;
            const encrypted_key = seerbit_response.data?.EncryptedSecKey?.encryptedKey;

            if (seerbit_response.data?.code !== "00" || !encrypted_key) {
                return {
                    error: {
                        code: 400,
                        message: seerbit_response.data?.message ?? seerbit_response.message ?? "Failed to get encrypted key"
                    }
                };
            }

            await cache_repo.set("seerbit_encrypted_key", encrypted_key, 30);

            return {
                data: encrypted_key
            };

        }
        catch (err: any) {
            return {
                error: {
                    code: 400,
                    message: err.response?.data?.message ?? "Failed to get encrypted key"
                }
            };
        }
    }

    resolve_webhook(payload: SeerbitWebhookPayload): ServiceMethodReturnType<ResolveWebhookResponse> {
        const code = payload?.payload?.code;
        const reference = payload?.payload?.paymentReference;

        if (!code || !reference) {
            return {
                error: {
                    code: 400,
                    message: "Invalid seerbit webhook payload"
                }
            };
        }

        return {
            data: {
                event: code === "00" ? "successful_transaction" : code === "01" ? "failed_transaction" : "unrecognized_event",
                status: payload.payload.paymentStatus ?? code,
                reference,
                raw_webhook_request: payload
            }
        };
    }
}

const seerbit_service = new SeerbitService();
export default seerbit_service;