import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Chip,
  Tooltip,
  Alert,
  Fade
} from '@mui/material';
import { styled } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import llmApi from '../../services/llmService';
import { useLLM } from '../../contexts/LLMContext';

// Styled components
const ExerciseCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
}));

const HintChip = styled(Chip)(({ theme, active }) => ({
  margin: theme.spacing(0.5),
  cursor: 'pointer',
  backgroundColor: active ? theme.palette.primary.light : theme.palette.grey[200],
  color: active ? theme.palette.primary.contrastText : theme.palette.text.primary,
  '&:hover': {
    backgroundColor: active ? theme.palette.primary.main : theme.palette.grey[300],
  },
}));

const LLMExerciseGenerator = () => {
  const { activeProvider } = useLLM();
  
  // State for exercise generation
  const [gameType, setGameType] = useState('word puzzle');
  const [difficulty, setDifficulty] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exercise, setExercise] = useState(null);
  
  // State for user interaction
  const [userAnswer, setUserAnswer] = useState('');
  const [activeHints, setActiveHints] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  
  // Reset exercise state when changing game type or difficulty
  useEffect(() => {
    setExercise(null);
    setUserAnswer('');
    setActiveHints([]);
    setEvaluation(null);
  }, [gameType, difficulty]);
  
  // Generate a new exercise
  const handleGenerateExercise = async () => {
    setIsGenerating(true);
    setExercise(null);
    setUserAnswer('');
    setActiveHints([]);
    setEvaluation(null);
    
    try {
      // User profile can be enhanced with actual user data in the future
      const userProfile = {
        age: 35,
        strengths: 'vocabulary',
        improvement_areas: 'memory recall'
      };
      
      const response = await llmApi.generateExercise(gameType, difficulty, userProfile);
      setExercise(response.exercise);
    } catch (error) {
      console.error('Error generating exercise:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Toggle hint visibility
  const toggleHint = (index) => {
    if (activeHints.includes(index)) {
      setActiveHints(activeHints.filter(i => i !== index));
    } else {
      setActiveHints([...activeHints, index]);
    }
  };
  
  // Submit answer for evaluation
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || !exercise) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await llmApi.evaluateAnswer(exercise, userAnswer);
      setEvaluation(response.evaluation);
    } catch (error) {
      console.error('Error evaluating answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset the current exercise
  const handleReset = () => {
    setUserAnswer('');
    setActiveHints([]);
    setEvaluation(null);
  };
  
  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Cognitive Exercise Generator
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Generate personalized cognitive exercises powered by {activeProvider === 'local' ? 'Ollama' : activeProvider}.
      </Typography>
      
      {/* Exercise Settings */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="game-type-label">Exercise Type</InputLabel>
              <Select
                labelId="game-type-label"
                value={gameType}
                label="Exercise Type"
                onChange={(e) => setGameType(e.target.value)}
              >
                <MenuItem value="word puzzle">Word Puzzle</MenuItem>
                <MenuItem value="memory exercise">Memory Exercise</MenuItem>
                <MenuItem value="logical reasoning">Logical Reasoning</MenuItem>
                <MenuItem value="pattern recognition">Pattern Recognition</MenuItem>
                <MenuItem value="vocabulary building">Vocabulary Building</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="difficulty-label">Difficulty</InputLabel>
              <Select
                labelId="difficulty-label"
                value={difficulty}
                label="Difficulty"
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              disabled={isGenerating}
              onClick={handleGenerateExercise}
              startIcon={isGenerating ? <CircularProgress size={20} /> : <RefreshIcon />}
            >
              {isGenerating ? 'Generating...' : 'Generate Exercise'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Exercise Display */}
      {exercise && (
        <ExerciseCard>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h3" gutterBottom color="primary">
              {exercise.title}
            </Typography>
            
            <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
              {exercise.instructions}
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {exercise.content}
              </Typography>
            </Paper>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Hints:
              </Typography>
              <Box>
                {exercise.hints && exercise.hints.map((hint, index) => (
                  <HintChip
                    key={index}
                    label={`Hint ${index + 1}`}
                    icon={<HelpOutlineIcon />}
                    onClick={() => toggleHint(index)}
                    active={activeHints.includes(index)}
                  />
                ))}
              </Box>
              {activeHints.length > 0 && (
                <Paper sx={{ p: 2, mt: 2, backgroundColor: '#e8f4f8', borderRadius: 2 }}>
                  {activeHints.map(index => (
                    <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                      <strong>Hint {index + 1}:</strong> {exercise.hints[index]}
                    </Typography>
                  ))}
                </Paper>
              )}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Your Answer:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here..."
              disabled={!!evaluation}
              sx={{ mb: 2 }}
            />
            
            {evaluation && (
              <Fade in={!!evaluation}>
                <Box sx={{ mt: 3 }}>
                  <Alert 
                    severity={evaluation.correct ? "success" : "warning"}
                    icon={evaluation.correct ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="subtitle1">
                      {evaluation.correct ? "Correct!" : "Not quite right"}
                    </Typography>
                    <Typography variant="body2">
                      Score: {evaluation.score}/100
                    </Typography>
                  </Alert>
                  
                  <Typography variant="body1" paragraph>
                    <strong>Feedback:</strong> {evaluation.feedback}
                  </Typography>
                  
                  {evaluation.suggestion && (
                    <Typography variant="body1" paragraph>
                      <strong>Suggestion:</strong> {evaluation.suggestion}
                    </Typography>
                  )}
                  
                  <Typography variant="body1" color="primary">
                    {evaluation.encouragement}
                  </Typography>
                </Box>
              </Fade>
            )}
          </CardContent>
          
          <CardActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
            {!evaluation ? (
              <Button
                variant="contained"
                color="primary"
                endIcon={<SendIcon />}
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || !userAnswer.trim()}
              >
                {isSubmitting ? 'Checking...' : 'Submit Answer'}
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleReset}
              >
                Try Another Answer
              </Button>
            )}
            
            <Button
              variant="text"
              color="secondary"
              onClick={handleGenerateExercise}
              disabled={isGenerating}
            >
              New Exercise
            </Button>
          </CardActions>
        </ExerciseCard>
      )}
      
      {/* Empty state when no exercise is generated */}
      {!exercise && !isGenerating && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary" paragraph>
            Select exercise type and difficulty, then click "Generate Exercise" to start.
          </Typography>
        </Box>
      )}
      
      {/* Loading state */}
      {isGenerating && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Generating your personalized exercise...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default LLMExerciseGenerator; 