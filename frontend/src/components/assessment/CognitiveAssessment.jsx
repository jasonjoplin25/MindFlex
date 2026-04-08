import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Grid,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  Assessment as AssessmentIcon,
  BarChart as ResultsIcon,
  FitnessCenter as StrengthIcon,
  TrendingUp as ImprovementIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { assessmentAPI } from '../../services/api';

// Tests for different cognitive domains
const assessmentTests = [
  {
    id: 'introduction',
    title: 'Welcome to the Cognitive Assessment',
    description: 'This assessment will measure your baseline cognitive abilities across different domains. The results will help us create a personalized training plan just for you.',
    type: 'info',
  },
  {
    id: 'memory',
    title: 'Memory Assessment',
    description: 'This test measures your ability to remember and recall information.',
    type: 'test',
    duration: 60, // seconds
    cognitiveFunction: 'memory',
    instructions: 'You will be shown a series of items for 30 seconds. Try to remember as many as possible. Then, you will be asked to recall them.',
    test: {
      type: 'recall',
      items: ['Apple', 'Car', 'Chair', 'Dog', 'House', 'Key', 'Book', 'Pencil', 'Phone', 'Tree'],
      displayTime: 30, // seconds to show items
      recallTime: 30, // seconds to recall items
    }
  },
  {
    id: 'attention',
    title: 'Attention Assessment',
    description: 'This test measures your ability to focus and sustain attention.',
    type: 'test',
    duration: 60,
    cognitiveFunction: 'attention',
    instructions: 'You will see a sequence of letters. Press the spacebar whenever you see the letter "X", but only when it follows the letter "A".',
    test: {
      type: 'continuous-performance',
      targetSequence: ['A', 'X'],
      sequence: generateRandomSequence(30, ['A', 'X'], 0.3),
      displayTime: 2, // seconds per letter
    }
  },
  {
    id: 'processing-speed',
    title: 'Processing Speed Assessment',
    description: 'This test measures how quickly you can process information.',
    type: 'test',
    duration: 60,
    cognitiveFunction: 'processing-speed',
    instructions: 'You will see a series of numbers. Click on the numbers in ascending order (from lowest to highest) as quickly as possible.',
    test: {
      type: 'number-sorting',
      items: generateRandomNumbers(10, 1, 100),
      timeLimit: 60, // seconds
    }
  },
  {
    id: 'reasoning',
    title: 'Reasoning Assessment',
    description: 'This test measures your logical reasoning and problem-solving abilities.',
    type: 'test',
    duration: 120,
    cognitiveFunction: 'reasoning',
    instructions: 'Complete the pattern by selecting the missing piece from the options below.',
    test: {
      type: 'pattern-completion',
      patterns: [
        {
          sequence: [1, 3, 5, 7],
          options: [8, 9, 11, 10],
          answer: 9, // Next in sequence
        },
        {
          sequence: [2, 4, 8, 16],
          options: [24, 32, 31, 30],
          answer: 32, // Next in sequence
        },
        {
          sequence: [3, 6, 12, 24],
          options: [36, 48, 72, 96],
          answer: 48, // Next in sequence
        }
      ]
    }
  },
  {
    id: 'completion',
    title: 'Assessment Complete',
    description: 'Thank you for completing the cognitive assessment. We will now analyze your results and create a personalized training plan.',
    type: 'info',
  },
];

// Helper function to generate a random sequence
function generateRandomSequence(length, items, targetProbability) {
  const sequence = [];
  for (let i = 0; i < length; i++) {
    if (Math.random() < targetProbability && i > 0 && sequence[i-1] === 'A') {
      sequence.push('X'); // Make the target sequence
    } else {
      const item = items[Math.floor(Math.random() * items.length)];
      sequence.push(item);
    }
  }
  return sequence;
}

