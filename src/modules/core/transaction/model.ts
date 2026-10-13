import db from '@db/index.js';
import { TRANSACTION_TABLE_NAME, TransactionSchema } from '@db/schema/transaction';
import type { InferedSchemaType } from '@utils/schema_type.js';
import { TransactionInterface } from './type';
import { merchant_model } from '@modules/merchant/model';
import { customer_model } from '@modules/core/customer/model';

export const transaction_model = db.define(TRANSACTION_TABLE_NAME, TransactionSchema, { timestamps: true }) as InferedSchemaType<TransactionInterface>;

// Associations
transaction_model.belongsTo(merchant_model, { foreignKey: 'merchant_id' });
transaction_model.belongsTo(customer_model, { foreignKey: 'customer_id' });
customer_model.hasMany(transaction_model, { foreignKey: 'customer_id' });
