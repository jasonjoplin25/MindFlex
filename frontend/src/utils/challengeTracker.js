/**
 * Challenge Tracking Utility
 * Tracks challenge progress and completion across game sessions
 */

// Get active challenge from session storage
export const getActiveChallenge = () => {
  const stored = sessionStorage.getItem('activeChallenge');
  return stored ? JSON.parse(stored) : null;
};

// Clear active challenge
export const clearActiveChallenge = () => {
  sessionStorage.removeItem('activeChallenge');
};

// Check if challenge is completed based on game results
export const checkChallengeCompletion = (challenge, gameResults) => {
  if (!challenge || !gameResults) return false;

  const { requirementType, requirement } = challenge;
  
  switch (requirementType) {
    case 'score':
      return gameResults.score >= requirement;
    
    case 'time':
      // Game duration in seconds should meet or exceed requirement
      return gameResults.duration >= requirement;
    
    case 'errors':
      // Number of errors should be at or below requirement (0 for perfect game)
      return (gameResults.errors || 0) <= requirement;
    
    case 'streak':
      // Streak of correct answers should meet or exceed requirement
      return (gameResults.streak || 0) >= requirement;
    
    default:
      return false;
  }
};

// Calculate challenge progress as percentage
export const calculateChallengeProgress = (challenge, gameResults) => {
  if (!challenge || !gameResults) return 0;

  const { requirementType, requirement } = challenge;
  
  switch (requirementType) {
    case 'score':
      return Math.min(100, (gameResults.score / requirement) * 100);
    
    case 'time':
      return Math.min(100, (gameResults.duration / requirement) * 100);
    
    case 'errors':
      // For error-based challenges, fewer errors = better progress
      // If requirement is 0 (perfect game), any error = 0% progress
      if (requirement === 0) {
        return (gameResults.errors || 0) === 0 ? 100 : 0;
      }
      // Otherwise, calculate based on how close to requirement
      const errorRate = (gameResults.errors || 0) / requirement;
      return Math.max(0, (1 - errorRate) * 100);
    
    case 'streak':
      return Math.min(100, ((gameResults.streak || 0) / requirement) * 100);
    
    default:
      return 0;
  }
};

// Update challenge progress in localStorage
export const updateChallengeProgress = (challengeId, gameResults) => {
  const today = new Date().toISOString().split('T')[0];
  const challengesKey = `challenges_${today}`;
  const storedChallenges = JSON.parse(localStorage.getItem(challengesKey)) || [];
  
  const updatedChallenges = storedChallenges.map(challenge => {
    if (challenge.id === challengeId) {
      const progress = calculateChallengeProgress(challenge, gameResults);
      const completed = checkChallengeCompletion(challenge, gameResults);
      
      return {
        ...challenge,
        progress: Math.round(progress),
        completed,
        gameResults: completed ? gameResults : challenge.gameResults // Store results only if completed
      };
    }
    return challenge;
  });
  
  localStorage.setItem(challengesKey, JSON.stringify(updatedChallenges));
  
  // Update challenge history if completed
  const completedChallenge = updatedChallenges.find(c => c.id === challengeId && c.completed);
  if (completedChallenge) {
    updateChallengeHistory(challengeId, completedChallenge);
  }
  
  return updatedChallenges;
};

// Update challenge history and streak
export const updateChallengeHistory = (challengeId, challenge) => {
  const historyData = JSON.parse(localStorage.getItem('challengeHistory')) || {
    streak: 0,
    lastCompletedDate: null,
    completedChallenges: [],
    totalXP: 0
  };
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Check if this is a continued streak
  let newStreak = historyData.streak;
  if (historyData.lastCompletedDate === yesterdayStr) {
    newStreak += 1;
  } else if (historyData.lastCompletedDate !== today) {
    newStreak = 1;
  }
  
  // Add to completed challenges
  const completedChallenge = {
    challengeId,
    completedAt: new Date().toISOString(),
    xp: challenge.xp,
    reward: challenge.reward,
    gameResults: challenge.gameResults
  };
  
  const updatedHistory = {
    streak: newStreak,
    lastCompletedDate: today,
    completedChallenges: [...historyData.completedChallenges, completedChallenge],
    totalXP: historyData.totalXP + challenge.xp
  };
  
  localStorage.setItem('challengeHistory', JSON.stringify(updatedHistory));
  return updatedHistory;
};

// Get challenge statistics
export const getChallengeStats = () => {
  const historyData = JSON.parse(localStorage.getItem('challengeHistory')) || {
    streak: 0,
    lastCompletedDate: null,
    completedChallenges: [],
    totalXP: 0
  };
  
  const today = new Date().toISOString().split('T')[0];
  const challengesKey = `challenges_${today}`;
  const todayChallenges = JSON.parse(localStorage.getItem(challengesKey)) || [];
  
  const todayCompleted = todayChallenges.filter(c => c.completed).length;
  const todayTotal = todayChallenges.length;
  
  return {
    streak: historyData.streak,
    totalXP: historyData.totalXP,
    totalCompleted: historyData.completedChallenges.length,
    todayCompleted,
    todayTotal,
    todayProgress: todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0
  };
};

export default {
  getActiveChallenge,
  clearActiveChallenge,
  checkChallengeCompletion,
  calculateChallengeProgress,
  updateChallengeProgress,
  updateChallengeHistory,
  getChallengeStats
};