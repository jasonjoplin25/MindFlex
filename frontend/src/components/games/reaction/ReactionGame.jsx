import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Paper,
  LinearProgress,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { gameService, GameSessionManager } from '../../../services/gameService';
import ScoreSubmission from '../ScoreSubmission';
import { useAuth } from '../../../contexts/AuthContext';
import useChallengeTracking from '../../../hooks/useChallengeTracking';
import { handleGameCompletion } from '../../../utils/gameNavigation';

const ReactionGame = () => {
  const { gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeChallenge, challengeInfo, challengeProgress, updateProgress, completeChallenge } = useChallengeTracking();
  const [game, setGame] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [sessionManager, setSessionManager] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [score, setScore] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [targetVisible, setTargetVisible] = useState(false);
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
  const [targetSize, setTargetSize] = useState(60);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [waitingForClick, setWaitingForClick] = useState(false);
  const [earlyClicks, setEarlyClicks] = useState(0);
  const [bestTime, setBestTime] = useState(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [totalRounds, setTotalRounds] = useState(10);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const appearanceTimeRef = useRef(null);

  // Initialize game and session manager
  useEffect(() => {
    if (!user?.id) {
      console.log('User not yet loaded, waiting...');
      return;
    }
    
    const fetchGame = async () => {
      try {
        const { data, error } = await gameService.getGameById(gameId);
        
        if (error) {
          console.error('Error fetching game:', error);
          return;
        }
        
        console.log('Loaded reaction game data:', data);
        
        setGame(data);
        const manager = new GameSessionManager();
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

  const getRandomDelay = useCallback(() => {
    const delays = {
      easy: [1500, 3000],
      medium: [1000, 2500],
      hard: [500, 2000],
    };
    const [min, max] = delays[difficulty];
    return Math.random() * (max - min) + min;
  }, [difficulty]);

  const getRandomPosition = useCallback(() => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const padding = targetSize;
    
    return {
      x: Math.random() * (rect.width - 2 * padding) + padding,
      y: Math.random() * (rect.height - 2 * padding) + padding,
    };
  }, [targetSize]);

  const startNewRound = useCallback(() => {
    setTargetVisible(false);
    setWaitingForClick(true);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set random delay before target appears
    timeoutRef.current = setTimeout(() => {
      setTargetPosition(getRandomPosition());
      setTargetVisible(true);
      appearanceTimeRef.current = Date.now();
    }, getRandomDelay());
  }, [getRandomDelay, getRandomPosition]);

  const handleContainerClick = async () => {
    if (!gameStarted || !waitingForClick) return;

    if (!targetVisible) {
      // Clicked too early
      const newEarlyClicks = earlyClicks + 1;
      setEarlyClicks(newEarlyClicks);
      
      // Update session with early click
      if (sessionManager && gameSession && startTime) {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        await sessionManager.updateSession({
          score: score,
          duration_seconds: duration,
          errors: newEarlyClicks,
          session_data: {
            rounds_completed: roundsCompleted,
            early_clicks: newEarlyClicks,
            click_type: 'early'
          }
        });
      }
      
      if (newEarlyClicks >= 3) {
        await completeGame(score);
        return;
      }
      
      startNewRound();
      return;
    }

    const reactionTime = Date.now() - appearanceTimeRef.current;
    const newReactionTimes = [...reactionTimes, reactionTime];
    setReactionTimes(newReactionTimes);
    
    // Update best time
    const newBestTime = bestTime === null || reactionTime < bestTime ? reactionTime : bestTime;
    setBestTime(newBestTime);

    // Calculate score based on reaction time and difficulty multiplier
    // Better scoring system: faster reactions get more points
    // Under 300ms: 100 points, 300-600ms: 50-99 points, 600ms-2s: 10-49 points, over 2s: 5 points
    let baseScore;
    if (reactionTime < 300) {
      baseScore = 100;
    } else if (reactionTime < 600) {
      baseScore = Math.round(100 - ((reactionTime - 300) / 300) * 50); // 50-100 points
    } else if (reactionTime < 2000) {
      baseScore = Math.round(50 - ((reactionTime - 600) / 1400) * 40); // 10-50 points
    } else {
      baseScore = 5; // Minimum points for completing the round
    }
    
    const difficultyMultiplier = {
      easy: 1,
      medium: 1.5,
      hard: 2,
    }[difficulty];
    
    const newScore = score + Math.round(baseScore * difficultyMultiplier);
    const newRoundsCompleted = roundsCompleted + 1;
    
    setScore(newScore);
    setRoundsCompleted(newRoundsCompleted);

    // Update session progress
    if (sessionManager && gameSession && startTime) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      await sessionManager.updateSession({
        score: newScore,
        duration_seconds: duration,
        errors: earlyClicks,
        session_data: {
          rounds_completed: newRoundsCompleted,
          early_clicks: earlyClicks,
          reaction_time: reactionTime,
          best_time: newBestTime,
          click_type: 'success'
        }
      });
    }

    // Update challenge progress if there's an active challenge
    if (activeChallenge) {
      const gameResults = {
        score: newScore,
        duration: Math.floor((Date.now() - startTime) / 1000),
        errors: earlyClicks,
        streak: 0, // Reaction game doesn't have streaks
        bestTime: newBestTime
      };
      updateProgress(gameResults);
    }

    if (newRoundsCompleted >= totalRounds) {
      await completeGame(newScore);
    } else {
      startNewRound();
    }
  };

  const startCountdown = async () => {
    setShowCountdown(true);
    setCountdown(3);
    
    for (let i = 2; i >= 1; i--) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCountdown(i);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowCountdown(false);
    initializeGame();
  };

  const initializeGame = async () => {
    try {
      setScore(0);
      setRoundsCompleted(0);
      setReactionTimes([]);
      setEarlyClicks(0);
      setBestTime(null);
      setWaitingForClick(true);
      
      // Start game session
      if (sessionManager) {
        const session = await sessionManager.startSession(game.id, difficulty);
        setGameSession(session.data);
        setStartTime(Date.now());
        setGameStarted(true);
        startNewRound();
      }
    } catch (error) {
      console.error('Error starting game session:', error);
    }
  };

  const handleDifficultySelect = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    
    // Set difficulty parameters
    const difficultySettings = {
      easy: { targetSize: 60, totalRounds: 8 },
      medium: { targetSize: 45, totalRounds: 10 },
      hard: { targetSize: 30, totalRounds: 12 }
    };
    
    const settings = difficultySettings[selectedDifficulty];
    setTargetSize(settings.targetSize);
    setTotalRounds(settings.totalRounds);
    
    startCountdown();
  };

  const completeGame = async (finalScore) => {
    try {
      if (sessionManager && gameSession) {
        await sessionManager.completeSession(finalScore, {
          rounds_completed: roundsCompleted,
          early_clicks: earlyClicks,
          difficulty: difficulty,
          best_time: bestTime,
          average_reaction_time: reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 0,
          duration: Math.floor(currentTime / 1000)
        });
      }

      // Complete challenge if active
      if (activeChallenge) {
        const gameResults = {
          score: finalScore,
          duration: Math.floor(currentTime / 1000),
          errors: earlyClicks,
          streak: 0,
          bestTime: bestTime
        };
        
        const challengeCompleted = completeChallenge(gameResults);
        if (challengeCompleted) {
          console.log('Challenge completed!', challengeInfo);
        }
      }

      setGameStarted(false);
      setShowScoreDialog(true);
    } catch (error) {
      console.error('Error completing game session:', error);
      setShowScoreDialog(true); // Still show dialog even if session update fails
    }
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
        <Typography 
          variant="h4" 
          gutterBottom 
          align="center" 
          sx={{ 
            mb: 4,
            fontSize: { xs: '1.5rem', sm: '2.125rem' }
          }}
        >
          Reaction Speed Challenge
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
            {!showCountdown ? (
              <>
                <Typography variant="h6" gutterBottom>
                  Select Difficulty
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {['easy', 'medium', 'hard'].map((level) => (
                    <Button
                      key={level}
                      variant="contained"
                      onClick={() => handleDifficultySelect(level)}
                      sx={{
                        minWidth: 120,
                        textTransform: 'capitalize',
                      }}
                    >
                      {level}
                    </Button>
                  ))}
                </Box>
              </>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Typography variant="h1" sx={{ fontSize: '6rem', fontWeight: 'bold' }}>
                  {countdown}
                </Typography>
              </motion.div>
            )}
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
              <Typography 
                variant="h6" 
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Score: {score}
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Rounds: {roundsCompleted}/{totalRounds}
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                Best: {bestTime ? `${bestTime}ms` : '-'}
              </Typography>
            </Box>

            {/* Challenge Progress */}
            {activeChallenge && challengeInfo && (
              <Paper
                sx={{
                  p: 2,
                  mb: 3,
                  background: 'rgba(0, 230, 118, 0.1)',
                  border: '1px solid rgba(0, 230, 118, 0.3)',
                  borderRadius: 2,
                  width: '100%',
                  maxWidth: 600,
                }}
              >
                <Typography variant="h6" sx={{ color: 'success.main', mb: 1 }}>
                  🎯 Challenge Active
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {challengeInfo.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={challengeProgress}
                    sx={{
                      flexGrow: 1,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0, 230, 118, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'success.main',
                        borderRadius: 4,
                      },
                    }}
                  />
                  <Typography variant="body2" sx={{ color: 'success.main' }}>
                    {challengeProgress}%
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'success.main' }}>
                  +{challengeInfo.xp} XP • {challengeInfo.reward}
                </Typography>
              </Paper>
            )}

            <Paper
              ref={containerRef}
              onClick={handleContainerClick}
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: 600,
                height: { xs: 300, sm: 400 },
                mx: { xs: 1, sm: 0 },
                background: 'rgba(19, 47, 76, 0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                overflow: 'hidden',
                // Touch-friendly
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
              }}
            >
              <AnimatePresence>
                {targetVisible && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    style={{
                      position: 'absolute',
                      left: targetPosition.x - targetSize / 2,
                      top: targetPosition.y - targetSize / 2,
                      width: Math.max(targetSize, 40), // Ensure minimum touch target
                      height: Math.max(targetSize, 40),
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00E676 0%, #00E5FF 100%)',
                      boxShadow: '0 0 20px rgba(0, 230, 118, 0.5)',
                    }}
                  />
                )}
              </AnimatePresence>

              <Typography
                variant="h6"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  opacity: targetVisible ? 0 : 0.7,
                  transition: 'opacity 0.3s ease',
                  textAlign: 'center',
                  px: 2,
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                {waitingForClick ? 'Wait for the target...' : 'Click to start'}
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography
                variant="body2"
                color="error"
                sx={{ visibility: earlyClicks > 0 ? 'visible' : 'hidden' }}
              >
                Early clicks: {earlyClicks}/3
              </Typography>
              {reactionTimes.length > 0 && (
                <Typography variant="body2" color="secondary">
                  Last: {reactionTimes[reactionTimes.length - 1]}ms
                </Typography>
              )}
            </Box>
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
            errors: earlyClicks,
            metadata: {
              bestTime: bestTime,
              averageReactionTime: reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 0,
              roundsCompleted: roundsCompleted,
              targetSize: targetSize,
              reactionTimes: reactionTimes.slice(0, 5) // Only store first 5 times
            }
          }}
          onSubmitSuccess={() => {
            console.log('Reaction game score submitted successfully');
            setShowScoreDialog(false);
            setGameStarted(false);
            
            // Handle navigation back to training plan or challenges
            const gameResults = {
              score: score,
              duration: Math.floor(currentTime / 1000),
              errors: earlyClicks,
              bestTime: bestTime,
              completed: true
            };
            handleGameCompletion(navigate, gameResults);
          }}
        />
      </Box>
    </Container>
  );
};

export default ReactionGame; 