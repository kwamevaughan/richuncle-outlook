// Generate secure challenge for WebAuthn registration (simplified version)
import supabaseAdmin from '@/lib/supabaseAdmin';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, excludeCredentials = true } = req.body;

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

    // Get existing credentials to exclude (if needed)
    let excludeCredentialList = [];
    if (excludeCredentials) {
      const { data: existingCredentials } = await supabaseAdmin
        .from('user_credentials')
        .select('credential_id')
        .eq('user_id', userId);
      
      excludeCredentialList = existingCredentials || [];
    }

    // Generate a secure random challenge
    const challenge = crypto.randomBytes(32).toString('base64url');
    
    // Generate session ID for challenge storage
    const sessionId = crypto.randomUUID();

    // Create registration options manually (compatible without @simplewebauthn/server)
    const options = {
      challenge,
      rp: {
        name: process.env.WEBAUTHN_RP_NAME || 'RichUncle POS System',
        id: process.env.WEBAUTHN_RP_ID || 'localhost',
      },
      user: {
        id: user.id,
        name: user.email,
        displayName: user.full_name,
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      excludeCredentials: excludeCredentialList.map(cred => ({
        id: Buffer.from(cred.credential_id, 'base64url'),
        type: 'public-key',
        transports: ['internal'],
      })),
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        requireResidentKey: true,
        residentKey: "required"
      },
      timeout: 60000,
      attestation: "direct"
    };

    return res.status(200).json({
      success: true,
      options,
      sessionId,
      // Include challenge directly for client compatibility
      challenge: options.challenge,
    });
  } catch (error) {
    console.error('Error generating WebAuthn registration challenge:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}