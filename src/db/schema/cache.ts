import schema_type from '@utils/schema_type';
import { ModelAttributes } from 'sequelize';

export const CacheSchema = {
    id: schema_type.primary_key(),
    key: schema_type.unique(() => schema_type.string()),
    value: schema_type.text(),
    expiry: schema_type.date(),
    createdAt: schema_type.date(),
    updatedAt: schema_type.date()
};

export const CACHE_TABLE_NAME = 'cache';
