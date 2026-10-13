import { customer_model } from './model.js';
import { CustomerInterface } from './type.js';

class CustomerRepo {
    constructor() {}

    async create(payload: CustomerInterface) {
        return (await customer_model.create(payload))?.toJSON();
    }

    async find<T extends keyof CustomerInterface>(filter: Partial<CustomerInterface>, attributes?: T[]) {
        const customer = await customer_model.findOne({ where: filter, ...( attributes ? { attributes }: {}) });

        if( attributes ) return customer?.toJSON() as Pick<CustomerInterface, T>;

        else return customer?.toJSON() as CustomerInterface;
    }

    async update(filter: Partial<CustomerInterface>, payload: Partial<CustomerInterface>) {
        return await customer_model.update(payload, { where: filter });
    }
}

const customer_repo = new CustomerRepo();
export default customer_repo;
