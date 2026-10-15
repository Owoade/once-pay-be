import Joi from "joi";

export const initiate_transaction_validator = Joi.object({
    amount: Joi.number().required(),
    email: Joi.string().email().required(),
    payment_gateway: Joi.string().valid("flutterwave", "paystack", "korapay", "monnify", "squadco").required(),
    callback_url: Joi.string().uri(),
    metadata: Joi.object(),
}).required();

export const verify_transaction_from_callback_url_validator = Joi.object({
    payment_gateway: Joi.string().valid("flutterwave", "paystack", "korapay", "monnify", "squadco").required(),
    trx_reference: Joi.string().required() 
}).required();