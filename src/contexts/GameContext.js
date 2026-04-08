import React, { createContext, useContext, useState, useEffect } from 'react';
import { gameApi } from '../services/apiService';
import { useAuth } from './AuthContext';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentGame, setCurrentGame] = useState(null);
  const [gameState, setGameState] = useState({
    isActive: false,
    score: 0,
    level: 1,
    timeLeft: 0,
    startTime: null,
    endTime: null,
    completed: false
  });

  // Fetch all games
  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await gameApi.getGames();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setGames(response.data || []);
    } catch (err) {
      setError('Failed to load games: ' + err.message);
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch game categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await gameApi.getCategories();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setCategories(response.data || []);
    } catch (err) {
      setError('Failed to load categories: ' + err.message);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a specific game by ID
  const fetchGameById = async (gameId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await gameApi.getGameById(gameId);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setCurrentGame(response.data);
      return response.data;
    } catch (err) {
      setError('Failed to load game: ' + err.message);
      console.error('Error fetching game:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Start a game
  const startGame = () => {
    setGameState({
      isActive: true,
      score: 0,
      level: 1,
      timeLeft: currentGame?.timeLimit || 60,
      startTime: new Date(),
      endTime: null,
      completed: false
    });
  };

  // Update game score
  const updateScore = (points) => {
    setGameState(prev => ({
      ...prev,
      score: prev.score + points
    }));
  };

  // Update game level
  const updateLevel = (newLevel) => {
    setGameState(prev => ({
      ...prev,
      level: newLevel
    }));
  };

  // End a game
  const endGame = async (finalScore) => {
    const endTime = new Date();
    
    setGameState(prev => ({
      ...prev,
      isActive: false,
      completed: true,
      endTime
    }));
    
    // Log the score if user is logged in
    if (user && currentGame) {
      try {
        await gameApi.logScore(currentGame.id, finalScore);
      } catch (err) {
        console.error('Error logging score:', err);
      }
    }
    
    return {
      score: finalScore,
      startTime: gameState.startTime,
      endTime,
      duration: endTime - gameState.startTime,
      gameId: currentGame?.id
    };
  };

  // Reset game state
  const resetGame = () => {
    setGameState({
      isActive: false,
      score: 0,
      level: 1,
      timeLeft: 0,
      startTime: null,
      endTime: null,
      completed: false
    });
  };

  // Get user scores for current game
  const fetchUserScores = async (gameId) => {
    if (!user) return [];
    
    try {
      const response = await gameApi.getUserScores(gameId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    } catch (err) {
      console.error('Error fetching user scores:', err);
      return [];
    }
  };

  const value = {
    games,
    categories,
    loading,
    error,
    currentGame,
    gameState,
    fetchGames,
    fetchCategories,
    fetchGameById,
    startGame,
    updateScore,
    updateLevel,
    endGame,
    resetGame,
    fetchUserScores
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export default GameContext; 