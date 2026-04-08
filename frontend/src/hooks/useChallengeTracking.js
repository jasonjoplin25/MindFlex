/**
 * Custom hook for tracking challenge progress in games
 */
import { useState, useEffect } from 'react';
import challengeTracker from '../utils/challengeTracker';

export const useChallengeTracking = () => {
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [challengeProgress, setChallengeProgress] = useState(0);

  useEffect(() => {
    // Get active challenge on mount
    const challenge = challengeTracker.getActiveChallenge();
    setActiveChallenge(challenge);
  }, []);

  // Update challenge progress based on current game state
  const updateProgress = (gameResults) => {
    if (!activeChallenge) return;

    const progress = challengeTracker.calculateChallengeProgress(activeChallenge, gameResults);
    setChallengeProgress(Math.round(progress));

    // Check if challenge is completed
    const completed = challengeTracker.checkChallengeCompletion(activeChallenge, gameResults);
    
    return { progress: Math.round(progress), completed };
  };

  // Complete the challenge and clean up
  const completeChallenge = (gameResults) => {
    if (!activeChallenge) return false;

    const completed = challengeTracker.checkChallengeCompletion(activeChallenge, gameResults);
    
    if (completed) {
      // Update challenge in localStorage
      challengeTracker.updateChallengeProgress(activeChallenge.id, gameResults);
      
      // Clear active challenge
      challengeTracker.clearActiveChallenge();
      setActiveChallenge(null);
      setChallengeProgress(0);
      
      return true;
    }
    
    return false;
  };

  // Get challenge requirement text for display
  const getChallengeDescription = () => {
    if (!activeChallenge) return null;
    
    return {
      description: activeChallenge.description,
      requirement: activeChallenge.requirement,
      requirementType: activeChallenge.requirementType,
      xp: activeChallenge.xp,
      reward: activeChallenge.reward
    };
  };

  // Clear challenge (e.g., if user quits game)
  const clearChallenge = () => {
    challengeTracker.clearActiveChallenge();
    setActiveChallenge(null);
    setChallengeProgress(0);
  };

  return {
    activeChallenge: activeChallenge !== null,
    challengeInfo: getChallengeDescription(),
    challengeProgress,
    updateProgress,
    completeChallenge,
    clearChallenge
  };
};

export default useChallengeTracking;