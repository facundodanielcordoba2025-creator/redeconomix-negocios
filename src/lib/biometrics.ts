/**
 * RedEconomiX Biometric Security Engine
 * Uses Web Authentication API (WebAuthn) for native platform auth.
 */

export async function checkBiometryAvailability(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
    
    try {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
    } catch {
        return false;
    }
}

export async function authenticateWithBiometry(): Promise<boolean> {
    if (!(await checkBiometryAvailability())) {
        throw new Error("Biometría no disponible en este dispositivo");
    }

    try {
        // En un entorno web, "autenticar" usualmente implica crear un reto.
        // Aquí simulamos el acceso al autenticador nativo del dispositivo (FaceID/TouchID)
        // usando el estándar WebAuthn con requerimientos de verificación de usuario.
        
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const options: PublicKeyCredentialCreationOptions = {
            challenge,
            rp: { name: "RedEconomiX Terminal", id: window.location.hostname },
            user: {
                id: new Uint8Array(16),
                name: "retailer-rex",
                displayName: "Dueño RedEconomiX"
            },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }], // ES256
            authenticatorSelection: {
                userVerification: "required",
                authenticatorAttachment: "platform"
            },
            timeout: 60000
        };

        // Esto disparará la UI nativa (FaceID/TouchID/Huella)
        await navigator.credentials.create({ publicKey: options });
        return true;
    } catch (e: any) {
        console.error("Biometric failure:", e);
        return false;
    }
}