// Helper function to generate random unique numbers
function generateRandomNumbers(count, min, max) {
  const numbers = [];
  while (numbers.length < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return numbers;
}

// Component for memory recall test
const MemoryRecallTest = ({ test, onComplete }) => {
  const [phase, setPhase] = useState('memorize'); // memorize or recall
  const [timeLeft, setTimeLeft] = useState(test.displayTime);
  const [recalledItems, setRecalledItems] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [testResults, setTestResults] = useState(null);
  
  // Effect for handling the timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (phase === 'memorize') {
            setPhase('recall');
            return test.recallTime;
          } else {
            clearInterval(timer);
            // Instead of calling onComplete directly, mark as completed and save results
            const results = {
              correctItems: recalledItems.filter(item => 
                test.items.includes(item.toLowerCase())
              ).length,
              totalItems: test.items.length,
            };
            setTestResults(results);
            setIsCompleted(true);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [phase, test, recalledItems]);
  
  // Separate effect to handle completion
  useEffect(() => {
    if (isCompleted && testResults) {
      onComplete(testResults);
    }
  }, [isCompleted, testResults, onComplete]);
  
  const handleAddItem = () => {
    if (inputValue.trim() && !recalledItems.includes(inputValue.trim())) {
      setRecalledItems([...recalledItems, inputValue.trim()]);
      setInputValue('');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  };
  
  return (
    <Box sx={{ textAlign: 'center' }}>
      {phase === 'memorize' ? (
        <Box>
          <Typography variant="h6" gutterBottom>Memorize these items:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, my: 3 }}>
            {test.items.map((item, index) => (
              <Paper 
                key={index}
                sx={{ 
                  p: 2, 
                  width: 100, 
                  textAlign: 'center',
                  bgcolor: 'primary.main',
                  color: 'white',
                }}
              >
                <Typography variant="h6">{item}</Typography>
              </Paper>
            ))}
          </Box>
          <Typography variant="body1">Time remaining: {timeLeft} seconds</Typography>
        </Box>
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom>
            Now recall as many items as you can:
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ 
                padding: '8px 16px',
                fontSize: '1rem',
                borderRadius: 4,
                border: '1px solid #ccc',
                marginRight: 8,
              }}
              placeholder="Type an item..."
            />
            <Button 
              variant="contained" 
              onClick={handleAddItem}
            >
              Add
            </Button>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            {recalledItems.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}>
                {recalledItems.map((item, index) => (
                  <Paper 
                    key={index}
                    sx={{ 
                      p: 1, 
                      bgcolor: 'secondary.main',
                      color: 'white',
                    }}
                  >
                    <Typography>{item}</Typography>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No items added yet
              </Typography>
            )}
          </Box>
          
          <Typography variant="body1">Time remaining: {timeLeft} seconds</Typography>
        </Box>
      )}
    </Box>
  );
};

// Component for continuous performance test (AX task)
const ContinuousPerformanceTest = ({ test, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [showLetter, setShowLetter] = useState(true);
  
  useEffect(() => {
    if (currentIndex >= test.sequence.length) {
      // Calculate results
      let correctResponses = 0;
      let falseAlarms = 0;
      
      for (let i = 0; i < test.sequence.length - 1; i++) {
        const isTarget = test.sequence[i] === 'A' && test.sequence[i+1] === 'X';
        const responded = responses[i];
        
        if (isTarget && responded) correctResponses++;
        if (!isTarget && responded) falseAlarms++;
      }
      
      onComplete({
        correctResponses,
        falseAlarms,
        totalTargets: test.sequence.filter((item, i) => 
          i < test.sequence.length - 1 && item === 'A' && test.sequence[i+1] === 'X'
        ).length,
      });
      return;
    }
    
    const timer = setTimeout(() => {
      setShowLetter(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setShowLetter(true);
      }, 200); // Brief pause between letters
    }, test.displayTime * 1000);
    
    return () => clearTimeout(timer);
  }, [currentIndex, test, responses, onComplete]);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && currentIndex > 0) {
        setResponses(prev => {
          const newResponses = [...prev];
          newResponses[currentIndex - 1] = true;
          return newResponses;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);
  
  if (currentIndex >= test.sequence.length) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6">Test completed!</Typography>
        <Typography variant="body1">Please wait for results...</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="body1" gutterBottom>
        Press spacebar when you see X after A
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        my: 4,
        height: 200,
      }}>
        {showLetter && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Typography 
              variant="h1" 
              sx={{ 
                fontSize: '8rem',
                fontWeight: 'bold',
              }}
            >
              {test.sequence[currentIndex]}
            </Typography>
          </motion.div>
        )}
      </Box>
      
      <Typography variant="body2">
        Progress: {currentIndex}/{test.sequence.length}
      </Typography>
    </Box>
  );
};

