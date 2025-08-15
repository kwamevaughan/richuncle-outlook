// Generate challenge for passwordless WebAuthn authentication (no email required)
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate a random challenge for passwordless authentication
    const challenge = crypto.randomBytes(32).toString('base64url');

    // For passwordless authentication, we don't need to look up specific credentials
    // The authenticator will present all available credentials for this domain
    
    return res.status(200).json({
      success: true,
      challenge,
      timeout: 60000, // 1 minute
    });
  } catch (error) {
    console.error('Error generating passwordless WebAuthn challenge:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}