import express from 'express';
import merchant_api_controller from './controller';

const merchant_api_router = express.Router();

merchant_api_router.post("/transaction/initiate", merchant_api_controller.initiate_transaction);
merchant_api_router.get("/transaction/callback/:payment_gateway/:trx_reference", merchant_api_controller.verify_transaction_from_callback);
merchant_api_router.get("/transaction/verify/:trx_reference", merchant_api_controller.get_transaction_by_reference);

export default merchant_api_router;