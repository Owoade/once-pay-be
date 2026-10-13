import schema_type from '@utils/schema_type';

export const API_KEYS_TABLE_NAME = 'api_keys';

export const ApiKeysSchema = {
    id: schema_type.primary_key(),
    merchant_id: schema_type.int(),
    key_id: schema_type.string(),
    key: schema_type.string(), // This will store the hash of the API key
};
