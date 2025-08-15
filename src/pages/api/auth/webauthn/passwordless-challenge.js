// Generate secure challenge for passwordless WebAuthn authentication
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import challengeStore from '@/lib/challengeStore';
import { webauthnConfig, validateWebAuthnConfig } from '@/lib/webauthnConfig';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate WebAuthn configuration
    const configErrors = validateWebAuthnConfig();
    if (configErrors.length > 0) {
      console.error('WebAuthn configuration errors:', configErrors);
      return res.status(500).json({ error: 'WebAuthn configuration error' });
    }

    // Generate authentication options for passwordless login
    const options = await generateAuthenticationOptions({
      rpID: webauthnConfig.rpID,
      timeout: webauthnConfig.timeout,
      userVerification: 'required',
      // For passwordless/discoverable credentials, we don't specify allowCredentials
      // This allows the authenticator to present all available credentials for this domain
    });

    // Generate session ID for challenge storage
    const sessionId = crypto.randomUUID();

    // Store challenge securely with expiration
    challengeStore.store(sessionId, options.challenge, webauthnConfig.timeout);

    return res.status(200).json({
      success: true,
      options,
      sessionId, // Client needs this to complete authentication
    });
  } catch (error) {
    console.error('Error generating passwordless WebAuthn challenge:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}