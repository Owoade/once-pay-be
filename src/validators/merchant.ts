import Joi from "joi";

export const set_webhook_url_validator = Joi.object({
    webhook_url: Joi.string().uri().required()
}).required()

export const transactions_list_validator = Joi.object({
    limit: Joi.number().integer().min(1).max(50).optional(),
    offset: Joi.number().integer().min(0).optional(),
    status: Joi.string().valid('successful', 'pending', 'failed').optional()
})