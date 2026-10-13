import { BACKEND_BASE_URL, MONIFY_API_KEY, MONIFY_SECRET_KEY } from "src/env";
import { PaymentService } from "../../base";
import cache_repo from "@modules/core/cache/repo";
import axios from "axios";
import { ServiceMethodReturnType } from "@utils/type";
import { InitiateTransaction, InitiateTransactionResponse, VerifyTransactionResponse } from "../../type";

class MonifyService implements PaymentService {
    private base_url = "https://sandbox.monnify.com/api/"
    private api_key = MONIFY_API_KEY
    private secret_key = MONIFY_SECRET_KEY
    private provider_name = "monify"

    constructor() {}

    async initiate_transaction(payload: InitiateTransaction): Promise<ServiceMethodReturnType<InitiateTransactionResponse>> {
        const {data: access_token, error} = await this.get_access_token();
        if (error) {
            return {
                error
            };
        }

        try {
            const response = await axios.post(
                `${this.base_url}/v1/merchant/transactions/init-transaction`,
                {
                    amount: payload.amount,
                    customerEmail: payload.email,
                    paymentReference: payload.internal_trx_reference,
                    currencyCode: "NGN",
                    redirectUrl: `${BACKEND_BASE_URL}/transaction/${this.provider_name}/${payload.internal_trx_reference}`,
                },
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`
                    }
                }
            );

            const monify_response = response.data;
            if (!monify_response.requestSuccessful) {
                return {
                    error: {
                        code: 400,
                        message: monify_response.responseMessage ?? "Failed to initiate transaction"
                    }
                };
            }

            const monify_response_data = monify_response.responseBody;

            return {
                data: {
                    payment_link: monify_response_data.checkoutUrl,
                    transaction_reference: payload.internal_trx_reference
                }
            };

        }
        catch (err: any) {
            return {
                error: {
                    code: 400,
                    message: err.response?.data?.responseMessage ?? err.response?.message ?? "Failed to initiate transaction"
                }
            };
        }
        
    }

    async verify_transaction(key: string): Promise<ServiceMethodReturnType<VerifyTransactionResponse>> {
        
        const {data: access_token, error} = await this.get_access_token();
        if (error) {
            return {
                error
            };
        }

        try {
            const response = await axios.get(
                `${this.base_url}/v2/merchant/transactions/query?transactionReference=${key}`,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`
                    }
                }
            )
            const monify_response = response.data;
            if (!monify_response.requestSuccessful) {
                return {
                    error: {
                        code: 400,
                        message: monify_response.responseMessage ?? "Failed to verify transaction"
                    }
                };
            }

            const monify_response_data = monify_response.responseBody;

            return {
                data: {
                    status: monify_response_data.paymentStatus,
                    raw_transaction_response: monify_response_data
                }
            };

        }
        catch (err: any) {
            return {
                error: {
                    code: 400,
                    message: err.response?.data?.responseMessage ?? err.response?.message
                }
            };
        }

    }

    private async get_access_token(): Promise<ServiceMethodReturnType<string>> {

        const cached_access_token = await cache_repo.get("monify_access_token");
        if (cached_access_token) {
            return {
                data: cached_access_token
            };
        }

        try {

            const response = await axios.post(
                `${this.base_url}/v1/auth/login`,
                {},
                {
                    headers: {
                        Authorization: `Basic ${Buffer.from(`${this.api_key}:${this.secret_key}`).toString('base64')}`
                    }
                }
            );

            const monify_response = response.data
            if (!monify_response.requestSuccessful){
                return {
                    error: {
                        code: 400,
                        message: monify_response.responseMessage ?? "Failed to get access token"
                    }
                };
            }

            const access_token = response.data.responseBody.accessToken;
            await cache_repo.set("monify_access_token", access_token, 50);

            return {
                data: access_token
            };

        }
        catch (err: any) {
            return {
                error: {
                    code: 400,
                    message: err.response.data.responseMessage ?? err.response.message
                }
            }
        }
    }
}

const monify_service = new MonifyService();
export default monify_service;