'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Info } from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { createNotification } from '@/lib/notifications';
import { useAlerts } from '@/hooks/use-alerts';

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    createdAt: { toDate: () => Date } | null;
    type: 'user' | 'system';
}

export function OrderChatDialog({ 
    orderId, 
    otherPartyId, 
    otherPartyName, 
    isOpen, 
    onClose 
}: { 
    orderId: string | null;
    otherPartyId: string;
    otherPartyName: string;
    isOpen: boolean;
    onClose: () => void;
}) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !orderId) return null;
        return query(
            collection(firestore, 'orders_wholesaler', orderId, 'chat'),
            orderBy('createdAt', 'asc')
        );
    }, [firestore, orderId]);

    const { data: messages, isLoading } = useCollection<Message>(messagesQuery);
    const { playAlert } = useAlerts();
    const lastMessageId = useRef<string | null>(null);

    useEffect(() => {
        if (messages && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            
            // Si el mensaje es nuevo y NO es mío, sonar alerta
            if (lastMessageId.current && lastMessageId.current !== lastMsg.id) {
                if (lastMsg.senderId !== user?.uid) {
                    playAlert('ping');
                }
            }
            lastMessageId.current = lastMsg.id;

            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [messages, user?.uid, playAlert]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !user || !firestore || !orderId) return;

        setIsSending(true);
        const text = newMessage.trim();
        setNewMessage('');

        try {
            await addDoc(collection(firestore, 'orders_wholesaler', orderId, 'chat'), {
                text,
                senderId: user.uid,
                senderName: user.displayName || 'Usuario',
                type: 'user',
                createdAt: serverTimestamp()
            });

            // Send push notification to the other party
            await createNotification(
                otherPartyId,
                'Nuevo mensaje de pedido',
                `${user.displayName || 'Usuario'}: ${text}`,
                'chat',
                `/redeconomix/mis-compras` // Make it dynamic based on receiver
            );
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
        }
    };

    if (!orderId) return null;

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent className="bg-white rounded-t-[2.5rem] border-none font-sans h-[85vh] pb-safe flex flex-col overflow-hidden">
                <div className="p-4 border-b shrink-0 bg-slate-50/50 flex flex-col items-center relative">
                    <div className="mx-auto w-10 h-1 bg-slate-200 rounded-full mb-3" />
                    <DrawerTitle className="text-lg font-black tracking-tight text-slate-900 text-center">Chat del Pedido</DrawerTitle>
                    <DrawerDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                        Conversación con {otherPartyName}
                    </DrawerDescription>
                </div>

                <ScrollArea className="flex-grow p-4 bg-background" ref={scrollRef}>
                    <div className="space-y-4 pb-4 flex flex-col">
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                        ) : messages?.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">
                                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No hay mensajes todavía.</p>
                                <p className="text-sm">Escribe acá para consultar sobre este pedido.</p>
                            </div>
                        ) : (
                            messages?.map((msg) => {
                                const isSystem = msg.type === 'system';
                                const isMe = msg.senderId === user?.uid;

                                if (isSystem) {
                                    return (
                                        <div key={msg.id} className="flex justify-center w-full my-2">
                                            <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full text-center max-w-[80%]">
                                                {msg.text}
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                        <span className="text-xs text-muted-foreground mb-1 ml-1">{isMe ? 'Vos' : msg.senderName}</span>
                                        <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}>
                                            <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                                            {msg.createdAt?.toDate() ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true, locale: es }) : 'ahora'}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="p-4 border-t shrink-0 flex items-center gap-2 bg-background">
                    <Input 
                        placeholder="Escribe un mensaje..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="rounded-full flex-grow bg-slate-50 border-0 h-12 focus-visible:ring-1 text-sm font-semibold"
                        autoComplete="off"
                        disabled={isSending}
                    />
                    <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!newMessage.trim() || isSending} 
                        className="rounded-full shrink-0 h-12 w-12 bg-primary text-white"
                        onClick={() => { if ('vibrate' in navigator) navigator.vibrate(6); }}
                    >
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </DrawerContent>
        </Drawer>
    );
}
