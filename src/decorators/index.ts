
import { Request, Response } from "express";
import Joi from "joi";
import respond from "@utils/respond";

abstract class ServiceDecorator {
  static forRequestPayloadValidation(
    validator: Joi.ObjectSchema,
    type?: "body" | "query" | "params",
    property?: string,
    stringified?: boolean
  ) {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const value = descriptor?.value;

      descriptor.value = async function (...args: [Request, Response]) {

        const [request, response] = args;

        let payload = request[type ?? "body"] ?? request;

        const { error } = validator.validate(payload);

        if (!request?.body && error) return console.error(error?.message);

        if (error) {
          return respond(response, {
            status: "error",
            status_code: 400,
            data: {},
            message: error?.message ?? "Invalid request payload",
          });
        }

        const result = await value.apply(this, args);
        return result;
      };

    };
  }
}

export default ServiceDecorator;