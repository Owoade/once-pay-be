import crypto from 'crypto';
import merchant_repo from './repo.js';
import { ApiKeyInterface } from './type.js';
import { ServiceMethodReturnType } from '@utils/type.js';
import { MERCHANT_API_KEY_ENCRYPTION_SECRET } from 'src/env/index.js';
import { Transaction } from 'sequelize';
import { TransactionInterface } from '@modules/core/transaction/type.js';
import transaction_repo from '@modules/core/transaction/repo.js';
import axios from 'axios';
import transaction_service from '@modules/core/transaction/service.js';

class MerchantService {
    constructor() {}

    private encrypt(text: string): string {
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

    async set_webhook_url(merchant_id: number, webhook_url: string): Promise<ServiceMethodReturnType<{ message: string }>> {
        const merchant = await merchant_repo.find({ id: merchant_id }, ['id']);
        if (!merchant) return {
            error: {
                code: 404,
                message: "Merchant not found"
            }
        };

        await merchant_repo.update({ id: merchant_id }, { webhook_url });

        return {
            data: {
                message: 'Webhook URL set successfully'
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

    // Developer tab payload: webhook URL + the decrypted API key.
    async get_developer_settings(merchant_id: number)
    : Promise<ServiceMethodReturnType<{ api_key: string, webhook_url: string }>> {
        const merchant = await merchant_repo.find({ id: merchant_id }, ['webhook_url']);
        if (!merchant) return {
            error: {
                code: 404,
                message: "Merchant not found"
            }
        };

        const { data, error } = await this.get_api_key_by_filter({ merchant_id });
        if (error) return { error };

        return {
            data: {
                api_key: data!.api_key,
                webhook_url: merchant.webhook_url ?? ""
            }
        };
    }

    async send_webhook(payload: TransactionInterface): Promise<ServiceMethodReturnType<{ webhook_not_set: boolean, webhook_sent: boolean }>> {
        const merchant = await merchant_repo.find({ id: payload.merchant_id }, ['webhook_url']);
        const api_key = await merchant_repo.find_api_key({ merchant_id: payload.merchant_id });
        if(!merchant){
            return {
                error: {
                    code: 404,
                    message: "Merchant not found"
                }
            }
        }

        if(!api_key){
            return {
                error: {
                    code: 404,
                    message: "API key not found"
                }
            }
        }
        
        if(!merchant.webhook_url){
            await transaction_repo.update({ id: payload.id }, { webhook_call_is_resolved: true, webhook_call_resolution_reason: 'Missing webhook URL' }); // Mark the transaction as failed due to missing webhook URL
            return {
                data: {
                    webhook_not_set: true,
                    webhook_sent: false
                }
            };
        }

        const deencrypted_key = this.decrypt(api_key.key);
        payload = transaction_service.sanitize_transaction(payload) as TransactionInterface;

        try {
            const request_body = {
                event: "transaction.success",
                data: payload
            };
            const signature = this.get_webhook_signature(request_body, deencrypted_key);
            await axios.post(merchant.webhook_url, request_body, {
                headers: {
                    'X-Signature': signature
                }
            });
          
            return {
                data: {
                    webhook_not_set: false,
                    webhook_sent: true
                }
            }
        }
        catch (e) {
            console.log(e)
            return {
                data: {
                    webhook_not_set: false,
                    webhook_sent: false
                }
            };
        }

    }

    private get_webhook_signature(payload: any, api_key: string): string {
        return crypto.createHmac('sha256', api_key).update(JSON.stringify(payload)).digest('hex');
    }

}

const merchant_service = new MerchantService();
export default merchant_service;
