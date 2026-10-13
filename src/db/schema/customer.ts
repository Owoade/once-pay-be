import schema_type from '@utils/schema_type';

export const CUSTOMER_TABLE_NAME = 'customers';

export const CustomerSchema = {
    id: schema_type.primary_key(),
    merchant_id: schema_type.int(),
    email: schema_type.unique(() => schema_type.string()),
};
