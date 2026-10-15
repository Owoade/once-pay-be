import ServiceDecorator from "@decorators/index";
import { initiate_transaction_validator, verify_transaction_from_callback_url_validator } from "@validators/merchant-api";
import { id_validator_string } from "@validators/utils";
import { Request, Response } from "express";
import { InitiateTransactionFromAPI } from "./type";
import merchant_api_service from "./service";
import respond from "@utils/respond";
import { TransactionInterface } from "@modules/core/transaction/type";

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

        if(response.data)
            response.data = merchant_api_service.sanitize_transaction(response.data) as TransactionInterface;
            
        return respond(res, {
            status: 'success',
            data: response.data,
            status_code: 200
        });
    }

    @ServiceDecorator.forRequestPayloadValidation(id_validator_string("trx_reference"), "params")
    async get_transaction_by_reference(req: Request, res: Response){
        const params = req.params;
        const merchant_id = res.locals.merchant_id;

        const response = await merchant_api_service.verify_transaction({
            reference: params.trx_reference,
            merchant_id
        });

        if(response.error){
            return respond(res, {
                status: 'error',
                message: response.error.message,
                status_code: response.error.code
            });
        }

        if(response.data)
            response.data = merchant_api_service.sanitize_transaction(response.data) as TransactionInterface;

        return respond(res, {
            status: 'success',
            data: response.data,
            status_code: 200
        });
    }
}

const merchant_api_controller = new MerchantApiController();
export default merchant_api_controller;