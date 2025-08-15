// Base64URL encoding/decoding utilities for WebAuthn

export function base64URLStringToBuffer(base64URLString) {
  // Validate input
  if (!base64URLString || typeof base64URLString !== 'string') {
    throw new Error('Invalid base64URL string: input is null, undefined, or not a string');
  }
  
  // Convert base64url to base64
  const base64 = base64URLString
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // Add padding if needed
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  
  try {
    // Decode base64 to binary string
    const binaryString = atob(padded);
    
    // Convert binary string to ArrayBuffer
    const buffer = new ArrayBuffer(binaryString.length);
    const view = new Uint8Array(buffer);
    
    for (let i = 0; i < binaryString.length; i++) {
      view[i] = binaryString.charCodeAt(i);
    }
    
    return buffer;
  } catch (error) {
    throw new Error(`Failed to decode base64URL string: ${error.message}`);
  }
}

export function bufferToBase64URLString(buffer) {
  // Validate input
  if (!buffer || !(buffer instanceof ArrayBuffer)) {
    throw new Error('Invalid buffer: input is null, undefined, or not an ArrayBuffer');
  }
  
  try {
    // Convert ArrayBuffer to binary string
    const view = new Uint8Array(buffer);
    let binaryString = '';
    
    for (let i = 0; i < view.length; i++) {
      binaryString += String.fromCharCode(view[i]);
    }
    
    // Encode binary string to base64
    const base64 = btoa(binaryString);
    
    // Convert base64 to base64url
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch (error) {
    throw new Error(`Failed to encode buffer to base64URL: ${error.message}`);
  }
}