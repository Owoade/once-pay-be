import express from 'express';
import webhook_reciever_controller from './controller.js';

const webhook_receiver_router = express.Router();

webhook_receiver_router.post('/:provider', webhook_reciever_controller.handle_webhook);

export default webhook_receiver_router;