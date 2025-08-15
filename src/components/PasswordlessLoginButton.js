import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { 
  isWebAuthnSupported, 
  isPlatformAuthenticatorAvailable, 
  authenticateCredential,
  getDeviceInfo 
} from '@/utils/webauthn';

export default function PasswordlessLoginButton({ 
  onSuccess, 
  mode = 'light',
  className = '' 
}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ deviceType: 'Unknown', biometricType: 'Biometric' });

  useEffect(() => {
    checkBiometricSupport();
    setDeviceInfo(getDeviceInfo());
  }, []);

  const checkBiometricSupport = async () => {
    setIsLoading(true);
    try {
      const supported = isWebAuthnSupported();
      setIsSupported(supported);
      
      if (supported) {
        const available = await isPlatformAuthenticatorAvailable();
        setIsAvailable(available);
      }
    } catch (error) {
      console.error('Error checking biometric support:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordlessLogin = async () => {
    setIsAuthenticating(true);
    const toastId = toast.loading(`Authenticating with ${deviceInfo.biometricType}...`);

    try {
      // Get passwordless login challenge (no email required)
      const challengeResponse = await fetch('/api/auth/webauthn/passwordless-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // No email needed
      });

      const challengeResult = await challengeResponse.json();

      if (!challengeResult.success) {
        throw new Error(challengeResult.error || 'Failed to get login challenge');
      }

      // Authenticate with biometric (discoverable credentials)
      // Handle both challenge formats for compatibility
      const challenge = challengeResult.challenge || challengeResult.options?.challenge;
      if (!challenge) {
        throw new Error('No challenge received from server');
      }
      
      const assertion = await authenticateCredential(
        challenge,
        [] // Empty array allows discoverable credentials
      );

      // Complete passwordless authentication
      const loginResponse = await fetch('/api/auth/webauthn/passwordless-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assertion,
          sessionId: challengeResult.sessionId,
        }),
      });

      const loginResult = await loginResponse.json();

      if (!loginResult.success) {
        if (loginResult.error === 'Invalid or inactive credential') {
          toast.error('No biometric login found. Please set up biometric authentication in your profile first.', { id: toastId });
          return;
        }
        throw new Error(loginResult.error || 'Authentication failed');
      }

      toast.success(`Welcome back, ${loginResult.user.full_name}!`, { id: toastId });
      
      // Call success callback with user data
      if (onSuccess) {
        onSuccess(loginResult.user);
      }

    } catch (error) {
      console.error('Passwordless login error:', error);
      
      if (error.message.includes('No credentials available')) {
        toast.error('No biometric login found. Please set up biometric authentication in your profile first.', { id: toastId });
      } else if (error.message.includes('cancelled')) {
        toast.error('Biometric authentication was cancelled', { id: toastId });
      } else {
        toast.error(error.message || 'Biometric authentication failed', { id: toastId });
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Don't render if not supported or available
  if (isLoading || !isSupported || !isAvailable) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handlePasswordlessLogin}
      disabled={isAuthenticating}
      className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl border-2 transition-all duration-300 ${
        mode === 'dark'
          ? 'border-green-600/30 bg-gradient-to-r from-blue-900/20 to-blue-900/20 text-blue-400 hover:border-blue-500/50 hover:from-blue-900/30 hover:to-blue-900/30 shadow-lg shadow-blue-900/10'
          : 'border-blue-300/50 bg-gradient-to-r from-blue-50 to-blue-50 text-blue-700 hover:border-blue-400/70 hover:from-blue-100 hover:to-blue-100 shadow-lg shadow-blue-900/5'
      } ${isAuthenticating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-xl'} ${className}`}
    >
      {isAuthenticating ? (
        <>
          <Icon icon="solar:loading-bold" className="w-6 h-6 animate-spin" />
          <div className="text-center">
            <div className="font-semibold">Authenticating...</div>
            <div className="text-sm opacity-75">Please complete biometric verification</div>
          </div>
        </>
      ) : (
        <>
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Icon icon="solar:shield-check-bold" className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">Quick Login</div>
            <div className="text-sm opacity-75">Use {deviceInfo.biometricType}</div>
          </div>
        </>
      )}
    </button>
  );
}