
import { Request, Response } from "express";
import Joi from "joi";
import respond from "@utils/respond";
import auth_service from "@modules/auth/service";
import merchant_service from "@modules/merchant/service";

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

  static forMerchantTokenValidation() {
  return function <T extends new (...args: any[]) => any>(target: T) {
    for (const propertyKey of Object.getOwnPropertyNames(target.prototype)) {
      if (propertyKey === "constructor") continue;

      const descriptor = Object.getOwnPropertyDescriptor(
        target.prototype,
        propertyKey
      );

      if (!descriptor || typeof descriptor.value !== "function") continue;

      const original_method = descriptor.value;

      descriptor.value = async function (...args: [Request, Response]) {
        const [request, response] = args;

        const auth_header = request.headers.authorization;

        if (!auth_header?.startsWith("Bearer ")) {
          return respond(response, {
            status: "error",
            status_code: 401,
            data: {},
            message: "Missing merchant token",
          });
        }

        const token = auth_header.split(" ")[1];

        if (!token) {
          return respond(response, {
            status: "error",
            status_code: 401,
            data: {},
            message: "Missing merchant token",
          });
        }

        const payload = auth_service.verify_token(token);

        if (!payload) {
          return respond(response, {
            status: "error",
            status_code: 401,
            data: {},
            message: "Invalid token",
          });
        }

        response.locals.merchant_id = payload.merchant_id;

        return original_method.apply(this, args);
      };

      Object.defineProperty(target.prototype, propertyKey, descriptor);
    }

    return target;
  };
}
  static forMerchantApiKeyValidation() {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const value = descriptor?.value;

      descriptor.value = async function (...args: [Request, Response]) {
        const [request, response] = args;

        const auth_header = request.headers["Authorization"] as string;

        if (!auth_header.startsWith("Bearer")) {
          return respond(response, {
            status: "error",
            status_code: 401,
            data: {},
            message: "Missing merchant API key",
          });
        }

        const apiKey = auth_header.split(" ")[1];
        if (!apiKey) {
          return respond(response, {
            status: "error",
            status_code: 401,
            data: {},
            message: "Missing merchant API key",
          });
        }

        const {error, data} = await merchant_service.verify_api_key(apiKey);
        if(error){
          return respond(response, {
            status: "error",
            status_code: 401,
            data: {},
            message: error.message,
          });
        }

        response.locals.merchant_id = data!.merchant_id;

        const result = await value.apply(this, args);
        return result;
      };

    };
  }
}

export default ServiceDecorator;