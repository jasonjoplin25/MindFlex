import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent
} from '@mui/material';
import { ArrowBack, PlayArrow, Refresh } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { gameService, GameSessionManager } from '../../../services/gameService';
import ScoreSubmission from '../ScoreSubmission';
import CrosswordGame from './CrosswordGame';
import { useAuth } from '../../../contexts/AuthContext';

const CrosswordGameWrapper = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [sessionManager, setSessionManager] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completionData, setCompletionData] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      console.log('User not yet loaded, waiting...');
      return;
    }
    
    const fetchGame = async () => {
      try {
        const { data, error } = await gameService.getGameById(gameId);
        if (error) {
          setError(error.message);
          return;
        }
        
        setGame(data);
        console.log('Loaded crossword game:', data);
      } catch (err) {
        console.error('Error loading game:', err);
        setError('Failed to load game');
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId, user?.id]);

  const startNewGame = useCallback(async () => {
    if (!user?.id || !game?.id) {
      console.error('Missing user or game data');
      return;
    }

    try {
      const manager = new GameSessionManager();
      const { data: session, error } = await manager.startSession(game.id, difficulty);
      
      if (error) {
        console.error('Failed to start session:', error);
        setError(error.message);
        return;
      }

      setSessionManager(manager);
      setGameSession(session);
      setGameStarted(true);
      setGameCompleted(false);
      setError(null);
      
      console.log('Started Crossword game session:', session);
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Failed to start game session');
    }
  }, [user?.id, game?.id, difficulty]);

  const handleGameComplete = useCallback(async (gameData) => {
    console.log('🎉 handleGameComplete called with:', gameData);
    console.log('📊 Session Manager exists:', !!sessionManager);
    console.log('🎮 Game Session exists:', !!gameSession);
    
    if (!sessionManager || !gameSession) {
      console.error('❌ No active session to complete - sessionManager:', !!sessionManager, 'gameSession:', !!gameSession);
      // Still show completion dialog even without session
      setCompletionData(gameData);
      setGameCompleted(true);
      setShowScoreDialog(true);
      return;
    }

    try {
      console.log('✅ Processing game completion with session...');
      
      const sessionData = {
        difficulty,
        time: gameData.time,
        hintsUsed: gameData.hintsUsed,
        completed: true
      };

      console.log('💾 Saving session with data:', sessionData);
      await sessionManager.completeSession(gameData.score, sessionData);
      
      setCompletionData(gameData);
      setGameCompleted(true);
      setShowScoreDialog(true);
      
      console.log('🎊 Game session completed successfully, showing score dialog');
    } catch (error) {
      console.error('💥 Error completing game session:', error);
      setError('Failed to save game completion');
      // Still show completion dialog even with save error
      setCompletionData(gameData);
      setGameCompleted(true);
      setShowScoreDialog(true);
    }
  }, [sessionManager, gameSession, difficulty]);

  const handleScoreSubmitted = () => {
    setShowScoreDialog(false);
    setGameStarted(false);
    setGameCompleted(false);
    setGameSession(null);
    setSessionManager(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="error" gutterBottom>
              Error
            </Typography>
            <Typography variant="body1" gutterBottom>
              {error}
            </Typography>
            <Button variant="contained" onClick={() => navigate('/games')}>
              Back to Games
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!game) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h6">Game not found</Typography>
        <Button variant="contained" onClick={() => navigate('/games')}>
          Back to Games
        </Button>
      </Container>
    );
  }

  if (!gameStarted) {
    return (
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d1421 0%, #1a2332 50%, #2d3748 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{
            maxWidth: 500,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 245, 255, 0.3)',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h3" sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #00f5ff, #7c4dff)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mb: 2
              }}>
                {game.name}
              </Typography>
              
              <Typography variant="body1" sx={{ color: '#ffffff', mb: 4, lineHeight: 1.6 }}>
                {game.description}
              </Typography>

              <Typography variant="h6" sx={{ color: '#00f5ff', mb: 2 }}>
                Game Instructions
              </Typography>
              <Typography variant="body2" sx={{ color: '#ffffff', mb: 4, lineHeight: 1.5 }}>
                {game.instructions}
              </Typography>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#00f5ff', mb: 2 }}>
                  Keyboard Controls
                </Typography>
                <Box sx={{ textAlign: 'left', color: '#ffffff', fontSize: '14px' }}>
                  <Typography sx={{ mb: 1 }}>• <strong>Click</strong> on cells to select</Typography>
                  <Typography sx={{ mb: 1 }}>• <strong>Type A-Z</strong> to fill letters</Typography>
                  <Typography sx={{ mb: 1 }}>• <strong>Backspace/Delete</strong> to clear</Typography>
                  <Typography sx={{ mb: 1 }}>• <strong>Arrow Keys</strong> to navigate</Typography>
                  <Typography sx={{ mb: 1 }}>• <strong>Tab</strong> to switch direction</Typography>
                </Box>
              </Box>

              <FormControl fullWidth sx={{ mb: 4 }}>
                <InputLabel sx={{ color: '#00f5ff' }}>Difficulty</InputLabel>
                <Select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 245, 255, 0.5)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00f5ff'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00f5ff'
                    }
                  }}
                >
                  <MenuItem value="easy">Easy - 11x11 grid, simple words</MenuItem>
                  <MenuItem value="medium">Medium - 13x13 grid, moderate words</MenuItem>
                  <MenuItem value="hard">Hard - 15x15 grid, complex words</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/games')}
                  startIcon={<ArrowBack />}
                  sx={{
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: '#ffffff'
                    }
                  }}
                >
                  Back
                </Button>
                
                <Button
                  variant="contained"
                  onClick={startNewGame}
                  startIcon={<PlayArrow />}
                  sx={{
                    background: 'linear-gradient(45deg, #00f5ff, #7c4dff)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    px: 4,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #7c4dff, #00f5ff)'
                    }
                  }}
                >
                  Start Game
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box>
      {/* Game Component */}
      <CrosswordGame 
        difficulty={difficulty} 
        onGameComplete={handleGameComplete}
      />

      {/* Back Button Overlay */}
      <Button
        variant="outlined"
        onClick={() => navigate('/games')}
        startIcon={<ArrowBack />}
        sx={{
          position: 'fixed',
          top: 20,
          left: 20,
          zIndex: 1000,
          color: '#00f5ff',
          borderColor: 'rgba(0, 245, 255, 0.5)',
          backgroundColor: 'rgba(13, 20, 33, 0.8)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            backgroundColor: 'rgba(0, 245, 255, 0.2)',
            borderColor: '#00f5ff'
          }
        }}
      >
        Back to Games
      </Button>

      {/* Score Submission Dialog */}
      <Dialog 
        open={showScoreDialog} 
        onClose={() => setShowScoreDialog(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'rgba(13, 20, 33, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 245, 255, 0.3)',
            borderRadius: '20px'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center',
          color: '#00f5ff',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          🧩 Crossword Complete!
        </DialogTitle>
        <DialogContent>
          {completionData && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{ 
                color: '#00f5ff', 
                fontWeight: 'bold',
                mb: 2
              }}>
                Score: {completionData.score}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <Box>
                  <Typography sx={{ color: '#ffffff', fontSize: '16px' }}>
                    Time: {formatTime(completionData.time)}
                  </Typography>
                  <Typography sx={{ color: '#ffffff', fontSize: '16px' }}>
                    Difficulty: {completionData.difficulty.toUpperCase()}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: '#ffffff', fontSize: '16px' }}>
                    Hints Used: {completionData.hintsUsed}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
          
          {completionData && (
            <ScoreSubmission
              open={true}
              onClose={handleScoreSubmitted}
              gameData={{ name: game?.name || 'Crossword' }}
              scoreData={{
                score: completionData.score,
                difficulty: completionData.difficulty,
                duration: completionData.time,
                errors: 0
              }}
              onSubmitSuccess={handleScoreSubmitted}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={() => {
              setShowScoreDialog(false);
              startNewGame();
            }}
            variant="outlined"
            startIcon={<Refresh />}
            sx={{
              color: '#00f5ff',
              borderColor: 'rgba(0, 245, 255, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0, 245, 255, 0.2)',
                borderColor: '#00f5ff'
              }
            }}
          >
            Play Again
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CrosswordGameWrapper;