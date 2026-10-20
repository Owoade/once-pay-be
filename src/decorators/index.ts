
import crypto from "crypto";
import { Request, Response } from "express";
import Joi from "joi";
import respond from "@utils/respond";
import auth_service from "@modules/auth/service";
import merchant_service from "@modules/merchant/service";
import {
  PAYSTACK_SECRET_KEY,
  FLUTTERWAVE_SECRET_KEY,
  KORAPAY_SECRET_KEY,
  MONIFY_SECRET_KEY,
} from "src/env";
import { TransactionInterface } from "@modules/core/transaction/type";

type WebhookGateway = TransactionInterface['payment_gateway']

function timing_safe_equal(a: string, b: string): boolean {
  const buf_a = Buffer.from(a);
  const buf_b = Buffer.from(b);
  return buf_a.length === buf_b.length && crypto.timingSafeEqual(buf_a, buf_b);
}

// Each gateway signs/attaches its webhook signature differently.
const webhook_signature_verifiers: Record<WebhookGateway, (req: Request) => boolean> = {
  
  paystack: (req) => {
    const signature = req.headers["x-paystack-signature"] as string | undefined;
    if (!signature || !(req as any).rawBody) return false;

    const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update((req as any).rawBody).digest("hex");
    return timing_safe_equal(hash, signature);
  },
  
  flutterwave: (req) => {
    const signature = req.headers["verif-hash"] as string | undefined;
    if (!signature) return false;

    return timing_safe_equal(signature, FLUTTERWAVE_SECRET_KEY);
  },
  
  korapay: (req) => {
    const signature = req.headers["x-korapay-signature"] as string | undefined;
    if (!signature || !req.body?.data) return false;

    const hash = crypto.createHmac("sha256", KORAPAY_SECRET_KEY).update(JSON.stringify(req.body.data)).digest("hex");
    return timing_safe_equal(hash, signature);
  },
  
  monnify: (req) => {
    const signature = req.headers["x-monify-signature"] as string | undefined;
    if (!signature || !(req as any).rawBody) return false;

    const hash = crypto.createHmac("sha512", MONIFY_SECRET_KEY).update((req as any).rawBody).digest("hex");
    return timing_safe_equal(hash, signature);
  },

  seerbit: () => false,
};

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

  static forWebhookSignatureValidation() {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const value = descriptor?.value;

      descriptor.value = async function (...args: [Request, Response]) {
        const [request, response] = args;

        const gateway = request.params?.provider as WebhookGateway;
        const is_valid_signature = gateway && webhook_signature_verifiers[gateway]?.(request);

        if (!is_valid_signature) {
          return respond(response, {
            status: "error",
            status_code: 401,
            data: {},
            message: "Invalid webhook signature",
          });
        }

        return value.apply(this, args);
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

        response.locals.merchant_id = payload.id;

        return original_method.apply(this, args);
      };

      Object.defineProperty(target.prototype, propertyKey, descriptor);
    }

    return target;
  };
}
  static forMerchantApiKeyValidation() {
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

          if (request.url?.includes("/transaction/callback") || request.url?.includes("/whitelist")) {
            return original_method.apply(this, args);
          }

          const auth_header = request.headers.authorization;

          if (!auth_header?.startsWith("Bearer ")) {
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

          const { error, data } = await merchant_service.verify_api_key(apiKey);
          if (error) {
            return respond(response, {
              status: "error",
              status_code: 401,
              data: {},
              message: error.message,
            });
          }

          response.locals.merchant_id = data!.merchant_id;

          return original_method.apply(this, args);
        };

        Object.defineProperty(target.prototype, propertyKey, descriptor);
      }

      return target;
    };
  }
}

export default ServiceDecorator;