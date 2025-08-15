// Complete WebAuthn registration with full security verification
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import challengeStore from '@/lib/challengeStore';
import { webauthnConfig } from '@/lib/webauthnConfig';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, credential, sessionId, deviceInfo } = req.body;

    if (!userId || !credential || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Retrieve and consume the challenge (prevents replay attacks)
    const expectedChallenge = challengeStore.consume(sessionId);
    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Invalid or expired challenge' });
    }

    // Get user details for verification
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify the registration response cryptographically
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: webauthnConfig.expectedOrigins,
      expectedRPID: webauthnConfig.rpID,
      requireUserVerification: true,
    });

    if (!verification.verified) {
      console.error('WebAuthn registration verification failed:', verification);
      return res.status(400).json({ error: 'Registration verification failed' });
    }

    const { registrationInfo } = verification;

    // Check if credential ID already exists (prevent duplicate registrations)
    const { data: existingCred } = await supabaseAdmin
      .from('user_credentials')
      .select('id')
      .eq('credential_id', registrationInfo.credentialID)
      .single();

    if (existingCred) {
      return res.status(400).json({ error: 'Credential already registered' });
    }

    // Store the verified credential securely
    const { data, error } = await supabaseAdmin
      .from('user_credentials')
      .insert({
        user_id: userId,
        credential_id: registrationInfo.credentialID,
        credential_data: {
          credentialPublicKey: Array.from(registrationInfo.credentialPublicKey),
          counter: registrationInfo.counter,
          credentialDeviceType: registrationInfo.credentialDeviceType,
          credentialBackedUp: registrationInfo.credentialBackedUp,
          transports: credential.response.transports || ['internal'],
        },
        device_info: deviceInfo,
        created_at: new Date().toISOString(),
        last_used: null,
        is_active: true,
      });

    if (error) {
      console.error('Error storing WebAuthn credential:', error);
      return res.status(500).json({ error: 'Failed to store credential' });
    }

    return res.status(200).json({
      success: true,
      message: 'Biometric authentication setup successfully',
      verified: true,
    });
  } catch (error) {
    console.error('Error completing WebAuthn registration:', error);
    return res.status(500).json({ 
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}