import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { 
  isWebAuthnSupported, 
  isPlatformAuthenticatorAvailable, 
  registerCredential,
  getDeviceInfo 
} from '@/utils/webauthn';

export default function BiometricAuthSection({ user, mode = 'light' }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [credentials, setCredentials] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState({ deviceType: 'Unknown', biometricType: 'Biometric' });

  useEffect(() => {
    checkBiometricSupport();
    fetchUserCredentials();
    setDeviceInfo(getDeviceInfo());
  }, [user]);

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

  const fetchUserCredentials = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/users/${user.id}/credentials`);
      const result = await response.json();
      
      if (result.success) {
        setCredentials(result.data || []);
        setIsEnabled(result.data && result.data.length > 0);
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
    }
  };

  const handleEnableBiometric = async () => {
    if (!user) return;
    
    setIsRegistering(true);
    const toastId = toast.loading('Setting up biometric authentication...');
    
    try {
      // Get registration challenge
      const challengeResponse = await fetch('/api/auth/webauthn/register-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      
      const challengeResult = await challengeResponse.json();
      
      if (!challengeResult.success) {
        throw new Error(challengeResult.error || 'Failed to get registration challenge');
      }
      
      // Register credential
      const credential = await registerCredential(
        user.id,
        user.name,
        user.email,
        challengeResult.challenge
      );
      
      // Complete registration
      const registerResponse = await fetch('/api/auth/webauthn/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          credential,
          challenge: challengeResult.challenge,
          deviceInfo,
        }),
      });
      
      const registerResult = await registerResponse.json();
      
      if (!registerResult.success) {
        throw new Error(registerResult.error || 'Failed to complete registration');
      }
      
      toast.success('Biometric authentication enabled successfully!', { id: toastId });
      setIsEnabled(true);
      fetchUserCredentials(); // Refresh credentials list
      
    } catch (error) {
      console.error('Error enabling biometric auth:', error);
      toast.error(error.message || 'Failed to enable biometric authentication', { id: toastId });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDisableBiometric = async () => {
    if (!user) return;
    
    const toastId = toast.loading('Disabling biometric authentication...');
    
    try {
      const response = await fetch(`/api/users/${user.id}/credentials`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to disable biometric authentication');
      }
      
      toast.success('Biometric authentication disabled', { id: toastId });
      setIsEnabled(false);
      setCredentials([]);
      
    } catch (error) {
      console.error('Error disabling biometric auth:', error);
      toast.error(error.message || 'Failed to disable biometric authentication', { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className={`rounded-2xl shadow-lg border backdrop-blur-sm ${
        mode === 'dark'
          ? 'bg-gray-800/90 border-gray-700/50 shadow-gray-900/20'
          : 'bg-white/90 border-gray-200/50 shadow-gray-900/10'
      }`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Icon icon="solar:shield-check-bold" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Biometric Authentication
              </h3>
              <p className={`text-sm ${mode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Checking device compatibility...
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center py-8">
            <Icon icon="solar:loading-bold" className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        </div>
      </div>
    );
  }

  if (!isSupported || !isAvailable) {
    return (
      <div className={`rounded-2xl shadow-lg border backdrop-blur-sm ${
        mode === 'dark'
          ? 'bg-gray-800/90 border-gray-700/50 shadow-gray-900/20'
          : 'bg-white/90 border-gray-200/50 shadow-gray-900/10'
      }`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl flex items-center justify-center shadow-lg">
              <Icon icon="solar:shield-cross-bold" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Biometric Authentication
              </h3>
              <p className={`text-sm ${mode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Not available on this device
              </p>
            </div>
          </div>
          <div className={`p-4 rounded-lg ${mode === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="solar:info-circle-bold" className="w-4 h-4 text-amber-500" />
              <span className={`text-sm font-medium ${mode === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
                Requirements not met
              </span>
            </div>
            <p className={`text-sm ${mode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {!isSupported 
                ? 'Your browser does not support biometric authentication.'
                : 'No biometric sensors detected on this device.'
              }
            </p>
            <p className={`text-xs mt-2 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Biometric login requires a modern browser and device with Face ID, Touch ID, fingerprint sensor, or Windows Hello.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl shadow-lg border backdrop-blur-sm ${
      mode === 'dark'
        ? 'bg-gray-800/90 border-gray-700/50 shadow-gray-900/20'
        : 'bg-white/90 border-gray-200/50 shadow-gray-900/10'
    }`}>
      <div className={`px-6 py-4 border-b ${
        mode === 'dark'
          ? 'bg-gradient-to-r from-gray-700/80 to-green-900/40 border-gray-700/50'
          : 'bg-gradient-to-r from-gray-50/80 to-green-50/40 border-gray-200/50'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <Icon icon="solar:shield-check-bold" className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Biometric Authentication
            </h3>
            <p className={`text-sm ${mode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Secure login with {deviceInfo.biometricType}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
            <div>
              <p className={`font-medium ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </p>
              <p className={`text-sm ${mode === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {isEnabled 
                  ? `Login with ${deviceInfo.biometricType} on ${deviceInfo.deviceType}`
                  : `Enable ${deviceInfo.biometricType} for quick and secure login`
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={isEnabled ? handleDisableBiometric : handleEnableBiometric}
            disabled={isRegistering}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isEnabled
                ? mode === 'dark'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                : mode === 'dark'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
            } ${isRegistering ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRegistering ? (
              <div className="flex items-center gap-2">
                <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                Setting up...
              </div>
            ) : isEnabled ? (
              'Disable'
            ) : (
              'Enable'
            )}
          </button>
        </div>

        {/* Device Info */}
        <div className={`p-4 rounded-lg ${mode === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="solar:devices-bold" className="w-4 h-4 text-blue-500" />
            <span className={`text-sm font-medium ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Device Information
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className={`${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Device:</span>
              <p className={`${mode === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{deviceInfo.deviceType}</p>
            </div>
            <div>
              <span className={`${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Method:</span>
              <p className={`${mode === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{deviceInfo.biometricType}</p>
            </div>
          </div>
        </div>

        {/* Credentials List */}
        {isEnabled && credentials.length > 0 && (
          <div className={`p-4 rounded-lg ${mode === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="solar:key-bold" className="w-4 h-4 text-green-500" />
              <span className={`text-sm font-medium ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Registered Devices ({credentials.length})
              </span>
            </div>
            <div className="space-y-2">
              {credentials.map((cred, index) => (
                <div key={cred.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:shield-check-bold" className="w-3 h-3 text-green-500" />
                    <span className={`text-sm ${mode === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                      {cred.device_info?.deviceType || `Device ${index + 1}`}
                    </span>
                  </div>
                  <span className={`text-xs ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {cred.last_used ? `Last used ${new Date(cred.last_used).toLocaleDateString()}` : 'Never used'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className={`p-3 rounded-lg ${mode === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
          <div className="flex items-start gap-2">
            <Icon icon="solar:info-circle-bold" className="w-4 h-4 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <p className={`font-medium ${mode === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
                How it works
              </p>
              <p className={`${mode === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
                Once enabled, you can login instantly using just your {deviceInfo.biometricType} - no email or password required! 
                Your biometric data stays secure on your device and is never sent to our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}