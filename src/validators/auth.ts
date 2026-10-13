import Joi from "joi";

export const signup_validator = Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(3).required(),
    password: Joi.string().min(8).required()
}).required()

export const signin_validator = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
}).required()

export const forgot_password_validator = Joi.object({
    email: Joi.string().email().required()
}).required()

export const reset_password_validator = Joi.object({
    password: Joi.string().min(8).required(),
    otp: Joi.string().required()
}).required()