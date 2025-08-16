/**
 * Checks for register sessions that have been open for more than 24 hours
 * @returns {Promise<Array>} Array of long-running sessions
 */
export const checkLongRunningSessions = async () => {
  try {
    const response = await fetch('/api/cash-register-sessions?status=open');
    const { data: sessions } = await response.json();
    
    if (!Array.isArray(sessions)) return [];
    
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const now = new Date();
    
    return sessions.filter(session => {
      if (!session?.opened_at) return false;
      const openedAt = new Date(session.opened_at);
      return (now - openedAt) > TWENTY_FOUR_HOURS_MS;
    });
  } catch (error) {
    console.error('Error checking long-running sessions:', error);
    return [];
  }
};
