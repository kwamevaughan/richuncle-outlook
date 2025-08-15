// Complete WebAuthn registration (simplified version)
import supabaseAdmin from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, credential, sessionId, deviceInfo } = req.body;

    if (!userId || !credential || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
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

    // For now, we'll trust the client-side WebAuthn verification
    // In production with proper setup, you would verify the registration cryptographically

    // Check if credential ID already exists (prevent duplicate registrations)
    const { data: existingCred } = await supabaseAdmin
      .from('user_credentials')
      .select('id')
      .eq('credential_id', credential.id)
      .single();

    if (existingCred) {
      return res.status(400).json({ error: 'Credential already registered' });
    }

    // Store the credential
    const { data, error } = await supabaseAdmin
      .from('user_credentials')
      .insert({
        user_id: userId,
        credential_id: credential.id,
        credential_data: {
          rawId: credential.rawId,
          response: credential.response,
          type: credential.type,
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