// Component for number sorting test
const NumberSortingTest = ({ test, onComplete }) => {
  const [numbers, setNumbers] = useState([...test.items]);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(test.timeLimit);
  const [startTime, setStartTime] = useState(Date.now());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete({
            correctOrder: isCorrectOrder(selectedNumbers),
            timeElapsed: (Date.now() - startTime) / 1000,
            numbersSelected: selectedNumbers.length,
            totalNumbers: numbers.length,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [test, startTime, selectedNumbers, numbers, onComplete]);
  
  const isCorrectOrder = (nums) => {
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] < nums[i-1]) return false;
    }
    return true;
  };
  
  const handleNumberClick = (number) => {
    if (!selectedNumbers.includes(number)) {
      setSelectedNumbers([...selectedNumbers, number]);
      
      // If all numbers are selected, complete the test
      if (selectedNumbers.length === numbers.length - 1) {
        onComplete({
          correctOrder: isCorrectOrder([...selectedNumbers, number]),
          timeElapsed: (Date.now() - startTime) / 1000,
          numbersSelected: selectedNumbers.length + 1,
          totalNumbers: numbers.length,
        });
      }
    }
  };
  
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Click on the numbers in ascending order (lowest to highest)
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, my: 3 }}>
        {numbers.map((number, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Paper 
              sx={{ 
                p: 2, 
                width: 60, 
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                bgcolor: selectedNumbers.includes(number) ? 'success.main' : 'primary.main',
                color: 'white',
                opacity: selectedNumbers.includes(number) ? 0.6 : 1,
              }}
              onClick={() => handleNumberClick(number)}
            >
              <Typography variant="h6">{number}</Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1">
          Selected: {selectedNumbers.join(' → ')}
        </Typography>
      </Box>
      
      <Typography variant="body1">Time remaining: {timeLeft} seconds</Typography>
    </Box>
  );
};

// Component for pattern completion test
const PatternCompletionTest = ({ test, onComplete }) => {
  const [currentPattern, setCurrentPattern] = useState(0);
  const [answers, setAnswers] = useState([]);
  
  const handleOptionClick = (option) => {
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);
    
    if (currentPattern < test.patterns.length - 1) {
      setCurrentPattern(currentPattern + 1);
    } else {
      // Calculate results
      const correctAnswers = newAnswers.filter((answer, index) => 
        answer === test.patterns[index].answer
      ).length;
      
      onComplete({
        correctAnswers,
        totalPatterns: test.patterns.length,
      });
    }
  };
  
  const pattern = test.patterns[currentPattern];
  
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        What number comes next in the sequence?
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: 2,
        my: 4 
      }}>
        {pattern.sequence.map((number, index) => (
          <Paper 
            key={index}
            sx={{ 
              p: 2, 
              width: 60, 
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            <Typography variant="h6">{number}</Typography>
          </Paper>
        ))}
        
        <Paper 
          sx={{ 
            p: 2, 
            width: 60, 
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.paper',
            color: 'primary.main',
            border: '2px dashed',
            borderColor: 'primary.main',
          }}
        >
          <Typography variant="h6">?</Typography>
        </Paper>
      </Box>
      
      <Typography variant="body1" gutterBottom>
        Select the correct answer:
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, my: 2 }}>
        {pattern.options.map((option, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Paper 
              sx={{ 
                p: 2, 
                width: 60, 
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                bgcolor: 'secondary.main',
                color: 'white',
              }}
              onClick={() => handleOptionClick(option)}
            >
              <Typography variant="h6">{option}</Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>
      
      <Typography variant="body2">
        Pattern {currentPattern + 1}/{test.patterns.length}
      </Typography>
    </Box>
  );
};

// Main assessment component
const CognitiveAssessment = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [testResults, setTestResults] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  
  const currentTest = assessmentTests[activeStep];
  
  const handleTestComplete = (results) => {
    setTestResults({
      ...testResults,
      [currentTest.id]: {
        ...results,
        cognitiveFunction: currentTest.cognitiveFunction,
      },
    });
    
    // Move to next step
    handleNext();
  };
  
  const handleNext = () => {
    setActiveStep(prevStep => {
      const nextStep = prevStep + 1;
      
      // If we're at the last step, show results
      if (nextStep >= assessmentTests.length) {
        finishAssessment();
        return prevStep;
      }
      
      return nextStep;
    });
  };
  
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  const finishAssessment = async () => {
    // Calculate cognitive scores (0-100) for each domain
    const scores = {
      memory: 0,
      attention: 0,
      'processing-speed': 0,
      reasoning: 0,
    };

    const memoryResult = testResults.memory;
    if (memoryResult) {
      scores.memory = Math.round((memoryResult.correctItems / memoryResult.totalItems) * 100);
    }

    const attentionResult = testResults.attention;
    if (attentionResult) {
      const hitRate = attentionResult.correctResponses / attentionResult.totalTargets;
      const falseAlarmRate = attentionResult.falseAlarms / (attentionResult.sequence?.length || 30);
      scores.attention = Math.max(0, Math.round((hitRate - falseAlarmRate) * 100));
    }

    const speedResult = testResults['processing-speed'];
    if (speedResult) {
      const completionPercentage = speedResult.numbersSelected / speedResult.totalNumbers;
      const timeScore = Math.max(0, 100 - (speedResult.timeElapsed / 60) * 100);
      scores['processing-speed'] = Math.round((completionPercentage * 0.5 + (timeScore / 100) * 0.5) * 100);
    }

    const reasoningResult = testResults.reasoning;
    if (reasoningResult) {
      scores.reasoning = Math.round((reasoningResult.correctAnswers / reasoningResult.totalPatterns) * 100);
    }

    // Persist to localStorage for immediate use
    localStorage.setItem('cognitiveAssessment', JSON.stringify({
      scores,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'guest',
    }));

    setShowResults(true);
    await saveAssessmentResults(scores);
  };

  const saveAssessmentResults = async (scores) => {
    setAiLoading(true);
    setAiError(null);

    try {
      // Save to backend (fire-and-forget — don't block on DB errors)
      try {
        await assessmentAPI.save(scores, testResults);
      } catch (saveErr) {
        console.warn('Could not persist assessment to backend:', saveErr);
      }

      // Get AI interpretation
      const patientProfile = user ? { age: user.age, condition: user.condition } : null;
      const interpretResponse = await assessmentAPI.interpret(scores, patientProfile);
      if (interpretResponse.data?.success) {
        setAiInterpretation(interpretResponse.data.interpretation);
      }
    } catch (err) {
      console.error('AI interpretation error:', err);
      setAiError('AI analysis unavailable — showing score summary only.');
    } finally {
      setAiLoading(false);
    }
  };
  
  const calculateOverallScore = (scores) => {
    if (!scores) return 0;
    const values = Object.values(scores);
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  };
  
  const handleFinish = () => {
    // Navigate to the personalized dashboard
    navigate('/dashboard');
  };
  
  const renderTestComponent = () => {
    if (currentTest.type === 'info') {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          {currentTest.id === 'introduction' ? (
            <AssessmentIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          ) : (
            <ResultsIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          )}
          <Typography variant="h5" gutterBottom>
            {currentTest.title}
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
            {currentTest.description}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            endIcon={<NextIcon />}
            size="large"
          >
            {currentTest.id === 'introduction' ? 'Start Assessment' : 'View Results'}
          </Button>
        </Box>
      );
    }
    
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          {currentTest.title}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {currentTest.instructions}
        </Typography>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          {currentTest.id === 'memory' && (
            <MemoryRecallTest 
              test={currentTest.test} 
              onComplete={handleTestComplete}
            />
          )}
          {currentTest.id === 'attention' && (
            <ContinuousPerformanceTest 
              test={currentTest.test} 
              onComplete={handleTestComplete}
            />
          )}
          {currentTest.id === 'processing-speed' && (
            <NumberSortingTest 
              test={currentTest.test} 
              onComplete={handleTestComplete}
            />
          )}
          {currentTest.id === 'reasoning' && (
            <PatternCompletionTest 
              test={currentTest.test} 
              onComplete={handleTestComplete}
            />
          )}
        </Paper>
      </Box>
    );
  };
  
  const scores = JSON.parse(localStorage.getItem('cognitiveAssessment'))?.scores;
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper
          sx={{
            p: 4, 
            background: theme => theme.palette.mode === 'dark'
              ? 'rgba(19, 47, 76, 0.4)'
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: theme => `1px solid ${theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.1)'
            }`,
          }}
        >
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {assessmentTests.map((test, index) => (
              <Step key={test.id}>
                <StepLabel>{test.type === 'info' ? 'Info' : test.cognitiveFunction}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {renderTestComponent()}
          
          {currentTest.type !== 'info' && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<BackIcon />}
              >
                Back
              </Button>
              <Button
                color="secondary"
                onClick={() => handleTestComplete({ skipped: true })}
                variant="outlined"
              >
                Skip
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
      
      <Dialog
        open={showResults}
        maxWidth="md"
        fullWidth
        onClose={() => setShowResults(false)}
        PaperProps={{
          sx: {
            background: theme => theme.palette.mode === 'dark'
              ? 'rgba(19, 47, 76, 0.9)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ResultsIcon sx={{ mr: 1, color: 'primary.main' }} />
            Assessment Results
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h4" align="center" gutterBottom>
            Overall Score: {calculateOverallScore(scores)}
          </Typography>

          {/* Domain score bars */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {scores && Object.entries(scores).map(([domain, score]) => {
              const domainInfo = aiInterpretation?.domain_breakdown?.[domain];
              const band = domainInfo?.band || (score >= 70 ? 'normal' : score >= 50 ? 'mild_concern' : 'moderate_concern');
              const barColor = band === 'normal' ? 'success' : band === 'mild_concern' ? 'warning' : 'error';
              return (
                <Grid item xs={12} sm={6} key={domain}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="subtitle2">
                        {domain.charAt(0).toUpperCase() + domain.slice(1).replace('-', ' ')}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight="bold">{score}/100</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={score}
                      color={barColor}
                      sx={{ height: 8, borderRadius: 4, mb: 1 }}
                    />
                    {domainInfo?.immediate_tip && (
                      <Typography variant="caption" color="text.secondary">
                        {domainInfo.immediate_tip}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          {/* AI interpretation */}
          {aiLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Analysing your results with AI...
              </Typography>
            </Box>
          )}

          {aiError && (
            <Alert severity="warning" sx={{ mt: 2 }}>{aiError}</Alert>
          )}

          {aiInterpretation && !aiLoading && (
            <Box sx={{ mt: 3 }}>
              {/* Overall interpretation */}
              <Paper sx={{ p: 3, mb: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <Typography variant="h6" gutterBottom>AI Assessment Summary</Typography>
                <Typography variant="body1">{aiInterpretation.overall_interpretation}</Typography>
              </Paper>

              {/* Strengths & Focus Areas */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {aiInterpretation.strengths?.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <StrengthIcon color="success" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="bold">Strengths</Typography>
                      </Box>
                      {aiInterpretation.strengths.map((s, i) => (
                        <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>• {s}</Typography>
                      ))}
                    </Paper>
                  </Grid>
                )}
                {aiInterpretation.focus_areas?.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ImprovementIcon color="warning" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="bold">Areas to Focus On</Typography>
                      </Box>
                      {aiInterpretation.focus_areas.map((f, i) => (
                        <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>• {f}</Typography>
                      ))}
                    </Paper>
                  </Grid>
                )}
              </Grid>

              {/* Recommended games */}
              {aiInterpretation.recommended_games?.length > 0 && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Recommended Games for You
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {aiInterpretation.recommended_games.map((g, i) => (
                      <Chip key={i} label={g} color="primary" variant="outlined" size="small" />
                    ))}
                  </Box>
                </Paper>
              )}

              {/* Caregiver note */}
              {aiInterpretation.caregiver_note && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.light' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Note for Caregiver</Typography>
                  <Typography variant="body2">{aiInterpretation.caregiver_note}</Typography>
                </Paper>
              )}

              {/* Disclaimer */}
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                {aiInterpretation.clinical_disclaimer}
              </Typography>
            </Box>
          )}

          {/* Fallback hardcoded recommendations when AI is unavailable */}
          {!aiInterpretation && !aiLoading && (
            <Box sx={{ mt: 3, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>Recommendations</Typography>
              <ul>
                {scores && scores.memory < 70 && (
                  <li><Typography><strong>Memory:</strong> Memory Match and Sequence Memory games.</Typography></li>
                )}
                {scores && scores.attention < 70 && (
                  <li><Typography><strong>Attention:</strong> Reaction Speed and Pattern Memory games.</Typography></li>
                )}
                {scores && scores['processing-speed'] < 70 && (
                  <li><Typography><strong>Processing Speed:</strong> Reaction Speed and Math Challenge.</Typography></li>
                )}
                {scores && scores.reasoning < 70 && (
                  <li><Typography><strong>Reasoning:</strong> Word Scramble and Math Challenge.</Typography></li>
                )}
                {scores && Object.values(scores).every(s => s >= 70) && (
                  <li><Typography><strong>Well-rounded:</strong> Keep up the balanced approach with all games.</Typography></li>
                )}
              </ul>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResults(false)}>Close</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleFinish}
            endIcon={<CheckIcon />}
          >
            View Personalized Dashboard
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CognitiveAssessment; 