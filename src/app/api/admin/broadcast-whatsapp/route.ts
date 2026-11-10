import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

/**
 * Admin API to send bulk WhatsApp messages to users.
 */
export async function POST(req: NextRequest) {
    try {
        const { message, userIds } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
        }

        const { firestore } = initializeFirebase();
        
        let targetPhones: string[] = [];

        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            // Fetch specific users' phone numbers
            const usersRef = collection(firestore, 'users');
            const userDocs = await Promise.all(
                userIds.map(id => getDoc(doc(firestore, 'users', id)))
            );
            targetPhones = userDocs
                .map(doc => doc.data()?.phone || doc.data()?.phoneNumber)
                .filter(phone => !!phone);
        } else {
            // Fetch all users with accountType
            const usersQuery = query(
                collection(firestore, "users"), 
                where('accountType', 'in', ['retailer', 'wholesaler', 'persona'])
            );
            const usersSnapshot = await getDocs(usersQuery);
            targetPhones = usersSnapshot.docs
                .map(doc => doc.data().phone || doc.data().phoneNumber)
                .filter(phone => !!phone);
        }

        // Clean and Deduplicate phones
        const uniquePhones = Array.from(new Set(targetPhones.map(p => p.replace(/\D/g, ''))))
            .filter(p => p.length >= 10);

        if (uniquePhones.length === 0) {
            return NextResponse.json({ error: 'No valid phone numbers found' }, { status: 404 });
        }

        console.log(`[BROADCAST] Sending WhatsApp to ${uniquePhones.length} users...`);

        // Send messages
        const results = await Promise.all(
            uniquePhones.map(phone => sendWhatsAppMessage(phone, message))
        );

        const successfulCount = results.filter(r => r.success).length;

        return NextResponse.json({ 
            success: true, 
            totalSent: uniquePhones.length, 
            successful: successfulCount,
            results: results.map(r => r.success ? 'ok' : r.error)
        });

    } catch (error: any) {
        console.error('[BROADCAST-ERROR] Failed to send bulk WhatsApp:', error.message || error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
