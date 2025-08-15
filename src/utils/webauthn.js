// WebAuthn utility functions for biometric authentication
import { base64URLStringToBuffer, bufferToBase64URLString } from './base64url';

// Check if WebAuthn is supported
export const isWebAuthnSupported = () => {
  return !!(navigator.credentials && navigator.credentials.create);
};

// Check if platform authenticator (biometric) is available
export const isPlatformAuthenticatorAvailable = async () => {
  if (!isWebAuthnSupported()) return false;
  
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error('Error checking platform authenticator:', error);
    return false;
  }
};

// Register a new credential (setup biometric authentication)
export const registerCredential = async (userId, userName, userEmail, challenge) => {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  const publicKeyCredentialCreationOptions = {
    challenge: base64URLStringToBuffer(challenge),
    rp: {
      name: "RichUncle POS System",
      id: window.location.hostname,
    },
    user: {
      id: new TextEncoder().encode(userId.toString()),
      name: userEmail,
      displayName: userName,
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" }, // ES256
      { alg: -257, type: "public-key" }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform", // Use platform authenticator (biometric)
      userVerification: "required",
      requireResidentKey: true, // Enable discoverable credentials
      residentKey: "required", // Require resident key for passwordless login
    },
    timeout: 60000,
    attestation: "direct",
  };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

    if (!credential) {
      throw new Error('Failed to create credential');
    }

    // Convert credential to format suitable for server
    const credentialData = {
      id: credential.id,
      rawId: bufferToBase64URLString(credential.rawId),
      type: credential.type,
      response: {
        attestationObject: bufferToBase64URLString(credential.response.attestationObject),
        clientDataJSON: bufferToBase64URLString(credential.response.clientDataJSON),
      },
    };

    return credentialData;
  } catch (error) {
    console.error('WebAuthn registration error:', error);
    
    if (error.name === 'NotAllowedError') {
      throw new Error('Biometric authentication was cancelled or not allowed');
    } else if (error.name === 'NotSupportedError') {
      throw new Error('Biometric authentication is not supported on this device');
    } else if (error.name === 'SecurityError') {
      throw new Error('Security error occurred during biometric setup');
    } else {
      throw new Error('Failed to setup biometric authentication: ' + error.message);
    }
  }
};

// Authenticate using existing credential (biometric login)
export const authenticateCredential = async (challenge, allowCredentials = []) => {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this browser');
  }

  // Validate challenge
  if (!challenge || typeof challenge !== 'string') {
    throw new Error('Invalid challenge: challenge is required and must be a string');
  }

  let challengeBuffer;
  try {
    challengeBuffer = base64URLStringToBuffer(challenge);
  } catch (error) {
    throw new Error(`Failed to process challenge: ${error.message}`);
  }

  const publicKeyCredentialRequestOptions = {
    challenge: challengeBuffer,
    // For discoverable credentials, we can omit allowCredentials to let the authenticator
    // present all available credentials for the current domain
    allowCredentials: allowCredentials.length > 0 ? allowCredentials.map(cred => {
      if (!cred.id) {
        throw new Error('Invalid credential: missing id');
      }
      return {
        id: base64URLStringToBuffer(cred.id),
        type: 'public-key',
        transports: cred.transports || ['internal'],
      };
    }) : [], // Empty array allows discoverable credentials
    userVerification: "required",
    timeout: 60000,
  };

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    if (!assertion) {
      throw new Error('Failed to authenticate');
    }

    // Convert assertion to format suitable for server
    const assertionData = {
      id: assertion.id,
      rawId: bufferToBase64URLString(assertion.rawId),
      type: assertion.type,
      response: {
        authenticatorData: bufferToBase64URLString(assertion.response.authenticatorData),
        clientDataJSON: bufferToBase64URLString(assertion.response.clientDataJSON),
        signature: bufferToBase64URLString(assertion.response.signature),
        userHandle: assertion.response.userHandle ? bufferToBase64URLString(assertion.response.userHandle) : null,
      },
    };

    return assertionData;
  } catch (error) {
    console.error('WebAuthn authentication error:', error);
    
    if (error.name === 'NotAllowedError') {
      throw new Error('Biometric authentication was cancelled or failed');
    } else if (error.name === 'NotSupportedError') {
      throw new Error('Biometric authentication is not supported on this device');
    } else {
      throw new Error('Biometric authentication failed: ' + error.message);
    }
  }
};

// Get device info for display purposes
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let deviceType = 'Unknown';
  let biometricType = 'Biometric';

  // Detect device type and likely biometric method
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    deviceType = 'iOS Device';
    biometricType = 'Face ID / Touch ID';
  } else if (/Android/.test(userAgent)) {
    deviceType = 'Android Device';
    biometricType = 'Fingerprint / Face Unlock';
  } else if (/Windows/.test(userAgent)) {
    deviceType = 'Windows Device';
    biometricType = 'Windows Hello';
  } else if (/Mac/.test(userAgent)) {
    deviceType = 'Mac Device';
    biometricType = 'Touch ID';
  }

  return { deviceType, biometricType };
};