import cache_repo from "@modules/core/cache/repo";
import transaction_service from "@modules/core/transaction/service";
import cron from "node-cron";
import fs from "fs";
import storage_service from "@modules/core/storage/service";
import { SQLITE_FILE } from "src/env";

class CronService {
    constructor() {}
    run(){
        cron.schedule("*/30 * * * * *", async () => {
            transaction_service.sync_recent_transactions();
            transaction_service.handle_recent_transactions_due_for_webhook_call();  
            cache_repo.delete_stale_keys();
        });

        // Every 5 minutes
        cron.schedule("0 */5 * * * *", async () => {
            transaction_service.sync_delayed_transactions();
            transaction_service.handle_delayed_transactions_due_for_webhook_call(); 
        });

        // Every 1 hour
        cron.schedule("0 0 * * * *", async () => {
            transaction_service.sync_stale_transactions();
            transaction_service.handle_stale_transactions_due_for_webhook_call(); 
        });

        // Every day at midnight
        cron.schedule("0 0 0 * * *", async () => {
            const env = fs.readFileSync('.env');
            storage_service.save_file(env, 'config/.env', 'text/plain');

            const sqlite_db = fs.readFileSync(SQLITE_FILE);
            storage_service.save_file(sqlite_db, 'config/database.sqlite', 'application/octet-stream');
        });
    }
}

const cron_service = new CronService();
export default cron_service;