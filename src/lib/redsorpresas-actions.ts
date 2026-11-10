"use server";

import { initializeAdmin } from './firebase-admin';

function getAdminDb() {
  const admin = initializeAdmin();
  return admin.firestore();
}


import { Prize, SpinResult, DEFAULT_PRIZES } from './redsorpresas-constants';
export type { Prize, SpinResult };

/**
 * Validates if user can spin based on frequency rules and minimum purchases.
 */
export async function checkCanSpin(userId: string) {
  // BYPASS LOCAL: Evitar que Admin SDK se cuelgue intentando conectar a la nube en desarrollo
  if (process.env.NODE_ENV !== 'production' || userId === 'LOCAL_PREVIEW_USER' || !userId) {
    console.log("BYPASS LOCAL (Ruleta): Habilitando giro automático para previsualización.");
    return { allowed: true, isPremium: true };
  }

  try {
    const [userDoc, ordersSnapshot, allSpinsSnapshot] = await Promise.all([
        getAdminDb().collection('users').doc(userId).get(),
        getAdminDb().collection('orders').where('userId', '==', userId).limit(1).get(),
        getAdminDb().collection('redsorpresas_spins').where('userId', '==', userId).get()
    ]);

    if (!userDoc.exists) return { allowed: false, reason: 'Usuario no encontrado.', isPremium: false };
    
    const userData = userDoc.data() || {};
    const isPremium = userData.isPremium === true;
    
    if (!userData.email || (!userData.phone && !userData.whatsapp)) {
      return { allowed: false, reason: 'Debes completar tu perfil para girar la ruleta.', action: 'profile', isPremium };
    }

    if (ordersSnapshot.empty) {
      return { allowed: false, reason: 'Debes realizar al menos 1 compra en RedEconomiX para jugar.', action: 'shop', isPremium };
    }

    const spins = allSpinsSnapshot.docs.map(d => d.data());
    
    // SECURITY RULE: Non-premium users can ONLY spin once ever.
    if (!isPremium && spins.length >= 1) {
        return { 
            allowed: false, 
            reason: 'Sección exclusiva para usuarios Premium.', 
            action: 'redirect_sorpresa', 
            isPremium 
        };
    }

    // SECURITY RULE: Premium users can spin up to 4 times per month.
    if (isPremium) {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const spinsThisMonth = spins.filter(s => s.timestamp >= firstDayOfMonth);
        
        if (spinsThisMonth.length >= 4) {
            return { 
                allowed: false, 
                reason: 'Has alcanzado el límite de 4 giros mensuales para usuarios Premium.', 
                isPremium 
            };
        }

        // Add 7-day cooldown between spins for premium (optional but previously there)
        if (spins.length > 0) {
            const lastSpin = spins.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
            const diffDays = Math.floor((now.getTime() - new Date(lastSpin.timestamp).getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 7) {
                return { 
                    allowed: false, 
                    reason: `Próximo giro disponible en ${7 - diffDays} días.`,
                    nextSpinDays: 7 - diffDays,
                    isPremium
                };
            }
        }
    }
    
    return { allowed: true, isPremium };
  } catch (error) {
    console.error("Error checking redsorpresas status:", error);
    return { allowed: false, reason: 'No se pudo verificar tu estado. Intenta más tarde.', isPremium: false };
  }
}

/**
 * Gets the current active prizes list from decoupled config table.
 */
export async function getPrizes(): Promise<Prize[]> {
    if (process.env.NODE_ENV !== 'production') {
        return DEFAULT_PRIZES;
    }

    try {
        const prizesSnapshot = await getAdminDb().collection('redsorpresas_prizes_config').where('active', '==', true).get();
        if (prizesSnapshot.empty) {
            return DEFAULT_PRIZES;
        }
        
        return prizesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prize));
    } catch (error) {
        console.error("Error fetching redsorpresas prizes:", error);
        return DEFAULT_PRIZES; // Safe fallback
    }
}

/**
 * Performs a deterministic spin purely on backend using weighted RNG.
 * Saves result to immutable spin history.
 */
export async function executeSpin(userId: string) {
  const check = await checkCanSpin(userId);
  if (!check.allowed) {
      throw new Error(check.reason);
  }

  // BUSINESS RULE: First 100 users/spins only win CEPITA
  const globalSpinsCountSnapshot = await getAdminDb().collection('redsorpresas_spins').count().get();
  const totalGlobalSpins = globalSpinsCountSnapshot.data().count;

  let selectedPrize: Prize;

  if (totalGlobalSpins < 100) {
      selectedPrize = DEFAULT_PRIZES.find(p => p.id === 'cepita1') || DEFAULT_PRIZES[1];
  } else {
      const prizes = await getPrizes();
      const totalWeight = prizes.reduce((sum, prize) => sum + (prize.weight || 0), 0);
      
      if (totalWeight === 0) throw new Error("Configuración de premios inválida.");

      // Weighted Random Logic
      let random = Math.random() * totalWeight;
      selectedPrize = prizes[prizes.length - 1]; // fallback
      
      for (const prize of prizes) {
          if (random < prize.weight) {
              selectedPrize = prize;
              break;
          }
          random -= prize.weight;
      }
  }

  // Generate unique claim code
  const claimCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Safe append-only record
  const newSpin: any = {
      userId,
      prizeId: selectedPrize.id,
      prizeName: selectedPrize.name,
      timestamp: new Date().toISOString(),
      redeemed: false,
      status: 'won', // won, claimed, delivered, expired
      claimCode,
      claimAddress: "Doña Lili - Sucursal Principal",
      prizeType: selectedPrize.type
  };

  try {
      if (process.env.NODE_ENV === 'production') {
          await getAdminDb().collection('redsorpresas_spins').add(newSpin);
      } else {
          console.log("SIMULACION LOCAL: premio sorteado. Saltando Inserción de BD.", newSpin);
      }
  } catch (error) {
      console.error("Error saving spin result:", error);
  }

  return { prize: selectedPrize, spinRecord: newSpin };
}

/**
 * Marks a prize as claimed and triggers a notification to the business.
 */
export async function claimPrize(userId: string, spinId: string) {
    try {
        const spinRef = getAdminDb().collection('redsorpresas_spins').doc(spinId);
        const spinDoc = await spinRef.get();

        if (!spinDoc.exists) throw new Error("Premio no encontrado.");
        
        const spinData = spinDoc.data();
        if (spinData?.userId !== userId) throw new Error("Acceso denegado.");

        await spinRef.update({
            status: 'claimed',
            claimedAt: new Date().toISOString()
        });

        // SEND NOTIFICATION TO BUSINESS (Doña Lili)
        await getAdminDb().collection('business_notifications').add({
            businessId: 'DonaLili', // Hardcoded for this requirement
            type: 'prize_claimed',
            title: '¡Premio Reclamado!',
            message: `Un usuario ha reclamado su premio: ${spinData?.prizeName}. Código: ${spinData?.claimCode}`,
            spinId: spinId,
            claimCode: spinData?.claimCode,
            userName: spinData?.userName || 'Usuario',
            timestamp: new Date().toISOString(),
            status: 'unread'
        });

        return { success: true };
    } catch (e: any) {
        throw new Error(e.message);
    }
}

/**
 * Updates prize status from the business dashboard (delivered/expired).
 */
export async function updatePrizeStatus(spinId: string, status: 'delivered' | 'expired') {
    try {
        await getAdminDb().collection('redsorpresas_spins').doc(spinId).update({
            status,
            finalizedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (e: any) {
        throw new Error(e.message);
    }
}

