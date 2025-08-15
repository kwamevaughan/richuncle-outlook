// Secure challenge storage for WebAuthn
// In production, use Redis or a proper cache

class ChallengeStore {
  constructor() {
    this.challenges = new Map();
    this.cleanup();
  }

  // Store challenge with expiration
  store(sessionId, challenge, expiresIn = 60000) { // 1 minute default
    const expiresAt = Date.now() + expiresIn;
    this.challenges.set(sessionId, {
      challenge,
      expiresAt,
      used: false
    });
  }

  // Retrieve and mark challenge as used
  consume(sessionId) {
    const stored = this.challenges.get(sessionId);
    
    if (!stored) {
      return null;
    }

    if (stored.used) {
      return null; // Challenge already used
    }

    if (Date.now() > stored.expiresAt) {
      this.challenges.delete(sessionId);
      return null; // Challenge expired
    }

    // Mark as used to prevent replay
    stored.used = true;
    
    // Clean up after short delay
    setTimeout(() => {
      this.challenges.delete(sessionId);
    }, 5000);

    return stored.challenge;
  }

  // Clean up expired challenges every 5 minutes
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, stored] of this.challenges.entries()) {
        if (now > stored.expiresAt) {
          this.challenges.delete(sessionId);
        }
      }
    }, 5 * 60 * 1000);
  }
}

// Singleton instance
const challengeStore = new ChallengeStore();
export default challengeStore;