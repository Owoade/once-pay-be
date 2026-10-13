import express from 'express';
import merchant_controller from '@modules/merchant/controller';

const merchant_router = express.Router();
merchant_router.get('/api-key', merchant_controller.get_merchant_api_key);

export default merchant_router;