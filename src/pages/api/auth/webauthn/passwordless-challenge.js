// Generate secure challenge for passwordless WebAuthn authentication
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate a secure random challenge
    const challenge = crypto.randomBytes(32).toString('base64url');
    
    // Generate session ID for challenge storage
    const sessionId = crypto.randomUUID();

    // Create authentication options manually (compatible without @simplewebauthn/server)
    const options = {
      challenge,
      timeout: 60000, // 1 minute
      rpId: process.env.WEBAUTHN_RP_ID || 'localhost',
      userVerification: 'required',
      // For passwordless/discoverable credentials, we don't specify allowCredentials
      // This allows the authenticator to present all available credentials for this domain
    };

    // In production, you would store the challenge in Redis or database
    // For now, we'll include it in the response and validate it later
    
    return res.status(200).json({
      success: true,
      options,
      sessionId,
      // Include challenge directly for client compatibility
      challenge: options.challenge,
    });
  } catch (error) {
    console.error('Error generating passwordless WebAuthn challenge:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}