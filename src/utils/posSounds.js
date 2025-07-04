// POS Sound Utilities
// Reusable sound functions for the POS system

/**
 * Plays a high-pitched glass bell sound (like hitting glass with metal or spoon)
 * @param {number} frequency - Frequency in Hz (default: 2400 for high-pitched glass sound)
 * @param {number} duration - Duration in seconds (default: 0.2)
 * @param {number} volume - Volume 0-1 (default: 0.35)
 */
export const playBellBeep = (frequency = 2400, duration = 0.2, volume = 0.35) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create multiple oscillators for a sharp glass-like sound
    const oscillators = [];
    const gainNodes = [];
    
    // Main frequency (high-pitched glass tone)
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
    
    // High harmonic frequencies for sharp glass resonance
    const harmonics = [2.0, 3.0, 4.0, 5.0]; // Higher harmonic ratios for glass-like sound
    harmonics.forEach((ratio, index) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.frequency.setValueAtTime(frequency * ratio, audioContext.currentTime);
      osc.type = 'sine';
      gain.gain.setValueAtTime(volume * 0.25 * (1 - index * 0.15), audioContext.currentTime); // Higher harmonics for glass
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration * 0.6); // Faster decay for sharp sound
      osc.connect(gain);
      gain.connect(audioContext.destination);
      oscillators.push(osc);
      gainNodes.push(gain);
    });
    
    // Add a very high frequency component for the "ting" sound
    const tingOsc = audioContext.createOscillator();
    const tingGain = audioContext.createGain();
    tingOsc.frequency.setValueAtTime(frequency * 6.0, audioContext.currentTime); // Very high frequency
    tingOsc.type = 'sine';
    tingGain.gain.setValueAtTime(volume * 0.15, audioContext.currentTime);
    tingGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration * 0.4); // Very fast decay
    tingOsc.connect(tingGain);
    tingGain.connect(audioContext.destination);
    oscillators.push(tingOsc);
    gainNodes.push(tingGain);
    
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
 * Plays a classic POS scanner beep sound
 * @param {number} frequency - Frequency in Hz (default: 800)
 * @param {number} duration - Duration in seconds (default: 0.1)
 * @param {number} volume - Volume 0-1 (default: 0.3)
 */
export const playScannerBeep = (frequency = 800, duration = 0.1, volume = 0.3) => {
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
 * Plays a success sound (bell-like by default)
 */
export const playSuccessSound = () => {
  playBellBeep();
};

/**
 * Plays an error sound (lower frequency, shorter duration)
 */
export const playErrorSound = () => {
  playBellBeep(600, 0.08, 0.3);
}; 