import ServiceDecorator from "@decorators/index";
import respond from "@utils/respond";
import { Request, Response } from "express";
import merchant_service from "@modules/merchant/service";

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
}

const merchant_controller = new MerchantController();
export default merchant_controller;