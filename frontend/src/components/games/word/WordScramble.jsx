import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Refresh as RefreshIcon, Lightbulb as HintIcon } from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import { gameService, GameSessionManager } from '../../../services/gameService';
import ScoreSubmission from '../ScoreSubmission';
import LetterTile from './LetterTile';
import { useAuth } from '../../../contexts/AuthContext';

// Word lists by difficulty
const wordLists = {
  easy: ['REACT', 'BRAIN', 'LEARN', 'FOCUS', 'THINK', 'SOLVE', 'MIND', 'PLAY'],
  medium: ['MEMORY', 'PUZZLE', 'CODING', 'MENTAL', 'GROWTH', 'WISDOM', 'NEURAL'],
  hard: ['COGNITION', 'CHALLENGE', 'INTELLECT', 'KNOWLEDGE', 'MINDFULNESS', 'PSYCHOLOGY'],
};

const WordScramble = () => {
  const { gameId } = useParams();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [sessionManager, setSessionManager] = useState(null);
  const [currentWord, setCurrentWord] = useState('');
  const [scrambledWord, setScrambledWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [difficulty, setDifficulty] = useState('easy');
  const [gameStarted, setGameStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState(0);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [showHint, setShowHint] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Initialize game
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
        
        console.log('Loaded word scramble game data:', data); // Debug log
        
        // Set the game data directly, not the wrapper object
        setGame(data);
        const manager = new GameSessionManager();
        setSessionManager(manager);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching game:', error);
      }
    };
    fetchGame();
  }, [gameId, user]);

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

  const scrambleWord = (word) => {
    let scrambled = word.split('');
    for (let i = scrambled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
    }
    return scrambled.join('');
  };

  const getNewWord = useCallback(() => {
    const words = wordLists[difficulty];
    const word = words[Math.floor(Math.random() * words.length)];
    let scrambled;
    do {
      scrambled = scrambleWord(word);
    } while (scrambled === word);
    
    setCurrentWord(word);
    setScrambledWord(scrambled);
    setUserInput('');
    setShowHint(false);
  }, [difficulty]);

  const initializeGame = async (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
    setScore(0);
    setWordsCompleted(0);
    setErrors(0);
    setHintsRemaining(3);
    setStartTime(Date.now());
    
    // Start game session
    if (sessionManager && game) {
      try {
        const session = await sessionManager.startSession(game.id, selectedDifficulty);
        setGameSession(session.data);
      } catch (error) {
        console.error('Failed to start game session:', error);
      }
    }
    
    setGameStarted(true);
    getNewWord();
  };

  const handleSubmit = async () => {
    const trimmedInput = userInput.trim().toUpperCase();
    
    // Validate input contains only letters from scrambled word
    const scrambledLetters = scrambledWord.toLowerCase().split('').sort().join('');
    const inputLetters = trimmedInput.toLowerCase().split('').sort().join('');
    
    if (inputLetters !== scrambledLetters) {
      setErrors(errors + 1);
      // Give feedback about invalid letters
      setFeedbackMessage('You can only use the letters from the scrambled word!');
      setTimeout(() => setFeedbackMessage(''), 3000);
      return;
    }

    if (trimmedInput === currentWord) {
      // Calculate word score based on difficulty and time taken
      const wordScore = {
        easy: 100,
        medium: 200,
        hard: 300,
      }[difficulty];

      const newScore = score + wordScore;
      const newWordsCompleted = wordsCompleted + 1;
      
      setScore(newScore);
      setWordsCompleted(newWordsCompleted);

      // Update session progress
      if (sessionManager && gameSession && startTime) {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        await sessionManager.updateSession({
          score: newScore,
          duration_seconds: duration,
          errors: errors,
          session_data: {
            words_completed: newWordsCompleted,
            current_word: currentWord,
            hints_used: 3 - hintsRemaining,
            difficulty: difficulty
          }
        });
      }

      // Clear input and show success feedback
      setUserInput('');
      setFeedbackMessage('Correct! Great job!');
      setTimeout(() => setFeedbackMessage(''), 2000);

      if (newWordsCompleted >= 10) {
        // Game complete
        await completeGame(newScore);
      } else {
        getNewWord();
      }
    } else {
      const newErrors = errors + 1;
      setErrors(newErrors);
      
      // Update session with error
      if (sessionManager && gameSession && startTime) {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        await sessionManager.updateSession({
          score: score,
          duration_seconds: duration,
          errors: newErrors,
          session_data: {
            words_completed: wordsCompleted,
            current_word: currentWord,
            hints_used: 3 - hintsRemaining,
            difficulty: difficulty,
            last_attempt: trimmedInput
          }
        });
      }
      
      // Give feedback about wrong answer  
      setFeedbackMessage(`Wrong answer! "${trimmedInput}" is not correct. Try again!`);
      setTimeout(() => setFeedbackMessage(''), 3000);
    }
  };

  const useHint = () => {
    if (hintsRemaining > 0) {
      setHintsRemaining(hintsRemaining - 1);
      setShowHint(true);
    }
  };

  const completeGame = async (finalScore) => {
    try {
      if (sessionManager && gameSession) {
        await sessionManager.completeSession(finalScore, {
          words_completed: 10,
          errors: errors,
          difficulty: difficulty,
          hints_used: 3 - hintsRemaining,
          duration: Math.floor((Date.now() - startTime) / 1000)
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
        <Typography 
          variant="h4" 
          gutterBottom 
          align="center" 
          sx={{ 
            mb: 4,
            fontSize: { xs: '1.5rem', sm: '2.125rem' }
          }}
        >
          Word Scramble Challenge
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
                Words: {wordsCompleted}/10
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
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
                <Typography 
                  variant="h5" 
                  gutterBottom
                  sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                >
                  Unscramble the word:
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {scrambledWord.split('').map((letter, index) => (
                      <LetterTile
                        key={`${letter}-${index}`}
                        letter={letter}
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                </Box>

                <Box sx={{ width: '100%', maxWidth: 400 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                    placeholder="Type your answer"
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!userInput}
                  >
                    Submit
                  </Button>
                  <IconButton onClick={getNewWord} color="primary">
                    <RefreshIcon />
                  </IconButton>
                  <Tooltip title={hintsRemaining > 0 ? `Hints remaining: ${hintsRemaining}` : 'No hints remaining'}>
                    <span>
                      <IconButton
                        onClick={useHint}
                        color="secondary"
                        disabled={hintsRemaining === 0}
                      >
                        <HintIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>

                {showHint && (
                  <Typography
                    variant="body2"
                    color="secondary"
                    sx={{ mt: 2 }}
                  >
                    Hint: The word starts with "{currentWord[0]}"
                  </Typography>
                )}

                {feedbackMessage && (
                  <Typography
                    variant="body2"
                    color={feedbackMessage.includes('Correct') ? 'success.main' : 'error.main'}
                    sx={{ mt: 2, fontWeight: 'bold' }}
                  >
                    {feedbackMessage}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={`Errors: ${errors}`}
                    color={errors > 5 ? 'error' : 'default'}
                  />
                  <Chip
                    label={`Hints: ${hintsRemaining}`}
                    color="secondary"
                  />
                </Box>
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
          }}
          onSubmitSuccess={() => {
            console.log('Word Scramble score submitted successfully');
            setShowScoreDialog(false);
            setGameStarted(false);
          }}
        />
      </Box>
    </Container>
  );
};

export default WordScramble; 