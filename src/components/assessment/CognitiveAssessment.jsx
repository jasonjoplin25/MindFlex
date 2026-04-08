import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Psychology as PsychologyIcon,
  Calculate as CalculateIcon,
  Check as CheckIcon,
  ArrowForward as NextIcon,
  RestartAlt as ResetIcon,
  SaveAlt as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Helper to generate random number sequences
const generateSequence = (length, max = 9) => {
  const sequence = [];
  for (let i = 0; i < length; i++) {
    sequence.push(Math.floor(Math.random() * (max + 1)));
  }
  return sequence;
};

// Helper to generate random ordered numbers
const generateOrderedNumbers = (count, shuffled = true) => {
  const numbers = Array.from({ length: count }, (_, i) => i + 1);
  if (shuffled) {
    // Fisher-Yates shuffle
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
  }
  return numbers;
};

// Memory Recall Test
const MemoryRecallTest = ({ onComplete }) => {
  const theme = useTheme();
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [showSequence, setShowSequence] = useState(true);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState(false);
  const [score, setScore] = useState(0);
  
  // Initialize sequence
  useEffect(() => {
    const newSequence = generateSequence(5);
    setSequence(newSequence);
    
    // Show sequence for 5 seconds then hide
    const timer = setTimeout(() => {
      setShowSequence(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle number selection
  const handleSelectNumber = (num) => {
    if (showSequence) return;
    
    const newUserSequence = [...userSequence, num];
    setUserSequence(newUserSequence);
    
    // Check if the selection is correct
    if (num !== sequence[userSequence.length]) {
      setError(true);
      // Calculate score based on correct entries
      const finalScore = Math.round((userSequence.length / sequence.length) * 100);
      setTimeout(() => {
        onComplete('memory', finalScore);
      }, 1500);
      return;
    }
    
    // Check if sequence is complete
    if (newUserSequence.length === sequence.length) {
      setScore(100);
      setTimeout(() => {
        onComplete('memory', 100);
      }, 1500);
      return;
    }
    
    setUserSequence(newUserSequence);
  };
  
  return (
    <Card variant="outlined" sx={{ mb: 4, overflow: 'visible' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Memory Recall Test
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Memorize the sequence of numbers, then recall them in the correct order.
        </Typography>
        
        <Box sx={{ my: 3, p: 2, bgcolor: theme.palette.background.default, borderRadius: 2 }}>
          {showSequence ? (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" gutterBottom>
                Memorize this sequence:
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                {sequence.map((num, index) => (
                  <Box
                    key={index}
                    component={motion.div}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.3, duration: 0.3 }}
                    sx={{
                      width: 50,
                      height: 50,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      borderRadius: 1,
                      mx: 1,
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {num}
                  </Box>
                ))}
              </Box>
              <LinearProgress variant="determinate" value={0} sx={{ mt: 2 }} />
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                Memorizing time: 5 seconds
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Recall the sequence in order:
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                {sequence.map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 50,
                      height: 50,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: index < userSequence.length 
                        ? (error && index === userSequence.length - 1 
                          ? theme.palette.error.main 
                          : theme.palette.success.main)
                        : theme.palette.action.disabledBackground,
                      color: index < userSequence.length ? 'white' : 'text.disabled',
                      borderRadius: 1,
                      mx: 1,
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {index < userSequence.length ? userSequence[index] : '?'}
                  </Box>
                ))}
              </Box>
              
              {!error && userSequence.length < sequence.length && (
                <Grid container spacing={1} sx={{ mt: 2 }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <Grid item key={num} xs={2} sm={1}>
                      <Button
                        variant="outlined"
                        sx={{
                          minWidth: '40px',
                          height: '40px',
                          p: 0,
                        }}
                        onClick={() => handleSelectNumber(num)}
                      >
                        {num}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Incorrect! The correct sequence was: {sequence.join(', ')}
                </Alert>
              )}
              
              {userSequence.length === sequence.length && !error && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Perfect! You have an excellent memory.
                </Alert>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Continuous Performance Test
const ContinuousPerformanceTest = ({ onComplete }) => {
  const theme = useTheme();
  const [currentLetter, setCurrentLetter] = useState(null);
  const [targetLetter, setTargetLetter] = useState('X');
  const [responses, setResponses] = useState([]);
  const [showLetter, setShowLetter] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [score, setScore] = useState(0);
  
  const letters = ['A', 'B', 'C', 'D', 'E', 'X', 'F', 'G', 'H', 'I'];
  const testLength = 20; // Number of letters to show
  
  // Start the test
  const handleStartTest = () => {
    setTestStarted(true);
    runTest();
  };
  
  // Run the test sequence
  const runTest = () => {
    let currentIndex = 0;
    let correctResponses = 0;
    let totalTargets = 0;
    
    const interval = setInterval(() => {
      if (currentIndex >= testLength) {
        clearInterval(interval);
        setTestComplete(true);
        
        // Calculate score (correct responses / total targets * 100)
        const finalScore = Math.round((correctResponses / totalTargets) * 100);
        setScore(finalScore);
        setTimeout(() => {
          onComplete('attention', finalScore);
        }, 2000);
        return;
      }
      
      // Randomly select a letter, with increased probability for target letter
      const isTarget = Math.random() < 0.3;
      const letter = isTarget ? targetLetter : letters[Math.floor(Math.random() * (letters.length - 1))];
      
      if (isTarget) totalTargets++;
      
      setCurrentLetter(letter);
      setShowLetter(true);
      
      // Hide letter after 1 second
      setTimeout(() => {
        setShowLetter(false);
        
        // Check if user responded correctly
        setTimeout(() => {
          // Get last response for this stimulus
          const responded = responses[currentIndex];
          
          if ((letter === targetLetter && responded) || (letter !== targetLetter && !responded)) {
            correctResponses++;
          }
          
          currentIndex++;
        }, 200);
      }, 1000);
    }, 2000);
    
    return () => clearInterval(interval);
  };
  
  // Handle user response (clicking the button)
  const handleResponse = () => {
    if (!showLetter || testComplete) return;
    
    const newResponses = [...responses];
    newResponses[responses.length] = true;
    setResponses(newResponses);
  };
  
  return (
    <Card variant="outlined" sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Continuous Performance Test
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Click the button whenever you see the letter '{targetLetter}'. Ignore all other letters.
        </Typography>
        
        {!testStarted ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={handleStartTest}
            >
              Start Test
            </Button>
          </Box>
        ) : (
          <Box sx={{ my: 3, p: 2, bgcolor: theme.palette.background.default, borderRadius: 2 }}>
            {!testComplete ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                {showLetter ? (
                  <Typography 
                    variant="h1" 
                    component={motion.h1}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {currentLetter}
                  </Typography>
                ) : (
                  <Box sx={{ height: '6rem' }} />
                )}
                
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ mt: 4 }}
                  onClick={handleResponse}
                  disabled={!showLetter}
                >
                  I saw {targetLetter}
                </Button>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Test Complete
                </Typography>
                <Typography variant="body1" paragraph>
                  Your attention score: {score}%
                </Typography>
                {score >= 80 ? (
                  <Alert severity="success">
                    Excellent attention skills! You were very focused.
                  </Alert>
                ) : score >= 60 ? (
                  <Alert severity="info">
                    Good attention skills. With practice, you can improve further.
                  </Alert>
                ) : (
                  <Alert severity="warning">
                    Your attention skills could use some improvement. Regular exercises will help.
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Number Sorting Test (Processing Speed)
const NumberSortingTest = ({ onComplete }) => {
  const theme = useTheme();
  const [numbers, setNumbers] = useState([]);
  const [sortedNumbers, setSortedNumbers] = useState([]);
  const [testStarted, setTestStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [testComplete, setTestComplete] = useState(false);
  const [score, setScore] = useState(0);
  
  // Generate numbers for the test
  useEffect(() => {
    setNumbers(generateOrderedNumbers(10, true));
  }, []);
  
  // Start the test
  const handleStartTest = () => {
    setTestStarted(true);
    setStartTime(Date.now());
    
    // Update elapsed time every 100ms
    const timer = setInterval(() => {
      if (startTime) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 100) / 10);
      }
    }, 100);
    
    return () => clearInterval(timer);
  };
  
  // Handle number selection
  const handleSelectNumber = (num) => {
    if (!testStarted || testComplete) return;
    
    const newSortedNumbers = [...sortedNumbers, num];
    setSortedNumbers(newSortedNumbers);
    
    // Check if all numbers have been selected
    if (newSortedNumbers.length === numbers.length) {
      setTestComplete(true);
      
      // Check if sorted correctly
      const correctlySorted = newSortedNumbers.every((num, index) => 
        index === 0 || num > newSortedNumbers[index - 1]
      );
      
      // Calculate score based on time and accuracy
      let finalScore = 0;
      if (correctlySorted) {
        // Time-based score: faster = higher score (max 100)
        const timeScore = Math.max(0, 100 - Math.floor(elapsedTime * 5));
        finalScore = timeScore;
      } else {
        // If incorrectly sorted, score is reduced
        finalScore = 40;
      }
      
      setScore(finalScore);
      
      setTimeout(() => {
        onComplete('processingSpeed', finalScore);
      }, 2000);
    }
  };
  
  return (
    <Card variant="outlined" sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Number Sorting Test
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Click the numbers in ascending order (from lowest to highest) as quickly as you can.
        </Typography>
        
        {!testStarted ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={handleStartTest}
            >
              Start Test
            </Button>
          </Box>
        ) : (
          <Box sx={{ my: 3, p: 2, bgcolor: theme.palette.background.default, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="subtitle2">
                Selected: {sortedNumbers.join(' > ')}
              </Typography>
              <Typography variant="subtitle2">
                Time: {elapsedTime.toFixed(1)}s
              </Typography>
            </Box>
            
            {!testComplete ? (
              <Grid container spacing={2}>
                {numbers.map((num) => (
                  <Grid item key={num} xs={4} sm={2}>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{
                        height: '50px',
                        fontSize: '1.2rem',
                        opacity: sortedNumbers.includes(num) ? 0.5 : 1,
                      }}
                      onClick={() => handleSelectNumber(num)}
                      disabled={sortedNumbers.includes(num)}
                    >
                      {num}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Test Complete
                </Typography>
                <Typography variant="body1" paragraph>
                  Your processing speed score: {score}%
                </Typography>
                {score >= 80 ? (
                  <Alert severity="success">
                    Excellent speed! You processed the information very quickly.
                  </Alert>
                ) : score >= 60 ? (
                  <Alert severity="info">
                    Good processing speed. With practice, you can become even faster.
                  </Alert>
                ) : (
                  <Alert severity="warning">
                    Your processing speed could use some improvement. Regular exercises will help.
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Pattern Completion Test (Reasoning)
const PatternCompletionTest = ({ onComplete }) => {
  const theme = useTheme();
  const [questions, setQuestions] = useState([
    {
      sequence: [2, 4, 6, 8],
      options: [9, 10, 12, 14],
      correctAnswer: 10,
      userAnswer: null,
    },
    {
      sequence: [3, 6, 9, 12],
      options: [13, 15, 18, 21],
      correctAnswer: 15,
      userAnswer: null,
    },
    {
      sequence: [1, 4, 9, 16],
      options: [20, 25, 36, 49],
      correctAnswer: 25,
      userAnswer: null,
    },
    {
      sequence: [2, 3, 5, 8, 13],
      options: [18, 21, 24, 34],
      correctAnswer: 21,
      userAnswer: null,
    },
    {
      sequence: [1, 3, 6, 10],
      options: [12, 15, 18, 21],
      correctAnswer: 15,
      userAnswer: null,
    },
  ]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [testComplete, setTestComplete] = useState(false);
  const [score, setScore] = useState(0);
  
  // Handle option selection
  const handleSelectOption = (option) => {
    if (testComplete) return;
    
    // Update the current question's user answer
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestion].userAnswer = option;
    setQuestions(updatedQuestions);
    
    // Move to next question or complete test
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 1000);
    } else {
      // Calculate score
      const correctAnswers = updatedQuestions.filter(
        q => q.userAnswer === q.correctAnswer
      ).length;
      
      const finalScore = Math.round((correctAnswers / questions.length) * 100);
      setScore(finalScore);
      setTestComplete(true);
      
      setTimeout(() => {
        onComplete('reasoning', finalScore);
      }, 2000);
    }
  };
  
  const currentQ = questions[currentQuestion];
  
  return (
    <Card variant="outlined" sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Pattern Completion Test
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Identify the next number in the sequence by recognizing the pattern.
        </Typography>
        
        {!testComplete ? (
          <Box sx={{ my: 3, p: 2, bgcolor: theme.palette.background.default, borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Question {currentQuestion + 1} of {questions.length}
            </Typography>
            
            <Box sx={{ my: 3, textAlign: 'center' }}>
              <Typography variant="subtitle1" gutterBottom>
                What number comes next in this sequence?
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                {currentQ.sequence.map((num, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      borderRadius: 1,
                      mx: 1,
                      fontSize: '1.2rem',
                    }}
                  >
                    {num}
                  </Box>
                ))}
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: theme.palette.action.selected,
                    color: theme.palette.text.primary,
                    borderRadius: 1,
                    mx: 1,
                    fontSize: '1.2rem',
                    border: `2px dashed ${theme.palette.primary.main}`,
                  }}
                >
                  ?
                </Box>
              </Box>
              
              <Grid container spacing={2} sx={{ mt: 3 }}>
                {currentQ.options.map((option) => (
                  <Grid item key={option} xs={6} sm={3}>
                    <Button
                      variant={currentQ.userAnswer === option ? "contained" : "outlined"}
                      color={
                        currentQ.userAnswer === option 
                          ? (option === currentQ.correctAnswer ? "success" : "error") 
                          : "primary"
                      }
                      fullWidth
                      onClick={() => handleSelectOption(option)}
                      disabled={currentQ.userAnswer !== null}
                      sx={{ height: '50px', fontSize: '1.2rem' }}
                    >
                      {option}
                    </Button>
                  </Grid>
                ))}
              </Grid>
              
              {currentQ.userAnswer !== null && (
                <Box sx={{ mt: 2 }}>
                  {currentQ.userAnswer === currentQ.correctAnswer ? (
                    <Alert severity="success">
                      Correct! You identified the pattern.
                    </Alert>
                  ) : (
                    <Alert severity="error">
                      Incorrect. The correct answer is {currentQ.correctAnswer}.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Test Complete
            </Typography>
            <Typography variant="body1" paragraph>
              Your reasoning score: {score}%
            </Typography>
            {score >= 80 ? (
              <Alert severity="success">
                Excellent reasoning skills! You're very good at pattern recognition.
              </Alert>
            ) : score >= 60 ? (
              <Alert severity="info">
                Good reasoning skills. With practice, you can improve further.
              </Alert>
            ) : (
              <Alert severity="warning">
                Your reasoning skills could use some improvement. Regular exercises will help.
              </Alert>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Main CognitiveAssessment component
const CognitiveAssessment = () => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState({});
  const [results, setResults] = useState({
    memory: 0,
    attention: 0,
    processingSpeed: 0,
    reasoning: 0,
  });
  const [loading, setLoading] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  
  // Test completion handler
  const handleTestComplete = (domain, score) => {
    // Update results
    setResults({
      ...results,
      [domain]: score,
    });
    
    // Mark current step as completed
    const newCompleted = { ...completed };
    newCompleted[activeStep] = true;
    setCompleted(newCompleted);
    
    // Move to next step after a delay
    setTimeout(() => {
      if (activeStep < 3) {
        setActiveStep(activeStep + 1);
      } else {
        // All tests completed
        setLoading(true);
        
        // Simulate saving results
        setTimeout(() => {
          setLoading(false);
          setAssessmentComplete(true);
          
          // Save to localStorage for other components to use
          localStorage.setItem('cognitiveDomainScores', JSON.stringify(results));
        }, 2000);
      }
    }, 2000);
  };
  
  // Handle restart assessment
  const handleRestartAssessment = () => {
    setActiveStep(0);
    setCompleted({});
    setResults({
      memory: 0,
      attention: 0,
      processingSpeed: 0,
      reasoning: 0,
    });
    setAssessmentComplete(false);
  };
  
  // Steps for the assessment
  const steps = [
    {
      label: 'Memory Test',
      description: 'Assess your ability to recall information accurately',
      icon: <MemoryIcon />,
      component: <MemoryRecallTest onComplete={handleTestComplete} />,
      domain: 'memory',
    },
    {
      label: 'Attention Test',
      description: 'Measure your ability to sustain focus over time',
      icon: <PsychologyIcon />,
      component: <ContinuousPerformanceTest onComplete={handleTestComplete} />,
      domain: 'attention',
    },
    {
      label: 'Processing Speed',
      description: 'Evaluate how quickly you can process information',
      icon: <SpeedIcon />,
      component: <NumberSortingTest onComplete={handleTestComplete} />,
      domain: 'processingSpeed',
    },
    {
      label: 'Reasoning Test',
      description: 'Assess your ability to identify patterns and solve problems',
      icon: <CalculateIcon />,
      component: <PatternCompletionTest onComplete={handleTestComplete} />,
      domain: 'reasoning',
    },
  ];
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Cognitive Assessment</Typography>
      </Box>
      
      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: theme => theme.palette.mode === 'dark'
            ? 'rgba(19, 47, 76, 0.4)'
            : 'rgba(255, 255, 255, 0.8)',
          borderRadius: 2,
        }}
      >
        {assessmentComplete ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              Assessment Complete
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              Your cognitive assessment is complete! We've analyzed your performance across four key cognitive domains.
            </Alert>
            
            <Grid container spacing={3}>
              {Object.entries(results).map(([domain, score]) => {
                const domainInfo = {
                  memory: { label: 'Memory', icon: <MemoryIcon /> },
                  attention: { label: 'Attention', icon: <PsychologyIcon /> },
                  processingSpeed: { label: 'Processing Speed', icon: <SpeedIcon /> },
                  reasoning: { label: 'Reasoning', icon: <CalculateIcon /> },
                }[domain];
                
                // Determine score level
                let scoreColor, scoreLevel;
                if (score >= 80) {
                  scoreColor = theme.palette.success.main;
                  scoreLevel = 'Excellent';
                } else if (score >= 65) {
                  scoreColor = theme.palette.info.main;
                  scoreLevel = 'Good';
                } else if (score >= 50) {
                  scoreColor = theme.palette.warning.main;
                  scoreLevel = 'Average';
                } else {
                  scoreColor = theme.palette.error.main;
                  scoreLevel = 'Needs Improvement';
                }
                
                return (
                  <Grid item xs={12} sm={6} key={domain}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Box
                            sx={{
                              bgcolor: `${scoreColor}20`,
                              color: scoreColor,
                              p: 1,
                              borderRadius: '50%',
                              mr: 1,
                            }}
                          >
                            {domainInfo.icon}
                          </Box>
                          <Typography variant="h6">{domainInfo.label}</Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={score}
                            sx={{ 
                              flexGrow: 1, 
                              height: 8, 
                              borderRadius: 1,
                              bgcolor: `${scoreColor}20`,
                              '& .MuiLinearProgress-bar': {
                                bgcolor: scoreColor,
                              }
                            }}
                          />
                          <Typography variant="body1" fontWeight="bold" sx={{ ml: 2, minWidth: 40 }}>
                            {score}%
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          Level: <span style={{ color: scoreColor, fontWeight: 'bold' }}>{scoreLevel}</span>
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                startIcon={<ResetIcon />}
                onClick={handleRestartAssessment}
              >
                Restart Assessment
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                endIcon={<NextIcon />}
                onClick={() => {
                  // In a real app, this would navigate to the training plan
                  alert('In a real app, this would navigate to your personalized training plan');
                }}
              >
                View Training Plan
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <Typography variant="body1" paragraph>
              This assessment will measure your cognitive abilities across four key domains: Memory, Attention, Processing Speed, and Reasoning.
              Complete each test to receive a personalized cognitive profile.
            </Typography>
            
            <Typography variant="body2" paragraph color="text.secondary">
              Each test takes 2-3 minutes to complete. Find a quiet place without distractions for the most accurate results.
            </Typography>
            
            <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 3 }}>
              {steps.map((step, index) => (
                <Step key={step.label} completed={completed[index]}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        bgcolor: index === activeStep 
                          ? theme.palette.primary.main 
                          : completed[index]
                            ? theme.palette.success.main
                            : theme.palette.action.disabledBackground,
                        color: index === activeStep || completed[index] ? 'white' : theme.palette.text.disabled,
                      }}>
                        {completed[index] ? <CheckIcon /> : step.icon}
                      </Box>
                    )}
                  >
                    <Typography variant="subtitle1">{step.label}</Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {step.description}
                    </Typography>
                    {index === activeStep && step.component}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Analyzing your results...
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CognitiveAssessment; 