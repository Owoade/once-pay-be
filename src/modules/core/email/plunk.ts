import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PLUNK_API_KEY = process.env.PLUNK_API_KEY;
const PLUNK_SENDER_EMAIL = process.env.PLUNK_SENDER_EMAIL;

console.log({PLUNK_API_KEY, PLUNK_SENDER_EMAIL})

export const email_service = {
    async send_email(to: string, subject: string, body: string) {
        if (!PLUNK_API_KEY) {
            console.warn('PLUNK_API_KEY not set, skipping email send');
            return;
        }

        try {
            await axios.post('https://next-api.useplunk.com/v1/send', {
                from: PLUNK_SENDER_EMAIL,
                to: to,
                subject: subject,
                body
            }, { headers: { 'Authorization': `Bearer ${PLUNK_API_KEY}` } });
        } catch (error: any) {
            console.error('Email sending failed:', error.response?.data || error.message);
            throw new Error('Failed to send email');
        }
    }
};
