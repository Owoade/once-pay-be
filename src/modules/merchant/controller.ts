import ServiceDecorator from "@decorators/index";
import respond from "@utils/respond";
import { id_validator_string } from "@validators/utils";
import { Request, Response } from "express";
import merchant_service from "@modules/merchant/service";
import transaction_service from "@modules/core/transaction/service";
import { set_webhook_url_validator, transactions_list_validator } from "@validators/merchant";

@ServiceDecorator.forMerchantTokenValidation()
class MerchantController {
    constructor() {}

    async get_merchant_api_key(request: Request, response: Response) {

        const merchant_id = response.locals.merchant_id;
        const { data, error } = await merchant_service.get_api_key_by_filter({ merchant_id });

        return respond(response, {
            status: error ? "error" : "success",
            status_code: error ? error.code : 200,
            ...(error ? {} : { data: { api_key: data?.api_key ?? null } }),
            message: error?.message ?? "Merchant API key retrieved successfully",
        });

    }

    // /developers: the merchant's webhook URL + decrypted API key.
    async get_developer_settings(request: Request, response: Response) {
        const merchant_id = response.locals.merchant_id;
        const { data, error } = await merchant_service.get_developer_settings(merchant_id);

        return respond(response, {
            status: error ? "error" : "success",
            status_code: error ? error.code : 200,
            data: data ?? null,
            message: error?.message ?? "Developer settings retrieved successfully",
        });
    }

    async get_transaction_summary(request: Request, response: Response) {
        const merchant_id = response.locals.merchant_id;
        const { data, error } = await transaction_service.get_transaction_summary(merchant_id);

        return respond(response, {
            status: error ? "error" : "success",
            status_code: error ? error.code : 200,
            data: data ?? null,
            message: error?.message ?? "Transaction summary retrieved successfully",
        });
    }

    @ServiceDecorator.forRequestPayloadValidation(transactions_list_validator, "query")
    async get_merchant_transactions(request: Request, response: Response) {
        const merchant_id = response.locals.merchant_id;
        const { data, error } = await transaction_service.get_merchant_transactions(merchant_id, {
            limit: request.query.limit as any,
            offset: request.query.offset as any,
            status: request.query.status as any,
        });

        return respond(response, {
            status: error ? "error" : "success",
            status_code: error ? error.code : 200,
            data: data ?? null,
            message: error?.message ?? "Transactions retrieved successfully",
        });
    }

    @ServiceDecorator.forRequestPayloadValidation(id_validator_string("reference"), "params")
    async get_transaction_by_reference(request: Request, response: Response) {
        const merchant_id = response.locals.merchant_id;
        const reference = request.params.reference;
        const verify = request.query.verify === "1";

        const { data, error } = await transaction_service.get_merchant_transaction(
            merchant_id, reference, verify,
        );

        console.log({data, error})

        return respond(response, {
            status: error ? "error" : "success",
            status_code: error ? error.code : 200,
            data: data ?? null,
            message: error?.message ?? "Transaction retrieved successfully",
        });
    }

    @ServiceDecorator.forRequestPayloadValidation(set_webhook_url_validator)
    async set_webhook_url(request: Request, response: Response) {
        const merchant_id = response.locals.merchant_id;
        const { webhook_url } = request.body;

        const { data, error } = await merchant_service.set_webhook_url(merchant_id, webhook_url);

        return respond(response, {
            status: error ? "error" : "success",
            status_code: error ? error.code : 200,
            ...(error ? {} : { data }),
            message: error?.message ?? "Webhook URL set successfully",
        });
    }
}

const merchant_controller = new MerchantController();
export default merchant_controller;