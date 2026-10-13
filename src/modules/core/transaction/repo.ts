import { transaction_model } from './model.js';
import { TransactionInterface } from './type.js';

class TransactionRepo {
    constructor() {}

    async create(payload: TransactionInterface) {
        return (await transaction_model.create(payload))?.toJSON();
    }

    async find<T extends keyof TransactionInterface>(filter: Partial<TransactionInterface>, attributes?: T[]) {
        const transaction = await transaction_model.findOne({ where: filter, ...( attributes ? { attributes }: {}) });

        if( attributes ) return transaction?.toJSON() as Pick<TransactionInterface, T>;

        else return transaction?.toJSON() as TransactionInterface;
    }

    async update(filter: Partial<TransactionInterface>, payload: Partial<TransactionInterface>) {
        return await transaction_model.update(payload, { where: filter });
    }
}

const transaction_repo = new TransactionRepo();
export default transaction_repo;
