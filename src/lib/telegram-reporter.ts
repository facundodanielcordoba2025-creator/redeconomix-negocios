import { errorEmitter } from '@/firebase/error-emitter';

/**
 * Sends a message to the configured Telegram bot.
 * @param message The text message to send. Supports Telegram HTML or Markdown formatting.
 */
export async function sendTelegramAlert(message: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN || "8966394979:AAHce25ZOu7QonSLnQuO-J3vGswOxYjOhP4";
    const chatId = process.env.TELEGRAM_CHAT_ID || "8956299327";

    if (!token || !chatId) {
        console.warn("Telegram alert suppressed: Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment variables.");
        return { success: false, error: "Missing config" };
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Failed to send Telegram alert:", errBody);
            return { success: false, error: errBody };
        }

        return { success: true };
    } catch (error) {
        console.error("Exception while sending Telegram alert:", error);
        return { success: false, error };
    }
}

/**
 * Formats an error into a readable Telegram message and sends it.
 */
export async function reportSystemError(context: string, error: any, extraInfo?: any) {
    const time = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
    let errorMessage = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
    
    let text = `🚨 <b>ALERTA REDECONOMIX</b> 🚨\n\n`;
    text += `<b>Contexto:</b> ${context}\n`;
    text += `<b>Hora:</b> ${time}\n`;
    text += `<b>Error:</b> <code>${errorMessage}</code>\n`;

    if (extraInfo) {
        text += `\n<b>Detalles Extra:</b>\n<code>${JSON.stringify(extraInfo, null, 2)}</code>`;
    }

    return sendTelegramAlert(text);
}
