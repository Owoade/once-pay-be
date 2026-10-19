import { QueryTypes, Op } from 'sequelize';
import db from '@db/index.js';
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
        const updated_trx = await transaction_model.update(payload, { where: filter, returning: true });
        return updated_trx?.[1]?.[0]?.toJSON();
    }

    async increment_trx_sync_attempt(filter: Partial<TransactionInterface>) {
       await transaction_model.increment('trx_sync_attempt', { where: filter, by: 1 });
    }

    async increment_webhook_retry_count(filter: Partial<TransactionInterface>) {
       await transaction_model.increment('webhook_retry_count', { where: filter, by: 1 });
    }

    async get_recent_transactions_due_for_sync(){
       const transactions = await transaction_model.findAll(
            { 
                where: { 
                    status: 'pending',
                    trx_sync_attempt: {
                        [Op.lt]: 5
                    }
                } 
            }
        );
        return transactions.map( _ => _.toJSON() );
    }

    async get_delayed_transactions_due_for_sync(){
        const transactions = await transaction_model.findAll(
            { 
                where: { 
                    status: 'pending',
                    trx_sync_attempt: {
                        [Op.gte]: 5,
                        [Op.lt]: 10
                    }
                } 
            }
        );
        return transactions.map( _ => _.toJSON() );
    }

    async get_stale_transactions_due_for_sync(){
        const transactions = await transaction_model.findAll(
            { 
                where: { 
                    status: 'pending',
                    trx_sync_attempt: {
                        [Op.gte]: 10,
                        [Op.lte]: 34
                    }
                } 
            }
        );
        return transactions.map( _ => _.toJSON() );
    }

    async get_recent_transactions_due_for_webhook_call(){
        const transactions = await transaction_model.findAll(
            { 
                where: { 
                    status: 'successful',
                    webhook_call_is_resolved: false,
                    webhook_retry_count: {
                        [Op.lt]: 5
                    }
                } 
            }
        );
        return transactions.map( _ => _.toJSON() );
    }

    async get_delayed_transactions_due_for_webhook_call(){
        const transactions = await transaction_model.findAll(
            { 
                where: { 
                    status: 'successful',
                    webhook_call_is_resolved: false,
                    webhook_retry_count: {
                        [Op.gte]: 5,
                        [Op.lt]: 10
                    }
                } 
            }
        );
        return transactions.map( _ => _.toJSON() );
    }

    async get_stale_transactions_due_for_webhook_call(){
        const transactions = await transaction_model.findAll(
            {
                where: {
                    status: 'successful',
                    webhook_call_is_resolved: false,
                    webhook_retry_count: {
                        [Op.gte]: 10,
                        [Op.lt]: 34
                    }
                }
            }
        );
        return transactions.map( _ => _.toJSON() );
    }

    async get_successful_totals(merchant_id: number) {
        const rows = await db.query<{ amount_total: string | null, count: number }>(
            `SELECT sum(amount) as amount_total, count(id) as count
             FROM transactions
             WHERE merchant_id = :merchant_id AND status = 'successful'`,
            { replacements: { merchant_id }, type: QueryTypes.SELECT }
        );
        return rows[0] ?? { amount_total: null, count: 0 };
    }

    async get_daily_successful_volume(merchant_id: number) {
        const rows = await db.query<{ date: string, amount: string }>(
            `SELECT date(createdAt) as date, sum(amount) as amount
             FROM transactions
             WHERE merchant_id = :merchant_id AND status = 'successful'
             GROUP BY date(createdAt)`,
            { replacements: { merchant_id }, type: QueryTypes.SELECT }
        );
        return rows;
    }

    async find_merchant_transaction(merchant_id: number, reference: string) {
        const rows = await db.query<Record<string, any>>(
            `SELECT t.*, c.email as customer_email
             FROM transactions t
             LEFT JOIN customers c ON c.id = t.customer_id
             WHERE t.merchant_id = :merchant_id AND t.reference = :reference`,
            { replacements: { merchant_id, reference }, type: QueryTypes.SELECT }
        );
        return rows[0] ?? null;
    }

    async get_merchant_transactions(
        merchant_id: number,
        options: { limit: number, offset: number, status?: string }
    ) {
        const status_clause = options.status ? `AND t.status = :status` : '';
        const rows = await db.query<Record<string, any>>(
            `SELECT t.*, c.email as customer_email
             FROM transactions t
             LEFT JOIN customers c ON c.id = t.customer_id
             WHERE t.merchant_id = :merchant_id ${status_clause}
             ORDER BY t.createdAt DESC
             LIMIT :limit OFFSET :offset`,
            {
                replacements: { merchant_id, status: options.status ?? null, limit: options.limit, offset: options.offset },
                type: QueryTypes.SELECT
            }
        );

        const counted = await db.query<{ count: number }>(
            `SELECT count(*) as count
             FROM transactions t
             WHERE t.merchant_id = :merchant_id ${status_clause}`,
            {
                replacements: { merchant_id, status: options.status ?? null },
                type: QueryTypes.SELECT
            }
        );

        return { rows, total: counted[0]?.count ?? 0 };
    }
}

const transaction_repo = new TransactionRepo();
export default transaction_repo;