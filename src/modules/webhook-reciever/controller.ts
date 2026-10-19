import ServiceDecorator from "@decorators/index";
import transaction_service from "@modules/core/transaction/service";
import { TransactionInterface } from "@modules/core/transaction/type";
import respond from "@utils/respond";
import { id_validator_string } from "@validators/utils";
import { Request, Response } from "express";

class WebhookReceiverController {
    constructor() {}

    @ServiceDecorator.forWebhookSignatureValidation()
    @ServiceDecorator.forRequestPayloadValidation(id_validator_string('provider'), 'params')
    async handle_webhook(request: Request, response: Response) {
        const gateway = request.params?.provider as TransactionInterface['payment_gateway'];

        respond(response, {
            status: "success",
            status_code: 200,
            data: {},
            message: `Webhook received for gateway: ${gateway}`,
        });

        await transaction_service.handle_webhook(gateway, request.body);
    }
}

const webhook_reciever_controller = new WebhookReceiverController();
export default webhook_reciever_controller;