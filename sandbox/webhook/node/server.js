/**
 * Sandbox: mock merchant webhook receiver for once-pay-be.
 *
 * Listens on :8000, POST /webhook
 * - reads TEST_ONCE_PAY_API_KEY from sandbox/.env
 * - verifies the X-Signature header as HMAC-SHA256(raw_request_body, api_key)
 *   (matches once-pay-be's send_webhook / get_webhook_signature)
 * - outputs the request body
 *
 * Run from the repo root: node sandbox/server.js
 * (resolves express/dotenv from the root node_modules)
 */

import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const TEST_ONCE_PAY_API_KEY = process.env.TEST_ONCE_PAY_API_KEY;

if (!TEST_ONCE_PAY_API_KEY) {
    console.error('TEST_ONCE_PAY_API_KEY is not set — add it to sandbox/.env');
    process.exit(1);
}

const PORT = 8000;

const app = express();

// capture the exact raw body bytes before JSON parsing is applied
app.use(express.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    }
}));

function is_valid_signature(raw_body, signature) {
    const expected = crypto
        .createHmac('sha256', TEST_ONCE_PAY_API_KEY)
        .update(raw_body)
        .digest('hex');

    const expected_buf = Buffer.from(expected);
    const signature_buf = Buffer.from(signature);

    if (expected_buf.length !== signature_buf.length) return false;
    return crypto.timingSafeEqual(expected_buf, signature_buf);
}

app.post('/webhook', (req, res) => {
    const signature = req.headers['x-signature'];
    if (!signature) {
        console.log('[WEBHOOK REJECTED] No X-Signature header');
        return res.status(400).json({ error: 'Missing X-Signature header' });
    }

    if (!is_valid_signature(req.rawBody, signature)) {
        console.log('[WEBHOOK REJECTED] Invalid signature');
        return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('[WEBHOOK VALIDATED] Signature OK');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    return res.json({
        received: true,
        message: 'Signature verified, request body logged',
        body: req.body
    });
});

app.listen(PORT, () => {
    console.log(`Sandbox webhook receiver running on http://localhost:${PORT}`);
    console.log(`POST /webhook  (expects X-Signature: HMAC-SHA256 of raw body using TEST_ONCE_PAY_API_KEY)`);
});