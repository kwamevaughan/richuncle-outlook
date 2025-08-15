// Complete WebAuthn registration
import supabaseAdmin from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, credential, challenge, deviceInfo } = req.body;

    if (!userId || !credential || !challenge) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In production, verify the credential with a WebAuthn library
    // For now, we'll store the credential data
    
    // Store the credential in the database
    const { data, error } = await supabaseAdmin
      .from('user_credentials')
      .insert({
        user_id: userId,
        credential_id: credential.id,
        credential_data: credential,
        device_info: deviceInfo,
        created_at: new Date().toISOString(),
        last_used: null,
      });

    if (error) {
      console.error('Error storing WebAuthn credential:', error);
      return res.status(500).json({ error: 'Failed to store credential' });
    }

    return res.status(200).json({
      success: true,
      message: 'Biometric authentication setup successfully',
    });
  } catch (error) {
    console.error('Error completing WebAuthn registration:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}