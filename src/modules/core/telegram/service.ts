import axios from 'axios';
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_IDS } from 'src/env';

class TelegramNotificationService {

    async send_message(message: Record<string, any>) {
        const chat_ids = (TELEGRAM_CHAT_IDS || '')
            .split(',')
            .map((id: string) => id.trim())
            .filter(Boolean);

        if (!TELEGRAM_BOT_TOKEN || chat_ids.length === 0) {
            console.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_IDS not set, skipping telegram notification');
            return;
        }

        const text = this.format_telegram_message(message);

        await Promise.allSettled(chat_ids.map(async (chat_id: string) => {
            try {
                await axios.post(
                    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                    { chat_id, text, parse_mode: 'Markdown' }
                );
            } catch (error: any) {
                console.error(`Telegram notification to ${chat_id} failed:`, error.response?.data || error.message);
            }
        }));
    }

    private format_telegram_message(message: Record<string, any>): string {
        const { title, ...fields } = message;

        const field_lines = Object.entries(fields)
            .map(([key, value]) => `*${this.split_key(key)}:* \`${value ?? 'N/A'}\``);

        return [`*${title}*`, '', ...field_lines].join('\n');
    }

    private split_key(key: string): string {
        return (key.replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .split(' ')
            .filter(Boolean)
            .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
            .join(' '));
    }
}

export default new TelegramNotificationService();