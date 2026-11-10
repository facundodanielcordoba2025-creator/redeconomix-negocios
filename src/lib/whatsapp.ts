/**
 * WhatsApp Messaging Utility
 * Uses Meta WhatsApp Business API
 */

const WHATSAPP_API_VERSION = 'v22.0';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID?.trim();
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN?.trim();

interface SendMessageResult {
    success: boolean;
    messageId?: string;
    error?: any;
}

const MAKE_WHATSAPP_WEBHOOK = process.env.MAKE_WHATSAPP_WEBHOOK?.trim();

/**
 * Sends a text message via WhatsApp (either direct Meta or Make.com/Twilio)
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<SendMessageResult> {
    // If we have a Make.com webhook configured, we use that (Twilio integration)
    if (MAKE_WHATSAPP_WEBHOOK) {
        try {
            const response = await fetch(MAKE_WHATSAPP_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: to,
                    message: text,
                    timestamp: new Date().toISOString(),
                    source: 'redeconomix-app'
                }),
            });
            if (response.ok) return { success: true };
            return { success: false, error: 'Make.com webhook failed' };
        } catch (error) {
            console.error('Make.com fetch error:', error);
            return { success: false, error };
        }
    }

    if (!WHATSAPP_PHONE_ID || !WHATSAPP_TOKEN) {
        console.warn('WhatsApp credentials not configured. Skipping message.');
        return { success: false, error: 'Credentials missing' };
    }

    // Format number (remove non-digits only)
    let formattedNumber = to.replace(/\D/g, '');

    // FINAL ARGENTINIAN FIX: Meta Sandbox in AR often requires removing '9' 
    // and sometimes adding '15' after the area code (as seen in user's curl: 54387315540862)
    if (formattedNumber.startsWith('5493873') && formattedNumber.length === 13) {
        formattedNumber = '54387315' + formattedNumber.substring(7);
    } else if (formattedNumber.startsWith('549') && formattedNumber.length === 13) {
        // Fallback for other AR numbers: just remove the 9
        formattedNumber = '54' + formattedNumber.substring(3);
    }

    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_ID}/messages`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: formattedNumber,
                type: 'text',
                text: { body: text },
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('WhatsApp API error:', data);
            return { success: false, error: data };
        }

        return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
        console.error('WhatsApp fetch error:', error);
        return { success: false, error };
    }
}

/**
 * Sends a template message (if applicable)
 */
export async function sendWhatsAppTemplate(to: string, templateName: string, languageCode: string = 'es_AR', components: any[] = []): Promise<SendMessageResult> {
    if (!WHATSAPP_PHONE_ID || !WHATSAPP_TOKEN) return { success: false, error: 'Credentials missing' };

    // Format number (remove non-digits only)
    let formattedNumber = to.replace(/\D/g, '');

    // ARGENTINIAN SANDBOX FIX: Remove '9' after '54' if it's 13 digits 
    if (formattedNumber.startsWith('549') && formattedNumber.length === 13) {
        formattedNumber = '54' + formattedNumber.substring(3);
    }

    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_ID}/messages`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: formattedNumber,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: languageCode },
                    components: components
                },
            }),
        });

        const data = await response.json();
        if (!response.ok) return { success: false, error: data };
        return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
        return { success: false, error };
    }
}
