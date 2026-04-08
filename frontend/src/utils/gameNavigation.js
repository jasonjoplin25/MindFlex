/**
 * Game Navigation Utility
 * Handles navigation flow between training plan/challenges and games
 */

// Store navigation context when starting a game
export const setGameContext = (context) => {
  sessionStorage.setItem('gameContext', JSON.stringify({
    ...context,
    timestamp: Date.now()
  }));
};

// Get stored navigation context
export const getGameContext = () => {
  const stored = sessionStorage.getItem('gameContext');
  if (!stored) return null;
  
  try {
    const context = JSON.parse(stored);
    // Check if context is recent (within 1 hour)
    if (Date.now() - context.timestamp > 3600000) {
      clearGameContext();
      return null;
    }
    return context;
  } catch {
    clearGameContext();
    return null;
  }
};

// Clear navigation context
export const clearGameContext = () => {
  sessionStorage.removeItem('gameContext');
};

// Handle game completion and navigation back
export const handleGameCompletion = (navigate, gameResults) => {
  const context = getGameContext();
  
  if (context) {
    const { source, exerciseData, challengeData } = context;
    
    // Store completion data
    const completionData = {
      ...gameResults,
      completedAt: new Date().toISOString(),
      source
    };
    
    if (source === 'training-plan' && exerciseData) {
      // Store exercise completion
      sessionStorage.setItem('exerciseCompletion', JSON.stringify({
        exercise: exerciseData,
        results: completionData,
        timestamp: Date.now()
      }));
      
      // Navigate back to patient journey/training plan
      navigate('/patient-journey', { 
        state: { 
          completedExercise: exerciseData,
          gameResults: completionData 
        }
      });
    } else if (source === 'daily-challenges' && challengeData) {
      // Store challenge completion
      sessionStorage.setItem('challengeCompletion', JSON.stringify({
        challenge: challengeData,
        results: completionData,
        timestamp: Date.now()
      }));
      
      // Navigate back to patient journey with challenge completion
      navigate('/patient-journey', { 
        state: { 
          completedChallenge: challengeData,
          gameResults: completionData 
        }
      });
    } else {
      // Default navigation to dashboard
      navigate('/dashboard');
    }
    
    // Clear context after navigation
    clearGameContext();
  } else {
    // No context, navigate to dashboard
    navigate('/dashboard');
  }
};

// Check for completion data on training plan page
export const checkForCompletion = () => {
  const exerciseCompletion = sessionStorage.getItem('exerciseCompletion');
  const challengeCompletion = sessionStorage.getItem('challengeCompletion');
  
  let completion = null;
  
  if (exerciseCompletion) {
    try {
      const data = JSON.parse(exerciseCompletion);
      // Check if completion is recent (within 5 minutes)
      if (Date.now() - data.timestamp < 300000) {
        completion = { type: 'exercise', data };
      }
      sessionStorage.removeItem('exerciseCompletion');
    } catch {
      sessionStorage.removeItem('exerciseCompletion');
    }
  }
  
  if (challengeCompletion) {
    try {
      const data = JSON.parse(challengeCompletion);
      // Check if completion is recent (within 5 minutes)
      if (Date.now() - data.timestamp < 300000) {
        completion = { type: 'challenge', data };
      }
      sessionStorage.removeItem('challengeCompletion');
    } catch {
      sessionStorage.removeItem('challengeCompletion');
    }
  }
  
  return completion;
};

export default {
  setGameContext,
  getGameContext,
  clearGameContext,
  handleGameCompletion,
  checkForCompletion
};