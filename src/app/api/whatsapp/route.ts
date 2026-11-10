import { NextRequest, NextResponse } from 'next/server';
import { whatsAppChatbot } from '@/ai/flows/whatsapp-chatbot';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc, Timestamp } from 'firebase/firestore';

/**
 * WhatsApp Webhook for Meta API
 * Handles verification (GET) and incoming messages (POST)
 */

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }
    
    return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        // Meta WhatsApp Webhook structure
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (changes?.value?.messages) {
            const messageData = changes.value.messages[0];
            const text = messageData.text?.body;
            const from = messageData.from;

            // 1. Initialize Firestore and Fetch History
            let history = "";
            try {
                const { firestore } = initializeFirebase();
                const historyRef = collection(firestore, 'whatsapp_conversations');
                const q = query(
                    historyRef,
                    where('phoneNumber', '==', from),
                    orderBy('timestamp', 'desc'),
                    limit(10)
                );

                const querySnapshot = await getDocs(q);
                history = querySnapshot.docs
                    .reverse()
                    .map(doc => `${doc.data().role}: ${doc.data().text}`)
                    .join('\n');
            } catch (firestoreError) {
                console.error('[WEBHOOK-ERROR] Firestore query failed:', firestoreError);
                // Continue without history if firestore fails
            }

            // 2. Process with AI Chatbot
            console.log(`[WEBHOOK] Processing message from ${from}: "${text}"`);
            const response = await whatsAppChatbot({
                userInput: text,
                conversationHistory: history,
            });

            // 3. Save History and Respond
            if (response.chatbotResponse) {
                try {
                    const { firestore } = initializeFirebase();
                    const historyRef = collection(firestore, 'whatsapp_conversations');
                    
                    // Save user message
                    await addDoc(historyRef, {
                        phoneNumber: from,
                        role: 'Usuario',
                        text: text,
                        timestamp: Timestamp.now()
                    });

                    // Save AI response
                    await addDoc(historyRef, {
                        phoneNumber: from,
                        role: 'Asistente',
                        text: response.chatbotResponse,
                        timestamp: Timestamp.now()
                    });
                } catch (saveError) {
                    console.error('[WEBHOOK-ERROR] Failed to save conversation history:', saveError);
                }

                const sendResult = await sendWhatsAppMessage(from, response.chatbotResponse);
                if (!sendResult.success) {
                    console.error('[WEBHOOK-ERROR] WhatsApp message failed to send:', sendResult.error);
                } else {
                    console.log(`[WEBHOOK] Message sent successfully to ${from}. ID: ${sendResult.messageId}`);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[WEBHOOK-CRITICAL] Global webhook error:', error.message || error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
