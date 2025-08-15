// Generate challenge for WebAuthn registration
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Generate a random challenge
    const challenge = crypto.randomBytes(32).toString('base64url');

    // Store challenge temporarily (in production, use Redis or database)
    // For now, we'll return it and expect it back during registration
    
    return res.status(200).json({
      success: true,
      challenge,
      timeout: 60000, // 1 minute
    });
  } catch (error) {
    console.error('Error generating WebAuthn challenge:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}