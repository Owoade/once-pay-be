import { merchant_model, api_keys_model } from './model.js';
import MerchantModelInterface, { ApiKeyInterface } from './type.js';

class MerchantRepo {
    constructor() {}

    async create(payload: MerchantModelInterface) {
        return (await merchant_model.create(payload))?.toJSON();
    }

    async find<T extends keyof MerchantModelInterface>(filter: Partial<MerchantModelInterface>, attributes?: T[]) {
        const merchant = await merchant_model.findOne({ where: filter, ...( attributes ? { attributes }: {}) });

        if( attributes ) return merchant?.toJSON() as Pick<MerchantModelInterface, T>;

        else return merchant?.toJSON() as MerchantModelInterface;
    }

    async update(filter: Partial<MerchantModelInterface>, payload: Partial<MerchantModelInterface>) {
        return await merchant_model.update(payload, { where: filter });
    }

    // API Key Methods
    async find_api_key<T extends keyof ApiKeyInterface>(filter: Partial<ApiKeyInterface>, attributes?: T[]) {
        const apiKey = await api_keys_model.findOne({ where: filter, ...( attributes ? { attributes }: {}) });

        if( attributes ) return apiKey?.toJSON() as Pick<ApiKeyInterface, T>;

        else return apiKey?.toJSON() as ApiKeyInterface;
    }

    async create_api_key(payload: ApiKeyInterface) {
        return (await api_keys_model.create(payload))?.toJSON();
    }

    async delete_api_key(filter: Partial<ApiKeyInterface>) {
        return await api_keys_model.destroy({ where: filter });
    }
}

const merchant_repo = new MerchantRepo();
export default merchant_repo;
