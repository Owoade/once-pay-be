import Joi from "joi";

export const id_validator_string = ( id: string ) => Joi.object({
    [id]: Joi.string().required()
}).required()