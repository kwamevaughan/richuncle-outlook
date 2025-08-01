// Message Sound Utilities
// Reusable sound functions for the messaging system

/**
 * Plays a message notification sound (gentle chime)
 * @param {number} frequency - Frequency in Hz (default: 1200 for gentle chime)
 * @param {number} duration - Duration in seconds (default: 0.3)
 * @param {number} volume - Volume 0-1 (default: 0.25)
 */
export const playMessageNotification = (frequency = 1200, duration = 0.3, volume = 0.25) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create multiple oscillators for a gentle chime sound
    const oscillators = [];
    const gainNodes = [];
    
    // Main frequency (gentle chime tone)
    const mainOsc = audioContext.createOscillator();
    const mainGain = audioContext.createGain();
    mainOsc.frequency.setValueAtTime(frequency, audioContext.currentTime);
    mainOsc.type = 'sine';
    mainGain.gain.setValueAtTime(volume, audioContext.currentTime);
    mainGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    mainOsc.connect(mainGain);
    mainGain.connect(audioContext.destination);
    oscillators.push(mainOsc);
    gainNodes.push(mainGain);
    
    // Harmonic frequencies for gentle chime resonance
    const harmonics = [1.5, 2.0, 2.5]; // Gentle harmonic ratios
    harmonics.forEach((ratio, index) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.frequency.setValueAtTime(frequency * ratio, audioContext.currentTime);
      osc.type = 'sine';
      gain.gain.setValueAtTime(volume * 0.2 * (1 - index * 0.2), audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration * 0.8);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      oscillators.push(osc);
      gainNodes.push(gain);
    });
    
    // Add a gentle high frequency component for the "ding" sound
    const dingOsc = audioContext.createOscillator();
    const dingGain = audioContext.createGain();
    dingOsc.frequency.setValueAtTime(frequency * 3.0, audioContext.currentTime);
    dingOsc.type = 'sine';
    dingGain.gain.setValueAtTime(volume * 0.1, audioContext.currentTime);
    dingGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration * 0.6);
    dingOsc.connect(dingGain);
    dingGain.connect(audioContext.destination);
    oscillators.push(dingOsc);
    gainNodes.push(dingGain);
    
    // Start all oscillators
    oscillators.forEach(osc => {
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + duration);
    });
    
  } catch (error) {
    console.log('Audio not supported or blocked:', error);
  }
};

/**
 * Plays a message sent sound (successful send)
 * @param {number} frequency - Frequency in Hz (default: 800 for confirmation)
 * @param {number} duration - Duration in seconds (default: 0.15)
 * @param {number} volume - Volume 0-1 (default: 0.2)
 */
export const playMessageSent = (frequency = 800, duration = 0.15, volume = 0.2) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.log('Audio not supported or blocked:', error);
  }
};

/**
 * Plays a message error sound (failed send)
 * @param {number} frequency - Frequency in Hz (default: 400 for error)
 * @param {number} duration - Duration in seconds (default: 0.2)
 * @param {number} volume - Volume 0-1 (default: 0.3)
 */
export const playMessageError = (frequency = 400, duration = 0.2, volume = 0.3) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.log('Audio not supported or blocked:', error);
  }
}; 