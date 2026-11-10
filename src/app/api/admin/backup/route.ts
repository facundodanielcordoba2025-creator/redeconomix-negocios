import { NextResponse } from 'next/server';
import { initializeAdmin, adminDb } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    try {
        const { retailerId, userEmail } = await request.json();

        if (!retailerId) {
            return NextResponse.json({ error: 'Retailer ID requerido' }, { status: 400 });
        }

        const admin = initializeAdmin();
        const db = admin.firestore();

        const collections = ['retailer_inventory', 'retailer_daily_operations', 'retailer_inventory_logs'];
        const backupData: Record<string, any[]> = {};

        // Extract data
        for (const col of collections) {
            const snapshot = await db.collection(col).where('retailerId', '==', retailerId).get();
            backupData[col] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backups/${retailerId}/backup_${timestamp}.json`;
        
        // Save to Firebase Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(fileName);
        
        await file.save(JSON.stringify(backupData, null, 2), {
            metadata: {
                contentType: 'application/json',
                metadata: {
                    backupBy: userEmail,
                    retailerId: retailerId
                }
            }
        });

        // Register the backup in a history collection
        await db.collection('retailer_backups_history').add({
            retailerId,
            fileName,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            size: JSON.stringify(backupData).length,
            status: 'success'
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Respaldo completado con éxito',
            file: fileName 
        });

    } catch (error: any) {
        console.error('Backup Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
