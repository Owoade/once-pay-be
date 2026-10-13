import { cache_model } from './model.js';
import { Op } from 'sequelize';
import moment from 'moment';

class CacheRepo {
    async set(key: string, value: any, ttlMinutes: number = 10) {
        const expiry = moment().add(ttlMinutes, 'minutes').toDate();

        const record = await cache_model.upsert({
            key,
            value: typeof value === 'string' ? value : JSON.stringify(value),
            expiry
        });

        return record;
    }

    async get(key: string) {
        const record = await cache_model.findOne({
            where: {
                key,
                expiry: { [Op.gt]: moment().toDate() }
            }
        });

        if (!record) return null;

        return (record.toJSON()).value;
    }

    async delete(key: string) {
        return await cache_model.destroy({ where: { key } });
    }
}

export default new CacheRepo();
