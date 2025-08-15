import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { 
  isWebAuthnSupported, 
  isPlatformAuthenticatorAvailable, 
  authenticateCredential,
  getDeviceInfo 
} from '@/utils/webauthn';

export default function BiometricLoginButton({ 
  email, 
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

  const handleBiometricLogin = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }

    setIsAuthenticating(true);
    const toastId = toast.loading(`Authenticating with ${deviceInfo.biometricType}...`);

    try {
      // Get login challenge
      const challengeResponse = await fetch('/api/auth/webauthn/login-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const challengeResult = await challengeResponse.json();

      if (!challengeResult.success) {
        if (challengeResult.error === 'No biometric authentication setup found') {
          toast.error('Biometric authentication not set up for this account', { id: toastId });
          return;
        }
        throw new Error(challengeResult.error || 'Failed to get login challenge');
      }

      // Authenticate with biometric
      const assertion = await authenticateCredential(
        challengeResult.challenge,
        challengeResult.allowCredentials
      );

      // Complete authentication
      const loginResponse = await fetch('/api/auth/webauthn/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          assertion,
          challenge: challengeResult.challenge,
        }),
      });

      const loginResult = await loginResponse.json();

      if (!loginResult.success) {
        throw new Error(loginResult.error || 'Authentication failed');
      }

      toast.success('Login successful!', { id: toastId });
      
      // Call success callback with user data
      if (onSuccess) {
        onSuccess(loginResult.user);
      }

    } catch (error) {
      console.error('Biometric login error:', error);
      toast.error(error.message || 'Biometric authentication failed', { id: toastId });
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
      onClick={handleBiometricLogin}
      disabled={isAuthenticating || !email}
      className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border-2 border-dashed transition-all duration-200 ${
        mode === 'dark'
          ? 'border-green-600/50 bg-green-900/20 text-green-400 hover:border-green-500 hover:bg-green-900/30'
          : 'border-green-300 bg-green-50 text-green-700 hover:border-green-400 hover:bg-green-100'
      } ${isAuthenticating || !email ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'} ${className}`}
    >
      {isAuthenticating ? (
        <>
          <Icon icon="solar:loading-bold" className="w-5 h-5 animate-spin" />
          <span className="font-medium">Authenticating...</span>
        </>
      ) : (
        <>
          <Icon icon="solar:shield-check-bold" className="w-5 h-5" />
          <span className="font-medium">Login with {deviceInfo.biometricType}</span>
        </>
      )}
    </button>
  );
}