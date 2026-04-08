import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
import { gameService } from '../../../services/gameService';
import ScoreSubmission from '../ScoreSubmission';
import SequenceTile from './SequenceTile';
import { useAuth } from '../../../contexts/AuthContext';

// Define symbols and colors for tiles
const tiles = [
  { symbol: '1', color: '#7C4DFF', light: '#B47CFF' },
  { symbol: '2', color: '#00E5FF', light: '#6EFFFF' },
  { symbol: '3', color: '#00E676', light: '#69F0AE' },
  { symbol: '4', color: '#FF1744', light: '#FF5252' },
  { symbol: '5', color: '#FFC400', light: '#FFE57F' },
  { symbol: '6', color: '#FF4081', light: '#FF80AB' },
];

const SequenceGame = () => {
  const { gameId } = useParams();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [startTime, setStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTile, setActiveTile] = useState(null);
  const [errors, setErrors] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Initialize game
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const gameData = await gameService.getGameById(gameId);
        setGame(gameData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching game:', error);
      }
    };
    fetchGame();
  }, [gameId]);

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

  const getSequenceSpeed = useCallback(() => {
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

  const getVisibleTiles = useCallback(() => {
    switch (difficulty) {
      case 'easy':
        return 4;
      case 'medium':
        return 5;
      case 'hard':
        return 6;
      default:
        return 4;
    }
  }, [difficulty]);

  const generateNextSequence = useCallback(() => {
    const visibleTiles = getVisibleTiles();
    const newSequence = [...sequence];
    newSequence.push(Math.floor(Math.random() * visibleTiles));
    return newSequence;
  }, [sequence, getVisibleTiles]);

  const showSequence = useCallback(async (sequenceToShow) => {
    setIsShowingSequence(true);
    const speed = getSequenceSpeed();
    
    for (let i = 0; i < sequenceToShow.length; i++) {
      setActiveTile(sequenceToShow[i]);
      await new Promise(resolve => setTimeout(resolve, speed / 2));
      setActiveTile(null);
      await new Promise(resolve => setTimeout(resolve, speed / 2));
    }
    
    setIsShowingSequence(false);
  }, [getSequenceSpeed]);

  const startNewLevel = useCallback(async () => {
    const newSequence = generateNextSequence();
    setSequence(newSequence);
    setPlayerSequence([]);
    await showSequence(newSequence);
  }, [generateNextSequence, showSequence]);

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
    setDifficulty(difficulty);
    setSequence([]);
    setPlayerSequence([]);
    setScore(0);
    setLevel(1);
    setErrors(0);
    setStartTime(Date.now());
    setGameStarted(true);
    await startNewLevel();
  };

  const handleTileClick = async (tileIndex) => {
    if (isShowingSequence) return;

    const newPlayerSequence = [...playerSequence, tileIndex];
    setPlayerSequence(newPlayerSequence);
    setActiveTile(tileIndex);

    // Show tile animation
    await new Promise(resolve => setTimeout(resolve, 200));
    setActiveTile(null);

    // Check if the player's sequence matches the game sequence
    if (sequence[newPlayerSequence.length - 1] !== tileIndex) {
      // Sequence mismatch
      setErrors(errors + 1);
      if (errors + 1 >= 3) {
        setGameStarted(false);
        setShowScoreDialog(true);
      } else {
        // Replay the sequence
        await new Promise(resolve => setTimeout(resolve, 500));
        setPlayerSequence([]);
        await showSequence(sequence);
      }
      return;
    }

    // Check if the player completed the sequence
    if (newPlayerSequence.length === sequence.length) {
      // Calculate score based on level and difficulty
      const levelScore = {
        easy: 100,
        medium: 200,
        hard: 300,
      }[difficulty] * level;

      setScore(score + levelScore);
      setLevel(level + 1);

      // Start next level after a short delay
      await new Promise(resolve => setTimeout(resolve, 500));
      await startNewLevel();
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
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          Sequence Memory Challenge
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
                      onClick={() => {
                        setDifficulty(level);
                        startCountdown();
                      }}
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
                width: '100%',
                maxWidth: 600,
                mb: 2,
              }}
            >
              <Typography variant="h6">
                Score: {score}
              </Typography>
              <Typography variant="h6">
                Level: {level}
              </Typography>
              <Typography variant="h6">
                Time: {Math.floor(currentTime / 1000)}s
              </Typography>
            </Box>

            <Paper
              elevation={3}
              sx={{
                p: 4,
                width: '100%',
                maxWidth: 600,
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
                  {isShowingSequence ? 'Watch the sequence...' : 'Repeat the sequence!'}
                </Typography>

                <Grid container spacing={2} maxWidth={400}>
                  {tiles.slice(0, getVisibleTiles()).map((tile, index) => (
                    <Grid item xs={6} sm={4} key={index}>
                      <SequenceTile
                        tile={tile}
                        isActive={activeTile === index}
                        onClick={() => handleTileClick(index)}
                        disabled={isShowingSequence}
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
            level,
          }}
          onSubmitSuccess={() => {
            setShowScoreDialog(false);
            setGameStarted(false);
          }}
        />
      </Box>
    </Container>
  );
};

export default SequenceGame; 