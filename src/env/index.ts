import dotenv from 'dotenv';
import Joi from 'joi';
dotenv.config();

const env_validator = Joi.object({
  JWT_SECRET: Joi.string().required(),
  PLUNK_API_KEY: Joi.string().required(),
  PLUNK_SENDER_EMAIL: Joi.string().required(),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_REDIRECT_URI: Joi.string().required(),
  SSO_PASSWORD: Joi.string().required(),
  PAYSTACK_SECRET_KEY: Joi.string().required(),
  BACKEND_BASE_URL: Joi.string().required(),
  FLUTTERWAVE_SECRET_KEY: Joi.string().required(),
  KORAPAY_SECRET_KEY: Joi.string().required(),
  MONIFY_API_KEY: Joi.string().required(),
  MONIFY_SECRET_KEY: Joi.string().required(),
  MERCHANT_API_KEY_ENCRYPTION_SECRET: Joi.string().required(),
  SEERBIT_PUBLIC_KEY: Joi.string().required(),
  SEERBIT_SECRET_KEY: Joi.string().required(),
  R2_BUCKET_NAME: Joi.string().required(),
  R2_ACCESS_KEY_ID: Joi.string().required(),
  R2_SECRET_ACCESS_KEY: Joi.string().required(),
  R2_ENDPOINT_URL: Joi.string().required(),
  SQLITE_FILE: Joi.string().required(),
  // Optional: when unset, telegram notifications are skipped (signup is unaffected).
  TELEGRAM_BOT_TOKEN: Joi.string().default(''),
  TELEGRAM_CHAT_IDS: Joi.string().default(''),
}).unknown(true);


const { error, value: env } = env_validator.validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const JWT_SECRET = env.JWT_SECRET;
export const PLUNK_API_KEY = env.PLUNK_API_KEY;
export const PLUNK_SENDER_EMAIL = env.PLUNK_SENDER_EMAIL;
export const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
export const GOOGLE_REDIRECT_URI = env.GOOGLE_REDIRECT_URI;
export const SSO_PASSWORD = env.SSO_PASSWORD;
export const PAYSTACK_SECRET_KEY = env.PAYSTACK_SECRET_KEY;
export const BACKEND_BASE_URL = env.BACKEND_BASE_URL;
export const FLUTTERWAVE_SECRET_KEY = env.FLUTTERWAVE_SECRET_KEY;
export const KORAPAY_SECRET_KEY = env.KORAPAY_SECRET_KEY;
export const MONIFY_API_KEY = env.MONIFY_API_KEY;
export const MONIFY_SECRET_KEY = env.MONIFY_SECRET_KEY;
export const MERCHANT_API_KEY_ENCRYPTION_SECRET = env.MERCHANT_API_KEY_ENCRYPTION_SECRET;
export const SEERBIT_PUBLIC_KEY = env.SEERBIT_PUBLIC_KEY;
export const SEERBIT_SECRET_KEY = env.SEERBIT_SECRET_KEY;
export const R2_BUCKET_NAME = env.R2_BUCKET_NAME; 
export const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
export const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
export const R2_ENDPOINT_URL = env.R2_ENDPOINT_URL;
export const SQLITE_FILE = env.SQLITE_FILE;
export const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
export const TELEGRAM_CHAT_IDS = env.TELEGRAM_CHAT_IDS;

