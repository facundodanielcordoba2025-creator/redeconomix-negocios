import { NextRequest, NextResponse } from 'next/server';
import { whatsAppChatbot } from '@/ai/flows/whatsapp-chatbot';

const CHATBOT_API_KEY = process.env.REX_CHATBOT_KEY;

export async function POST(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key');
    if (!CHATBOT_API_KEY || apiKey !== CHATBOT_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { userInput, phone, history, audioDataUri } = body;

        // Llamamos al flujo de Genkit que ya habías definido
        const aiResponse = await whatsAppChatbot({
            userInput: userInput || '',
            conversationHistory: history || '',
            audioDataUri: audioDataUri || undefined
        });

        return NextResponse.json({
            success: true,
            response: aiResponse.chatbotResponse,
            needsEmployee: aiResponse.needsEmployee,
            // Podríamos agregar más metadatos aquí para Make.com
        });

    } catch (error: any) {
        console.error('[CHATBOT-AI-API] Error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message,
            response: "Lo siento, estoy teniendo problemas técnicos. Un asesor te ayudará pronto." 
        }, { status: 500 });
    }
}
