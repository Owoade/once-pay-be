import db from '@db/index.js';
import { CUSTOMER_TABLE_NAME, CustomerSchema } from '@db/schema/customer';
import type { InferedSchemaType } from '@utils/schema_type.js';
import { CustomerInterface } from './type.js';
import { merchant_model } from '@modules/merchant/model';

export const customer_model = db.define(CUSTOMER_TABLE_NAME, CustomerSchema, { timestamps: true }) as InferedSchemaType<CustomerInterface>;
