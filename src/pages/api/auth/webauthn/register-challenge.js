// Generate secure challenge for WebAuthn registration
import { generateRegistrationOptions } from '@simplewebauthn/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
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

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get existing credentials to exclude them
    const { data: existingCredentials } = await supabaseAdmin
      .from('user_credentials')
      .select('credential_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    const excludeCredentials = existingCredentials?.map(cred => ({
      id: cred.credential_id,
      type: 'public-key',
      transports: ['internal']
    })) || [];

    // Generate registration options using the secure library
    const options = await generateRegistrationOptions({
      rpName: webauthnConfig.rpName,
      rpID: webauthnConfig.rpID,
      userID: new TextEncoder().encode(user.id),
      userName: user.email,
      userDisplayName: user.full_name,
      timeout: webauthnConfig.timeout,
      attestationType: webauthnConfig.attestation,
      excludeCredentials,
      authenticatorSelection: webauthnConfig.authenticatorSelection,
      supportedAlgorithmIDs: webauthnConfig.supportedAlgorithmIDs,
    });

    // Generate session ID for challenge storage
    const sessionId = crypto.randomUUID();

    // Store challenge securely with expiration
    challengeStore.store(sessionId, options.challenge, webauthnConfig.timeout);

    return res.status(200).json({
      success: true,
      options,
      sessionId, // Client needs this to complete registration
    });
  } catch (error) {
    console.error('Error generating WebAuthn registration challenge:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}