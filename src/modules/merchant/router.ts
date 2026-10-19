import express from 'express';
import merchant_controller from '@modules/merchant/controller';

const merchant_router = express.Router();
merchant_router.get('/developers', merchant_controller.get_developer_settings);
merchant_router.get('/api-key', merchant_controller.get_merchant_api_key);
merchant_router.get('/transactions/summary', merchant_controller.get_transaction_summary);
merchant_router.get('/transactions', merchant_controller.get_merchant_transactions);
merchant_router.get('/transactions/:reference', merchant_controller.get_transaction_by_reference);
merchant_router.post('/webhook-url', merchant_controller.set_webhook_url);

export default merchant_router;