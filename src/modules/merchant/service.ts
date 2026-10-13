import crypto from 'crypto';
import merchant_repo from './repo.js';
import { ApiKeyInterface } from './type.js';
import { ServiceMethodReturnType } from '@utils/type.js';

class MerchantService {
    constructor() {}

    async generate_api_key(merchant_id: number) {
        const key_id = crypto.randomBytes(4).toString('hex');
        const secret = crypto.randomBytes(32).toString('hex');

        const api_key = `pk_${key_id}_${secret}`;
        const hashed_key = crypto.createHash('sha256').update(api_key).digest('hex');

        const payload = {
            merchant_id,
            key_id,
            key: hashed_key,
        } as ApiKeyInterface;

        await merchant_repo.create_api_key(payload);

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

        const incoming = crypto.createHash('sha256').update(api_key).digest();
        const stored = Buffer.from(record.key, 'hex');

        if (incoming.length !== stored.length || !crypto.timingSafeEqual(incoming, stored)) {
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
}

const merchant_service = new MerchantService();
export default merchant_service;
