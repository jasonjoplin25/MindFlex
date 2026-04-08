import { achievementsAPI, handleApiError } from './api';

// Get all achievement definitions from API
export const getAchievements = async () => {
  try {
    const response = await achievementsAPI.getAchievements();
    return { data: response.data, error: null };
  } catch (error) {
    console.error('Error fetching achievements:', error);
    const apiError = handleApiError(error);
    return { data: [], error: apiError };
  }
};

// Get user's earned achievements
export const getUserAchievements = async () => {
  try {
    const response = await achievementsAPI.getUserAchievements();
    return { data: response.data, error: null };
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    const apiError = handleApiError(error);
    return { data: [], error: apiError };
  }
};

// Get user achievement statistics
export const getUserAchievementStats = async () => {
  try {
    const response = await achievementsAPI.getUserAchievementStats();
    return { data: response.data, error: null };
  } catch (error) {
    console.error('Error fetching user achievement stats:', error);
    const apiError = handleApiError(error);
    return { data: null, error: apiError };
  }
};

// Get achievement leaderboard
export const getAchievementLeaderboard = async () => {
  try {
    const response = await achievementsAPI.getLeaderboard();
    return { data: response.data, error: null };
  } catch (error) {
    console.error('Error fetching achievement leaderboard:', error);
    const apiError = handleApiError(error);
    return { data: [], error: apiError };
  }
};

// Legacy compatibility functions (achievements are now handled server-side)
export const checkAchievements = async () => {
  console.warn('checkAchievements is deprecated. Achievements are now automatically awarded by the server.');
  return [];
};

export const awardAchievement = async () => {
  console.warn('awardAchievement is deprecated. Achievements are now automatically awarded by the server.');
  return { data: null, error: null };
};

// Get user progress towards achievements (using game stats)
export const getUserProgress = async () => {
  try {
    // Get user stats from games API for progress calculation
    const { gamesAPI } = await import('./api');
    const response = await gamesAPI.getStats();
    return { data: response.data, error: null };
  } catch (error) {
    console.error('Error fetching user progress:', error);
    const apiError = handleApiError(error);
    return { data: null, error: apiError };
  }
};

const achievementService = {
  getAchievements,
  getUserAchievements,
  getUserAchievementStats,
  getAchievementLeaderboard,
  getUserProgress,
  awardAchievement,
  checkAchievements,
};

export default achievementService; 