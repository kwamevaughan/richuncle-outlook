// Generate challenge for WebAuthn authentication
import crypto from 'crypto';
import supabaseAdmin from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get user and their credentials
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's credentials
    const { data: credentials, error: credError } = await supabaseAdmin
      .from('user_credentials')
      .select('credential_id, device_info')
      .eq('user_id', user.id);

    if (credError) {
      return res.status(500).json({ error: 'Failed to fetch credentials' });
    }

    if (!credentials || credentials.length === 0) {
      return res.status(404).json({ error: 'No biometric authentication setup found' });
    }

    // Generate a random challenge
    const challenge = crypto.randomBytes(32).toString('base64url');

    // Format credentials for WebAuthn
    const allowCredentials = credentials.map(cred => ({
      id: cred.credential_id,
      type: 'public-key',
      transports: ['internal'], // Platform authenticator
    }));

    return res.status(200).json({
      success: true,
      challenge,
      allowCredentials,
      timeout: 60000, // 1 minute
    });
  } catch (error) {
    console.error('Error generating WebAuthn login challenge:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}