// WebAuthn configuration for production security

export const webauthnConfig = {
  // Relying Party (your application)
  rpName: process.env.WEBAUTHN_RP_NAME || 'RichUncle POS System',
  rpID: process.env.WEBAUTHN_RP_ID || 'localhost', // Should be your domain in production
  
  // Expected origin(s) - CRITICAL for security
  expectedOrigins: process.env.NODE_ENV === 'production' 
    ? [process.env.NEXT_PUBLIC_BASE_URL_PROD]
    : ['http://localhost:3000', 'https://localhost:3000'],
  
  // Timeout for authentication (in milliseconds)
  timeout: 60000, // 1 minute
  
  // Supported algorithms (in order of preference)
  supportedAlgorithmIDs: [-7, -257], // ES256, RS256
  
  // Authenticator selection criteria
  authenticatorSelection: {
    authenticatorAttachment: 'platform', // Platform authenticators only
    userVerification: 'required',
    requireResidentKey: true,
    residentKey: 'required'
  },
  
  // Attestation preference
  attestation: 'direct'
};

// Validate environment configuration
export function validateWebAuthnConfig() {
  const errors = [];
  
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.WEBAUTHN_RP_ID) {
      errors.push('WEBAUTHN_RP_ID environment variable is required in production');
    }
    
    if (!process.env.NEXT_PUBLIC_BASE_URL_PROD) {
      errors.push('NEXT_PUBLIC_BASE_URL_PROD environment variable is required in production');
    }
    
    if (process.env.WEBAUTHN_RP_ID === 'localhost') {
      errors.push('WEBAUTHN_RP_ID cannot be localhost in production');
    }
  }
  
  return errors;
}