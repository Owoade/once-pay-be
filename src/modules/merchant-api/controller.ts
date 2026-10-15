import ServiceDecorator from "@decorators/index";
import { initiate_transaction_validator, verify_transaction_from_callback_url_validator } from "@validators/merchant-api";
import { Request, Response } from "express";
import { InitiateTransactionFromAPI } from "./type";
import merchant_api_service from "./service";
import transaction_service from "@modules/core/transaction/service";
import { TransactionInterface } from "@modules/core/transaction/type";
import respond from "@utils/respond";

@ServiceDecorator.forMerchantApiKeyValidation()
class MerchantApiController {
    constructor(){}

    @ServiceDecorator.forRequestPayloadValidation(initiate_transaction_validator)
    async initiate_transaction(req: Request, res: Response){
        const merchant_id = res.locals.merchant_id;
        const payload = req.body as InitiateTransactionFromAPI;
        payload.merchant_id = merchant_id;

        const response = await merchant_api_service.initiate_transaction(payload);
        if(response.error){
            return respond(res, {
                status: 'error',
                message: response.error.message,
                status_code: response.error.code
            });
        }

        return respond(res, {
            status: 'success',
            data: response.data,
            status_code: 200
        });
    }

    @ServiceDecorator.forRequestPayloadValidation(verify_transaction_from_callback_url_validator, "params")
    async verify_transaction_from_callback(req: Request, res: Response){
        const params = req.params;

        const response = await merchant_api_service.verify_transaction_from_callback({
            payment_gateway: params.payment_gateway,
            trx_reference: params.trx_reference
        })

        if(response.error){
            return respond(res, {
                status: 'error',
                message: response.error.message,
                status_code: response.error.code
            });
        }

        return respond(res, {
            status: 'success',
            data: response.data,
            status_code: 200
        });
    }
}

const merchant_api_controller = new MerchantApiController();
export default merchant_api_controller;