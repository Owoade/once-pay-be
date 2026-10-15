import crypto from 'crypto';
import merchant_repo from './repo.js';
import { ApiKeyInterface } from './type.js';
import { ServiceMethodReturnType } from '@utils/type.js';
import { MERCHANT_API_KEY_ENCRYPTION_SECRET } from 'src/env/index.js';
import { Transaction } from 'sequelize';

class MerchantService {
    constructor() {}

    private encrypt(text: string): string {
        console.log({MERCHANT_API_KEY_ENCRYPTION_SECRET})
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(MERCHANT_API_KEY_ENCRYPTION_SECRET), iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const tag = cipher.getAuthTag().toString('hex');

        return `${iv.toString('hex')}:${tag}:${encrypted}`;
    }

    private decrypt(encryptedData: string): string {
        const [ivHex, tagHex, ciphertextHex] = encryptedData.split(':');
        if (!ivHex || !tagHex || !ciphertextHex) {
            throw new Error("Invalid encrypted data format");
        }

        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(MERCHANT_API_KEY_ENCRYPTION_SECRET), iv);

        decipher.setAuthTag(tag);

        let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    async generate_api_key(merchant_id: number, transaction: Transaction) {
        const key_id = crypto.randomBytes(4).toString('hex');
        const secret = crypto.randomBytes(32).toString('hex');

        const api_key = `pk_${key_id}_${secret}`;
        const encrypted_key = this.encrypt(api_key);

        const payload = {
            merchant_id,
            key_id,
            key: encrypted_key,
        } as ApiKeyInterface;

        await merchant_repo.create_api_key(payload, transaction);

        return {
            api_key_id: key_id,
            api_key,
        };
    }

    async verify_api_key(api_key: string): Promise<ServiceMethodReturnType<{ merchant_id: number }>> {
        const parts = api_key.split('_');
        if (parts.length !== 3 || parts[0] !== 'pk') return {
            error: {
                code: 400,
                message: "Invalid API key format"
            }
        };

        const key_id = parts[1];

        const record = await merchant_repo.find_api_key({ key_id }, ['key', 'merchant_id']);
        if (!record) return {
            error: {
                code: 404,
                message: "API key not found"
            }
        };

        try {
            const decrypted_key = this.decrypt(record.key);

            // Convert both to buffers for timingSafeEqual
            const incoming_buf = Buffer.from(api_key);
            const stored_buf = Buffer.from(decrypted_key);

            if (incoming_buf.length !== stored_buf.length || !crypto.timingSafeEqual(incoming_buf, stored_buf)) {
                return {
                    error: {
                        code: 401,
                        message: "Invalid API key"
                    }
                };
            }
        } catch (e) {
            return {
                error: {
                    code: 401,
                    message: "Invalid API key"
                }
            };
        }

        return {
            data: {
                merchant_id: record.merchant_id
            }
        };
    }

    async get_api_key_by_filter(filter: Partial<ApiKeyInterface>): Promise<ServiceMethodReturnType<{ api_key: string }>> {
        const record = await merchant_repo.find_api_key(filter, ['key']);
        if (!record) return {
            error: {
                code: 404,
                message: "API key not found"
            }
        };

        try {
            const decrypted_key = this.decrypt(record.key);
            return {
                data: {
                    api_key: decrypted_key
                }
            };
        } catch (e) {
            return {
                error: {
                    code: 500,
                    message: "Failed to decrypt API key"
                }
            };
        }
    }
}

const merchant_service = new MerchantService();
export default merchant_service;
