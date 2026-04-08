import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Grid,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { gameService, GameSessionManager } from '../../../services/gameService';
import ScoreSubmission from '../ScoreSubmission';
import PatternTile from './PatternTile';
import { useAuth } from '../../../contexts/AuthContext';
import { handleGameCompletion } from '../../../utils/gameNavigation';

// Define colors for each tile
const tileColors = {
  0: { main: '#7C4DFF', light: '#B47CFF' }, // Purple
  1: { main: '#00E5FF', light: '#6EFFFF' }, // Cyan
  2: { main: '#00E676', light: '#69F0AE' }, // Green
  3: { main: '#FF1744', light: '#FF5252' }, // Red
};

const PatternGame = () => {
  const { gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [sessionManager, setSessionManager] = useState(null);
  const [pattern, setPattern] = useState([]);
  const [playerPattern, setPlayerPattern] = useState([]);
  const [isShowingPattern, setIsShowingPattern] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [startTime, setStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTile, setActiveTile] = useState(null);
  const [canPlayerClick, setCanPlayerClick] = useState(false);
  const [errors, setErrors] = useState(0);
  const [maxLevel, setMaxLevel] = useState(20);

  // Initialize game and session manager
  useEffect(() => {
    const fetchGame = async () => {
      try {
        if (!user?.id) {
          console.log('User not yet loaded, waiting...');
          return;
        }

        const { data, error } = await gameService.getGameById(gameId);
        
        if (error) {
          console.error('Error fetching game:', error);
          return;
        }
        
        console.log('Loaded pattern game data:', data);
        
        setGame(data);
        const manager = new GameSessionManager(data.id, user.id);
        setSessionManager(manager);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching game:', error);
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId, user?.id]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (gameStarted) {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, startTime]);

  const getPatternSpeed = useCallback(() => {
    switch (difficulty) {
      case 'easy':
        return 1000;
      case 'medium':
        return 800;
      case 'hard':
        return 600;
      default:
        return 1000;
    }
  }, [difficulty]);

  const generateNextPattern = useCallback(() => {
    const newPattern = [...pattern];
    newPattern.push(Math.floor(Math.random() * 4));
    return newPattern;
  }, [pattern]);

  const showPattern = useCallback(async (patternToShow) => {
    setIsShowingPattern(true);
    setCanPlayerClick(false);
    
    const speed = getPatternSpeed();
    
    for (let i = 0; i < patternToShow.length; i++) {
      setActiveTile(patternToShow[i]);
      await new Promise(resolve => setTimeout(resolve, speed / 2));
      setActiveTile(null);
      await new Promise(resolve => setTimeout(resolve, speed / 2));
    }
    
    setIsShowingPattern(false);
    setCanPlayerClick(true);
  }, [getPatternSpeed]);

  const startNewLevel = useCallback(async () => {
    const newPattern = generateNextPattern();
    setPattern(newPattern);
    setPlayerPattern([]);
    await showPattern(newPattern);
  }, [generateNextPattern, showPattern]);

  const initializeGame = async (selectedDifficulty) => {
    try {
      setDifficulty(selectedDifficulty);
      setPattern([]);
      setPlayerPattern([]);
      setScore(0);
      setLevel(1);
      setErrors(0);
      
      // Set max level based on difficulty
      const difficultySettings = {
        easy: { maxLevel: 10, speed: 1000 },
        medium: { maxLevel: 15, speed: 800 },
        hard: { maxLevel: 20, speed: 600 }
      };
      setMaxLevel(difficultySettings[selectedDifficulty].maxLevel);
      
      // Start game session
      if (sessionManager && game) {
        const session = await sessionManager.startSession(game.id, selectedDifficulty);
        setGameSession(session);
        setStartTime(Date.now());
        setGameStarted(true);
        await startNewLevel();
      }
    } catch (error) {
      console.error('Error starting game session:', error);
    }
  };

  const handleTileClick = async (tileIndex) => {
    if (!canPlayerClick || isShowingPattern) return;

    const newPlayerPattern = [...playerPattern, tileIndex];
    setPlayerPattern(newPlayerPattern);
    setActiveTile(tileIndex);

    // Show tile animation
    await new Promise(resolve => setTimeout(resolve, 200));
    setActiveTile(null);

    const isCorrect = pattern[newPlayerPattern.length - 1] === tileIndex;

    // Update session progress
    if (sessionManager && gameSession?.id) {
      const sessionData = {
        level: level,
        currentPattern: pattern,
        playerInput: tileIndex,
        correctInput: isCorrect
      };
      
      await sessionManager.updateSession(gameSession.id, {
        score: score,
        errors: errors,
        session_data: sessionData
      });
    }

    // Check if the player's pattern matches the game pattern
    if (!isCorrect) {
      // Pattern mismatch
      const newErrors = errors + 1;
      setErrors(newErrors);
      
      if (newErrors >= 3) {
        await completeGame(score);
      } else {
        // Replay the pattern
        await new Promise(resolve => setTimeout(resolve, 500));
        setPlayerPattern([]);
        await showPattern(pattern);
      }
      return;
    }

    // Check if the player completed the pattern
    if (newPlayerPattern.length === pattern.length) {
      // Calculate score based on level and difficulty
      const levelScore = {
        easy: 100,
        medium: 200,
        hard: 300,
      }[difficulty] * level;

      const newScore = score + levelScore;
      setScore(newScore);
      const newLevel = level + 1;
      setLevel(newLevel);

      // Check if max level reached
      if (newLevel > maxLevel) {
        await completeGame(newScore);
        return;
      }

      // Start next level after a short delay
      await new Promise(resolve => setTimeout(resolve, 500));
      await startNewLevel();
    }
  };

  const completeGame = async (finalScore) => {
    try {
      if (sessionManager && gameSession?.id) {
        await sessionManager.completeSession(finalScore, {
          level: level,
          errors: errors,
          difficulty: difficulty,
          patternLength: pattern.length,
          duration: Math.floor(currentTime / 1000),
          completedSuccessfully: level > maxLevel
        });
      }
      setGameStarted(false);
      setShowScoreDialog(true);
    } catch (error) {
      console.error('Error completing game session:', error);
      setShowScoreDialog(true); // Still show dialog even if session update fails
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant={{ xs: 'h5', sm: 'h4' }} gutterBottom align="center" sx={{ mb: 4 }}>
          Pattern Memory Challenge
        </Typography>

        {!gameStarted ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Select Difficulty
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {['easy', 'medium', 'hard'].map((level) => (
                <Button
                  key={level}
                  variant="contained"
                  onClick={() => initializeGame(level)}
                  sx={{
                    minWidth: 120,
                    textTransform: 'capitalize',
                  }}
                >
                  {level}
                </Button>
              ))}
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                gap: { xs: 2, sm: 0 },
                width: '100%',
                maxWidth: 600,
                mb: 2,
              }}
            >
              <Typography variant={{ xs: 'body1', sm: 'h6' }}>
                Score: {score}
              </Typography>
              <Typography variant={{ xs: 'body1', sm: 'h6' }}>
                Level: {level}
              </Typography>
              <Typography variant={{ xs: 'body1', sm: 'h6' }}>
                Time: {Math.floor(currentTime / 1000)}s
              </Typography>
            </Box>

            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 4 },
                width: '100%',
                maxWidth: 600,
                mx: { xs: 1, sm: 0 },
                background: 'rgba(19, 47, 76, 0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {isShowingPattern ? 'Watch the pattern...' : 'Repeat the pattern!'}
                </Typography>

                <Grid container spacing={{ xs: 1, sm: 2 }} maxWidth={{ xs: 300, sm: 400 }}>
                  {[0, 1, 2, 3].map((index) => (
                    <Grid item xs={6} key={index}>
                      <PatternTile
                        index={index}
                        isActive={activeTile === index}
                        onClick={() => handleTileClick(index)}
                        disabled={!canPlayerClick || isShowingPattern}
                        colors={tileColors[index]}
                      />
                    </Grid>
                  ))}
                </Grid>

                <Typography
                  variant="body2"
                  color="error"
                  sx={{ visibility: errors > 0 ? 'visible' : 'hidden' }}
                >
                  Mistakes: {errors}/3
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}

        <ScoreSubmission
          open={showScoreDialog}
          onClose={() => setShowScoreDialog(false)}
          gameData={game}
          scoreData={{
            score: score,
            duration: Math.floor(currentTime / 1000),
            difficulty,
            errors,
            metadata: {
              maxLevel: level - 1,
              patternLength: pattern.length,
              completedSuccessfully: level > maxLevel,
              speed: getPatternSpeed()
            }
          }}
          onSubmitSuccess={() => {
            console.log('Pattern game score submitted successfully');
            setShowScoreDialog(false);
            setGameStarted(false);
            
            // Handle navigation back to training plan or challenges
            const gameResults = {
              score: score,
              duration: Math.floor(currentTime / 1000),
              errors: errors,
              level: level,
              completed: true
            };
            handleGameCompletion(navigate, gameResults);
          }}
        />
      </Box>
    </Container>
  );
};

export default PatternGame; 