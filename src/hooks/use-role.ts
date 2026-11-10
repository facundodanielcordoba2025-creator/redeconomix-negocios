'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export type RoleType = 'admin' | 'cashier' | 'warehouse' | 'accountant' | 'cashier_warehouse' | 'preventista' | 'locked';

export interface EmployeeSession {
    id: string;
    name: string;
    dni: string;
    role: RoleType;
    branchId: string;
    retailerId?: string;
}

const ROLE_UPDATE_EVENT = 'rex-role-updated';
let lastAutoAuthUid: string | null = null;
let autoAuthInFlight: Promise<void> | null = null;

function broadcastRoleChange(newRole: RoleType, newEmployee: EmployeeSession | null) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('rex_role', newRole);
    if (newEmployee) {
        localStorage.setItem('rex_employee_session', JSON.stringify(newEmployee));
    }
    window.dispatchEvent(new CustomEvent(ROLE_UPDATE_EVENT, {
        detail: { role: newRole, employee: newEmployee }
    }));
}

export function useRole() {
    const firestore = useFirestore();
    const { user } = useUser();

    const [role, setRole] = useState<RoleType>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('rex_role') as RoleType) || 'locked';
        }
        return 'locked';
    });
    
    const [employee, setEmployee] = useState<EmployeeSession | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('rex_employee_session');
            if (saved) {
                try { return JSON.parse(saved); } catch(e) {}
            }
        }
        return null;
    });

    // Sincronización global instantánea entre todos los componentes montados y pestañas
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const syncFromEvent = (e: Event) => {
            const custom = e as CustomEvent<{ role: RoleType; employee: EmployeeSession | null }>;
            if (custom.detail) {
                setRole(custom.detail.role);
                if (custom.detail.employee !== undefined) {
                    setEmployee(custom.detail.employee);
                }
            }
        };

        const syncFromStorage = () => {
            const storedRole = (localStorage.getItem('rex_role') as RoleType) || 'locked';
            setRole(storedRole);
            const savedEmp = localStorage.getItem('rex_employee_session');
            if (savedEmp) {
                try { setEmployee(JSON.parse(savedEmp)); } catch {}
            }
        };

        window.addEventListener(ROLE_UPDATE_EVENT, syncFromEvent);
        window.addEventListener('storage', syncFromStorage);
        return () => {
            window.removeEventListener(ROLE_UPDATE_EVENT, syncFromEvent);
            window.removeEventListener('storage', syncFromStorage);
        };
    }, []);

    // Auto-login if user is authenticated via email or DNI as a linked employee (deduplicado por sesión)
    useEffect(() => {
        if (!firestore || !user) return;
        if (lastAutoAuthUid === user.uid && autoAuthInFlight) return;

        async function autoAuthLinkedEmployee() {
            if (!firestore || !user) return;
            const currentRole = (localStorage.getItem('rex_role') as RoleType) || 'locked';

            try {
                let snapshot = null;
                if (user.email) {
                    const q = query(
                        collection(firestore, 'retailer_employees'),
                        where('email', '==', user.email.toLowerCase().trim()),
                        where('status', '==', 'active')
                    );
                    snapshot = await getDocs(q);
                }

                if ((!snapshot || snapshot.empty) && user.uid) {
                    const { doc, getDoc } = await import('firebase/firestore');
                    const uSnap = await getDoc(doc(firestore, 'users', user.uid));
                    const uData = uSnap.data();
                    if (uData?.dni) {
                        const dniQ = query(
                            collection(firestore, 'retailer_employees'),
                            where('dni', '==', String(uData.dni).trim()),
                            where('status', '==', 'active')
                        );
                        snapshot = await getDocs(dniQ);
                    }
                }

                if (snapshot && !snapshot.empty) {
                    const empDoc = snapshot.docs[0].data();
                    if (currentRole === 'admin') {
                        const savedRaw = localStorage.getItem('rex_employee_session');
                        let existingSession: any = null;
                        if (savedRaw) {
                            try { existingSession = JSON.parse(savedRaw); } catch {}
                        }
                        if (!existingSession?.retailerId && empDoc.retailerId) {
                            const updatedAdmin: EmployeeSession = {
                                id: 'admin',
                                name: existingSession?.name || 'Dueño (Admin)',
                                dni: 'admin',
                                role: 'admin',
                                branchId: existingSession?.branchId || empDoc.branchId || 'central',
                                retailerId: empDoc.retailerId
                            };
                            broadcastRoleChange('admin', updatedAdmin);
                        }
                        return;
                    }
                    const empData: EmployeeSession = {
                        id: empDoc.id || snapshot.docs[0].id,
                        name: empDoc.name,
                        dni: empDoc.dni,
                        role: empDoc.role,
                        branchId: empDoc.branchId,
                        retailerId: empDoc.retailerId
                    };
                    broadcastRoleChange(empData.role, empData);
                }
            } catch (err) {
                console.error("Error auto-autenticando empleado por email/dni:", err);
            }
        }

        lastAutoAuthUid = user.uid;
        autoAuthInFlight = autoAuthLinkedEmployee();
    }, [firestore, user]);

    const lockSession = useCallback(() => {
        broadcastRoleChange('locked', employee);
    }, [employee]);

    const loginAsAdmin = useCallback(async (pin: string) => {
        if (!firestore || !user) return false;
        
        try {
            const { doc, getDoc } = await import('firebase/firestore');
            let resolvedRetailerId = employee?.retailerId;

            if (!resolvedRetailerId && user.email) {
                const empSnap = await getDocs(query(
                    collection(firestore, 'retailer_employees'),
                    where('email', '==', user.email.toLowerCase().trim()),
                    where('status', '==', 'active')
                ));
                if (!empSnap.empty) {
                    resolvedRetailerId = empSnap.docs[0].data()?.retailerId;
                }
            }

            if (!resolvedRetailerId && user.uid) {
                const uSnap = await getDoc(doc(firestore, 'users', user.uid));
                const uData = uSnap.data();
                if (uData?.dni) {
                    const dniSnap = await getDocs(query(
                        collection(firestore, 'retailer_employees'),
                        where('dni', '==', String(uData.dni).trim()),
                        where('status', '==', 'active')
                    ));
                    if (!dniSnap.empty) {
                        resolvedRetailerId = dniSnap.docs[0].data()?.retailerId;
                    }
                }
            }

            const ownerUid = resolvedRetailerId || user.uid;
            const docRef = doc(firestore, 'users', ownerUid);
            const userSnap = await getDoc(docRef);
            
            let storedPin = localStorage.getItem('rex_master_pin') || '0000';
            if (userSnap.exists() && userSnap.data()?.securityPin) {
                storedPin = userSnap.data().securityPin;
            }
            
            if (pin === storedPin) {
                const adminSession: EmployeeSession = {
                    id: 'admin',
                    name: 'Dueño (Admin)',
                    dni: 'admin',
                    role: 'admin',
                    branchId: employee?.branchId || 'central',
                    retailerId: ownerUid
                };
                localStorage.setItem('rex_master_pin', pin);
                broadcastRoleChange('admin', adminSession);
                return true;
            }
        } catch (e) {
            console.error("Error verifying admin pin", e);
        }
        return false;
    }, [firestore, user, employee?.retailerId, employee?.branchId]);

    const loginWithDni = useCallback(async (dni: string, pin: string) => {
        if (!firestore || !user) throw new Error("No conectado");
        
        const q = query(
            collection(firestore, 'retailer_employees'), 
            where('dni', '==', dni.trim()),
            where('pin', '==', pin.trim()),
            where('status', '==', 'active')
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return false;

        const empDoc = snapshot.docs[0].data();
        const empData: EmployeeSession = {
            id: empDoc.id || snapshot.docs[0].id,
            name: empDoc.name,
            dni: empDoc.dni,
            role: empDoc.role,
            branchId: empDoc.branchId,
            retailerId: empDoc.retailerId
        };
        
        broadcastRoleChange(empData.role, empData);
        return true;
    }, [firestore, user]);

    const resetPin = useCallback(async (newPin: string) => {
        if (!firestore || !user) return false;
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const targetUid = employee?.retailerId || user.uid;
            const docRef = doc(firestore, 'users', targetUid);
            await updateDoc(docRef, { securityPin: newPin });
            localStorage.setItem('rex_master_pin', newPin);
            return true;
        } catch (e) {
            console.error("Error resetting admin pin", e);
            return false;
        }
    }, [firestore, user, employee?.retailerId]);

    const cashierName = employee?.name || '';
    const effectiveRetailerId = employee?.retailerId || user?.uid;

    return { 
        role, 
        employee,
        cashierName,
        effectiveRetailerId,
        lockSession,
        loginAsAdmin, 
        loginWithDni,
        resetPin 
    };
}
