import db from '@db/index.js';
import { CACHE_TABLE_NAME, CacheSchema } from '@db/schema/cache.js';

export const cache_model = db.define(CACHE_TABLE_NAME, CacheSchema, { timestamps: true });
