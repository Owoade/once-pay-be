import express from 'express';
import dotenv from 'dotenv';
import db from '@db/index.js';
import auth_router from '@modules/auth/routes';
import '@modules/core/customer/model';
import '@modules/core/transaction/model';
import '@modules/merchant/model';
const app = express();
app.use(express.json());

const PORT = 3000;

app.use('/auth', auth_router);

async function startServer() {
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

startServer();
