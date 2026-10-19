import cache_repo from "@modules/core/cache/repo";
import transaction_service from "@modules/core/transaction/service";
import cron from "node-cron";

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
    }
}

const cron_service = new CronService();
export default cron_service;