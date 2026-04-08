import { gamesAPI, handleApiError } from './api';

// Session management for game sessions
class GameSessionManager {
  constructor() {
    this.currentSession = null;
    this.sessionStartTime = null;
  }

  async startSession(gameId, difficulty) {
    try {
      console.log('Starting game session:', { gameId, difficulty });
      console.log('GameId type:', typeof gameId, 'GameId value:', gameId);
      console.log('Difficulty type:', typeof difficulty, 'Difficulty value:', difficulty);
      
      const response = await gamesAPI.startSession(gameId, difficulty);
      this.currentSession = response.data;
      this.sessionStartTime = Date.now();
      
      console.log('Game session started:', this.currentSession);
      return { data: this.currentSession, error: null };
    } catch (error) {
      console.error('Error starting game session:', error);
      const apiError = handleApiError(error);
      return { data: null, error: apiError };
    }
  }

  async updateSession(updateData) {
    if (!this.currentSession) {
      throw new Error('No active game session');
    }

    try {
      const response = await gamesAPI.updateSession(this.currentSession.id, updateData);
      this.currentSession = { ...this.currentSession, ...response.data };
      return { data: this.currentSession, error: null };
    } catch (error) {
      console.error('Error updating game session:', error);
      const apiError = handleApiError(error);
      return { data: null, error: apiError };
    }
  }

  async completeSession(finalScore, sessionData = null) {
    if (!this.currentSession) {
      throw new Error('No active game session');
    }

    try {
      // Calculate duration if not provided
      const duration = this.sessionStartTime ? 
        Math.floor((Date.now() - this.sessionStartTime) / 1000) : 0;

      // Add duration to session data
      const completionData = {
        ...sessionData,
        duration_seconds: duration,
        completed: true
      };

      const response = await gamesAPI.completeSession(
        this.currentSession.id, 
        finalScore, 
        completionData
      );
      
      const completedSession = response.data;
      
      // Reset session state
      this.currentSession = null;
      this.sessionStartTime = null;
      
      console.log('Game session completed:', completedSession);
      return { data: completedSession, error: null };
    } catch (error) {
      console.error('Error completing game session:', error);
      const apiError = handleApiError(error);
      return { data: null, error: apiError };
    }
  }

  getCurrentSession() {
    return this.currentSession;
  }

  async saveWin(sessionId, winData) {
    try {
      const response = await gamesAPI.saveWin(sessionId, winData);
      console.log('Win saved successfully:', response.data);
      return { data: response.data, error: null };
    } catch (error) {
      console.error('Error saving win:', error);
      const apiError = handleApiError(error);
      return { data: null, error: apiError };
    }
  }

  getSessionDuration() {
    return this.sessionStartTime ? 
      Math.floor((Date.now() - this.sessionStartTime) / 1000) : 0;
  }
}

// Create singleton instance
const sessionManager = new GameSessionManager();

// Fetching games from the API
const getGames = async () => {
  try {
    const response = await gamesAPI.getGames();
    const games = response.data;
    
    if (!games || games.length === 0) {
      console.warn('No games found');
      return { data: [], error: null };
    }
    
    console.log('Games fetched:', games.length);
    return { data: games, error: null };
  } catch (error) {
    console.error('Error in getGames:', error);
    const apiError = handleApiError(error);
    return { data: [], error: apiError };
  }
};

// Get a specific game by ID
const getGameById = async (id) => {
  try {
    const response = await gamesAPI.getGame(id);
    const game = response.data;
    
    if (!game) {
      throw new Error(`Game not found: ${id}`);
    }
    
    return { data: game, error: null };
  } catch (error) {
    console.error('Error in getGameById:', error);
    const apiError = handleApiError(error);
    return { data: null, error: apiError };
  }
};

// Get games by type
const getGamesByType = async (gameType) => {
  try {
    const response = await gamesAPI.getGamesByType(gameType);
    const games = response.data;
    
    return { data: games, error: null };
  } catch (error) {
    console.error('Error in getGamesByType:', error);
    const apiError = handleApiError(error);
    return { data: [], error: apiError };
  }
};

// Submit a game score (legacy compatibility)
const submitScore = async (scoreData) => {
  console.warn('submitScore is deprecated. Use GameSessionManager.completeSession instead.');
  
  try {
    const { gameId, score, duration, difficulty, errors, metadata } = scoreData;
    
    // Start a session and immediately complete it (for backward compatibility)
    const startResult = await sessionManager.startSession(gameId, difficulty || 'medium');
    if (startResult.error) {
      throw new Error(startResult.error.error);
    }
    
    const completeResult = await sessionManager.completeSession(score, {
      duration_seconds: duration || 0,
      errors: errors || 0,
      ...metadata
    });
    
    if (completeResult.error) {
      throw new Error(completeResult.error.error);
    }
    
    return { data: completeResult.data, error: null };
  } catch (error) {
    console.error('Error in submitScore:', error);
    const apiError = handleApiError(error);
    return { data: null, error: apiError };
  }
};

// Get user's game history
const getUserGameHistory = async (limit = 10, gameType = null) => {
  try {
    const response = await gamesAPI.getHistory(limit, gameType);
    const history = response.data;
    
    return { data: history, error: null };
  } catch (error) {
    console.error('Error in getUserGameHistory:', error);
    const apiError = handleApiError(error);
    return { data: [], error: apiError };
  }
};

// Get leaderboard for a game type and difficulty
const getLeaderboard = async (gameType = null, difficulty = null, limit = 10, gameId = null) => {
  try {
    const response = await gamesAPI.getLeaderboard(gameId, difficulty, limit, gameType);
    const leaderboard = response.data;
    
    return { data: leaderboard, error: null };
  } catch (error) {
    console.error('Error in getLeaderboard:', error);
    const apiError = handleApiError(error);
    return { data: [], error: apiError };
  }
};

// Get user statistics
const getUserStats = async (timePeriodDays = 30) => {
  try {
    const response = await gamesAPI.getStats(timePeriodDays);
    const stats = response.data;
    
    return { data: stats, error: null };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    const apiError = handleApiError(error);
    return { data: null, error: apiError };
  }
};

// Export as both individual functions and as gameService object to maintain compatibility
export { 
  getGames, 
  getGameById, 
  getGamesByType,
  submitScore, 
  getUserGameHistory, 
  getUserStats,
  getLeaderboard,
  sessionManager,
  GameSessionManager
};

export const gameService = {
  getGames,
  getGameById,
  getGamesByType,
  submitScore,
  getUserGameHistory,
  getUserStats,
  getLeaderboard,
  sessionManager
};

export default gameService; 