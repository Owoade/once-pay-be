import express from 'express';
import cors from 'cors';
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
import {Server as IoServer} from 'socket.io';
import http from 'http';
import { transaction_event } from '@modules/core/event';

const app = express();

// CORS: open to all origins for now; narrow `origin` to FRONTEND_URL when ready.
const cors_options = {
    origin: "*"
};

app.use(cors(cors_options));
app.use(express.json({
    verify: (req: any, _res: any, buf: Buffer) => {
        req.rawBody = buf;
    }
}));

const PORT = 7000;

app.use('/', merchant_api_router);
app.use('/auth', auth_router);
app.use('/merchant', merchant_router);
app.use("/webhooks", webhook_receiver_router);

const server = http.createServer(app);
const io_server = new IoServer(server, { cors: cors_options });

const transaction_io_namespace = io_server.of('/transactions');
transaction_io_namespace.on('connection', (socket) => {
    console.log('A client connected to the transactions namespace.');
});
transaction_event.on('transaction', (data) => {
    transaction_io_namespace.emit('transaction', data);
});


async function start_server() {
    try {
        await db.sync();
        console.log('Database synchronized.');
        server.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error: any) {
        console.error('Failed to start server:', error);
    }
}

cron_service.run();
start_server();
