import db from '@db/index.js';
import { MERCHANT_TABLE_NAME, MerchantSchema } from '@db/schema/merchant';
import { API_KEYS_TABLE_NAME, ApiKeysSchema } from '@db/schema/api_keys';
import type { InferedSchemaType } from '@utils/schema_type.js';
import MerchantModelInterface, { ApiKeyInterface } from './type';
import { customer_model } from '@modules/core/customer/model';

export const merchant_model = db.define(MERCHANT_TABLE_NAME, MerchantSchema, { timestamps: true }) as InferedSchemaType<MerchantModelInterface>;
export const api_keys_model = db.define(API_KEYS_TABLE_NAME, ApiKeysSchema, { timestamps: true }) as InferedSchemaType<ApiKeyInterface>;

// Associations
merchant_model.hasMany(api_keys_model, { foreignKey: 'merchant_id' });
api_keys_model.belongsTo(merchant_model, { foreignKey: 'merchant_id' });
customer_model.belongsTo(merchant_model, { foreignKey: 'merchant_id' });
customer_model.belongsTo(merchant_model, { foreignKey: 'merchant_id' });