import schema_type from "@utils/schema_type.js";


export const MerchantSchema = {
    id: schema_type.primary_key(),
    name: schema_type.string(),
    email: schema_type.unique(() => schema_type.string()),
    password: schema_type.optional(() => schema_type.string()),
    auth_channel: schema_type.optional(() => schema_type.string()),
    api_key: schema_type.unique(() => schema_type.string()),
    api_key_id: schema_type.unique(() => schema_type.string()),
};

export const MERCHANT_TABLE_NAME = 'Merchants';
