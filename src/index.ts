import express from 'express';
import dotenv from 'dotenv';
import db from '@db/index.js';
import auth_router from '@modules/auth/routes';
import merchant_router from '@modules/merchant/router';
import merchant_api_router from '@modules/merchant-api/route';
import '@modules/core/customer/model';
import '@modules/core/transaction/model';
import '@modules/merchant/model';
import cron_service from '@modules/cron/service';
import webhook_receiver_router from '@modules/webhook-reciever/router';
const app = express();
app.use(express.json({
    verify: (req: any, _res: any, buf: Buffer) => {
        req.rawBody = buf;
    }
}));

const PORT = 3000;

app.use('/', merchant_api_router);
app.use('/auth', auth_router);
app.use('/merchant', merchant_router);
app.use("/webhooks", webhook_receiver_router);

async function start_server() {
    try {
        await db.sync();
        console.log('Database synchronized.');
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error: any) {
        console.error('Failed to start server:', error);
    }
}

cron_service.run();
start_server();
