/**
 * Exercise to Game Mapping Utility
 * Maps training plan exercises to actual game components and navigates to them
 */

import { useNavigate } from 'react-router-dom';
import { setGameContext } from './gameNavigation';

// Define mapping between exercise names and actual games available
// Based on the 6 games: Math Challenge, Memory Match, Pattern Recognition, Reaction Time, Snake Game, Word Scramble
export const EXERCISE_GAME_MAPPING = {
  // Memory exercises using Memory Match and Word Scramble
  'Memory Training': {
    gameNamePref: 'Memory Match',
    description: 'Match pairs of cards to test your memory',
    avgDuration: 5,
    cognitiveArea: 'memory'
  },
  'Word Memory': {
    gameNamePref: 'Word Scramble', 
    description: 'Unscramble words to test your vocabulary and memory',
    avgDuration: 5,
    cognitiveArea: 'memory'
  },

  // Attention exercises using Reaction Time and Pattern Recognition
  'Focus Training': {
    gameNamePref: 'Reaction Time',
    description: 'Test and improve your reaction time and focus',
    avgDuration: 5,
    cognitiveArea: 'attention'
  },
  'Pattern Focus': {
    gameNamePref: 'Pattern Recognition',
    description: 'Identify patterns to enhance cognitive abilities and attention',
    avgDuration: 5,
    cognitiveArea: 'attention'
  },

  // Processing Speed exercises using Reaction Time and Snake Game
  'Quick Response': {
    gameNamePref: 'Reaction Time',
    description: 'Improve processing speed with quick reaction challenges',
    avgDuration: 5,
    cognitiveArea: 'processing_speed'
  },
  'Reflex Training': {
    gameNamePref: 'Snake Game',
    description: 'Test your reflexes and planning skills with the classic snake game',
    avgDuration: 5,
    cognitiveArea: 'processing_speed'
  },

  // Executive Function exercises using Math Challenge and Pattern Recognition
  'Problem Solving': {
    gameNamePref: 'Math Challenge',
    description: 'Solve math problems to improve cognitive function',
    avgDuration: 5,
    cognitiveArea: 'reasoning'
  },
  'Logical Thinking': {
    gameNamePref: 'Pattern Recognition',
    description: 'Enhance logical thinking through pattern identification',
    avgDuration: 5,
    cognitiveArea: 'reasoning'
  },
};

// Get all available exercises for a domain
export const getExercisesByDomain = (domain) => {
  return Object.entries(EXERCISE_GAME_MAPPING)
    .filter(([_, exercise]) => {
      return exercise.cognitiveArea === domain;
    })
    .map(([name, exercise]) => ({ name, ...exercise }));
};

// Get exercise by name
export const getExerciseByName = (exerciseName) => {
  return EXERCISE_GAME_MAPPING[exerciseName];
};

// Resolve actual game ID from API games list
export const resolveGameId = (games, exerciseName) => {
  const exercise = getExerciseByName(exerciseName);
  if (!exercise || !games || !Array.isArray(games)) return null;
  
  // Find by exact name match
  let game = games.find(g => g.name === exercise.gameNamePref);
  
  return game?.id || null;
};

// Navigate to exercise/game with resolved game ID
export const navigateToExercise = async (navigate, exerciseName, difficulty = 'medium', games = null, context = null) => {
  const exercise = getExerciseByName(exerciseName);
  if (!exercise) {
    console.error('Exercise not found:', exerciseName);
    return;
  }
  
  console.log('Navigating to exercise:', exerciseName, 'with games:', games);
  
  // Set navigation context if provided
  if (context) {
    setGameContext({
      source: context.source || 'training-plan',
      exerciseData: context.exerciseData || { name: exerciseName, difficulty },
      challengeData: context.challengeData,
      returnPath: context.returnPath || '/patient-journey'
    });
  }
  
  // If we have games list, try to get real game ID
  if (games && Array.isArray(games)) {
    const gameId = resolveGameId(games, exerciseName);
    console.log('Resolved game ID:', gameId);
    if (gameId) {
      // Navigate directly to the games page with the specific game
      const navigationPath = `/games/${gameId}?difficulty=${difficulty}`;
      console.log('Navigating to:', navigationPath);
      navigate(navigationPath);
      return;
    }
  }
  
  // Fallback to games page
  navigate('/games');
};

// Check if exercise exists
export const exerciseExists = (exerciseName) => {
  return exerciseName in EXERCISE_GAME_MAPPING;
};

// Hook for navigation
export const useExerciseNavigation = () => {
  const navigate = useNavigate();
  
  return {
    navigateToExercise: (exerciseName, difficulty = 'medium', games = null, context = null) => 
      navigateToExercise(navigate, exerciseName, difficulty, games, context),
    getExercise: getExerciseByName,
    exerciseExists,
    getExercisesByDomain,
    resolveGameId
  };
};

// Generate exercises for training plan based on domain
export const generateExercisesForDomain = (domain, count = 3) => {
  const exercises = getExercisesByDomain(domain);
  
  // Shuffle and select random exercises
  const shuffled = exercises.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, exercises.length));
};

export default EXERCISE_GAME_MAPPING;