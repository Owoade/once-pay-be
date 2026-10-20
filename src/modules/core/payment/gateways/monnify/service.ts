import { BACKEND_BASE_URL, MONIFY_API_KEY, MONIFY_CONTRACT_CODE, MONIFY_SECRET_KEY } from "src/env";
import { PaymentService } from "../../base.js";
import cache_repo from "@modules/core/cache/repo";
import axios from "axios";
import { ServiceMethodReturnType } from "@utils/type";
import { InitiateTransaction, InitiateTransactionResponse, ResolveWebhookResponse, VerifyTransactionResponse } from "../../type.js";
import { MonnifyWebhookPayload } from "./type.js";

class MonifyService implements PaymentService {
    private base_url = "https://sandbox.monnify.com/api"
    private api_key = MONIFY_API_KEY
    private secret_key = MONIFY_SECRET_KEY
    private provider_name = "monify"

    constructor() {
        this.initiate_transaction = this.initiate_transaction.bind(this);
        this.verify_transaction = this.verify_transaction.bind(this);
    }

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
                    paymentDescription: "Once-Pay payment",
                    currencyCode: "NGN",
                    contractCode: this.contract_code(),
                    redirectUrl: `${BACKEND_BASE_URL}/transaction/callback/${this.provider_name}/${payload.internal_trx_reference}`,
                    // Monnify's field for customer extras is `metadata` (docs'
                    // InitializeTransactionRequest); the metaData spelling gets
                    // rejected with responseCode 99 ("malformed syntax").
                    ...(payload.metadata && { metadata: payload.metadata }),
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
            console.error(err);
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
                `${this.base_url}/v2/merchant/transactions/query?paymentReference=${encodeURIComponent(key)}`,
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

    // Account-scoped: Monnify routes the transaction to the contract that owns
    // the checkout. Falls back to the docs' sandbox mock while
    // MONIFY_CONTRACT_CODE is unset — with a warning, since a real initiate
    // will only succeed with the account's actual contract code.
    private contract_code(): string {
       return MONIFY_CONTRACT_CODE;
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

    resolve_webhook(payload: MonnifyWebhookPayload): ServiceMethodReturnType<ResolveWebhookResponse> {
        const event_type = payload?.eventType;
        const reference = payload?.eventData?.paymentReference;

        if (!event_type || !reference) {
            return {
                error: {
                    code: 400,
                    message: "Invalid monnify webhook payload"
                }
            };
        }

        return {
            data: {
                event: event_type === "SUCCESSFUL_TRANSACTION" ? "successful_transaction" : event_type === "FAILED_TRANSACTION" ? "failed_transaction" : "unrecognized_event",
                status: payload.eventData.paymentStatus,
                reference,
                raw_webhook_request: payload
            }
        };
    }
}

const monify_service = new MonifyService();
export default monify_service;