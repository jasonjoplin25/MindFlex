import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  useTheme,
  Badge,
  Avatar,
  Alert,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  StarBorder as StarEmptyIcon,
  Today as TodayIcon,
  LocalFireDepartment as StreakIcon,
  CheckCircle as CompletedIcon,
  Lock as LockIcon,
  PlayArrow as PlayIcon,
  Timer as TimerIcon,
  AccessTime as ScheduleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getGames, sessionManager } from '../../services/gameService';
import { useExerciseNavigation, EXERCISE_GAME_MAPPING } from '../../utils/exerciseGameMapping';
import challengeTracker from '../../utils/challengeTracker';

// Main component
const DailyChallenges = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { navigateToExercise } = useExerciseNavigation();
  
  const [loading, setLoading] = useState(true);
  const [todaysChallenges, setTodaysChallenges] = useState([]);
  const [streak, setStreak] = useState(0);
  const [availableGames, setAvailableGames] = useState([]);
  const [lastCompletedDate, setLastCompletedDate] = useState(null);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  
  // Effect to load challenges and history
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get games data
        const { data: gamesData, error } = await getGames();
        if (error) {
          console.error('Error fetching games:', error);
          setAvailableGames([]);
        } else {
          setAvailableGames(gamesData || []);
        }
        
        // Load challenge history from localStorage
        const historyData = JSON.parse(localStorage.getItem('challengeHistory')) || {
          streak: 0,
          lastCompletedDate: null,
          completedChallenges: [],
        };
        
        // Set streak and last completed date
        setStreak(historyData.streak || 0);
        setLastCompletedDate(historyData.lastCompletedDate);
        
        // Check if challenges for today already exist in localStorage
        const today = new Date().toISOString().split('T')[0];
        const storedChallenges = JSON.parse(localStorage.getItem(`challenges_${today}`));
        
        if (storedChallenges) {
          setTodaysChallenges(storedChallenges);
        } else {
          // Generate new challenges for today
          const newChallenges = generateDailyChallenges(gamesData || []);
          // Filter out any invalid challenges
          const validChallenges = newChallenges.filter(challenge => 
            challenge && 
            challenge.game && 
            challenge.game.id && 
            challenge.game.name && 
            challenge.difficulty &&
            challenge.xp !== undefined
          );
          setTodaysChallenges(validChallenges);
          
          // Store in localStorage
          localStorage.setItem(`challenges_${today}`, JSON.stringify(newChallenges));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  // Generate comprehensive daily challenges from ALL available games
  const generateDailyChallenges = (games) => {
    console.log('Generating challenges from games:', games);
    if (!games || !games.length) {
      console.warn('No games available for challenge generation');
      return [];
    }
    
    // Group games by type to ensure variety
    const gamesByType = games.reduce((acc, game) => {
      if (!acc[game.type]) acc[game.type] = [];
      acc[game.type].push(game);
      return acc;
    }, {});
    
    const selectedGames = [];
    const gameTypes = Object.keys(gamesByType);
    
    // First pass: Get one game from each type for maximum variety
    gameTypes.forEach(gameType => {
      const typeGames = gamesByType[gameType];
      if (typeGames.length > 0) {
        const randomGame = typeGames[Math.floor(Math.random() * typeGames.length)];
        selectedGames.push(randomGame);
      }
    });
    
    // Second pass: Add remaining games if we have fewer than the desired amount
    // Target 6-8 challenges per day to cover all games comprehensively
    const targetChallenges = Math.min(8, games.length);
    while (selectedGames.length < targetChallenges) {
      const remainingGames = games.filter(game => !selectedGames.find(sg => sg.id === game.id));
      if (remainingGames.length > 0) {
        const randomGame = remainingGames[Math.floor(Math.random() * remainingGames.length)];
        selectedGames.push(randomGame);
      } else {
        break;
      }
    }
    
    // If we still don't have enough challenges, duplicate some games with different challenge types
    if (selectedGames.length < targetChallenges && games.length > 0) {
      const duplicateCount = targetChallenges - selectedGames.length;
      for (let i = 0; i < duplicateCount; i++) {
        const randomGame = games[Math.floor(Math.random() * games.length)];
        selectedGames.push(randomGame);
      }
    }
    
    // Create comprehensive challenges with varied requirements
    return selectedGames.filter(game => game && game.id && game.name).map((game, index) => {
      // Enhanced challenge types with game-specific customization
      const gameName = game?.name || 'Unknown Game';
      const challengeTypes = [
        {
          type: 'score',
          description: `Score ${Math.max(300, 400 + index * 150)} points in ${gameName}`,
          requirement: Math.max(300, 400 + index * 150),
          requirementType: 'score',
          xp: 40 + index * 15,
        },
        {
          type: 'time',
          description: `Play ${gameName} for at least ${Math.max(2, 2 + Math.floor(index/2))} minutes`,
          requirement: Math.max(120, (2 + Math.floor(index/2)) * 60), // seconds
          requirementType: 'time',
          xp: 35 + index * 12,
        },
        {
          type: 'accuracy',
          description: `Complete ${gameName} with ${Math.max(90, 95 - Math.floor(index/2))}% accuracy`,
          requirement: Math.max(90, 95 - Math.floor(index/2)), // percentage
          requirementType: 'accuracy',
          xp: 50 + index * 20,
        },
        {
          type: 'perfect',
          description: `Complete ${gameName} without any mistakes`,
          requirement: 0, // 0 errors
          requirementType: 'errors',
          xp: 60 + index * 25,
        },
        {
          type: 'speed',
          description: `Complete ${gameName} in under ${Math.max(3, 5 - Math.floor(index/3))} minutes`,
          requirement: Math.max(180, (5 - Math.floor(index/3)) * 60), // seconds (max time)
          requirementType: 'max_time',
          xp: 45 + index * 18,
        }
      ];
      
      // Select challenge type based on game type and index for variety
      const gameType = game?.type || 'unknown';
      let selectedChallengeType;
      switch (gameType) {
        case 'reaction':
        case 'reflex':
          // Reaction games: focus on speed and accuracy
          selectedChallengeType = challengeTypes[index % 2 === 0 ? 0 : 2]; // Score or accuracy
          break;
        case 'memory':
          // Memory games: focus on accuracy and perfection
          selectedChallengeType = challengeTypes[index % 3 === 0 ? 2 : index % 3 === 1 ? 3 : 0]; // Accuracy, perfect, or score
          break;
        case 'math':
          // Math games: focus on speed and accuracy
          selectedChallengeType = challengeTypes[index % 3 === 0 ? 4 : index % 3 === 1 ? 2 : 0]; // Speed, accuracy, or score
          break;
        case 'word':
          // Word games: balanced challenges
          selectedChallengeType = challengeTypes[index % 4 === 0 ? 1 : index % 4 === 1 ? 2 : index % 4 === 2 ? 0 : 3]; // Time, accuracy, score, or perfect
          break;
        case 'pattern':
          // Pattern games: focus on accuracy and time
          selectedChallengeType = challengeTypes[index % 3 === 0 ? 2 : index % 3 === 1 ? 1 : 0]; // Accuracy, time, or score
          break;
        case 'snake':
          // Snake game: focus on score and time
          selectedChallengeType = challengeTypes[index % 2 === 0 ? 0 : 1]; // Score or time
          break;
        case 'sequence':
          // Sequence games: focus on accuracy and perfection (memory-based)
          selectedChallengeType = challengeTypes[index % 3 === 0 ? 2 : index % 3 === 1 ? 3 : 0]; // Accuracy, perfect, or score
          break;
        default:
          // Default: rotate through all challenge types
          selectedChallengeType = challengeTypes[index % challengeTypes.length];
      }
      
      // Determine reward type based on challenge difficulty
      const rewardTypes = ['coins', 'powerup', 'badge', 'gem', 'star', 'trophy'];
      const rewardIndex = index % rewardTypes.length;
      
      return {
        id: `challenge-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        game: game || {},
        description: selectedChallengeType.description,
        requirement: selectedChallengeType.requirement,
        requirementType: selectedChallengeType.requirementType,
        xp: selectedChallengeType.xp,
        completed: false,
        progress: 0,
        reward: rewardTypes[rewardIndex],
        difficulty: index < 2 ? 'easy' : index < 4 ? 'medium' : 'hard',
        priority: index < 3 ? 'high' : index < 6 ? 'medium' : 'low'
      };
    });
  };
  
  // Handle refreshing challenges (costs virtual currency in a real app)
  const handleRefreshChallenges = () => {
    if (window.confirm('Are you sure you want to refresh your daily challenges? This would normally cost coins in the real app.')) {
      const fetchData = async () => {
        try {
          setLoading(true);
          
          // Get games
          const { data: gamesData } = await getGames();
          
          // Generate new challenges
          const newChallenges = generateDailyChallenges(gamesData);
          // Filter out any invalid challenges
          const validChallenges = newChallenges.filter(challenge => 
            challenge && 
            challenge.game && 
            challenge.game.id && 
            challenge.game.name && 
            challenge.difficulty &&
            challenge.xp !== undefined
          );
          setTodaysChallenges(validChallenges);
          
          // Store in localStorage
          const today = new Date().toISOString().split('T')[0];
          localStorage.setItem(`challenges_${today}`, JSON.stringify(newChallenges));
        } catch (error) {
          console.error('Error refreshing challenges:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  };
  
  // Handle starting a challenge
  const handleStartChallenge = (challenge) => {
    // Validate challenge data
    if (!challenge || !challenge.game || !challenge.game.id) {
      console.error('Invalid challenge data:', challenge);
      return;
    }
    
    // Store challenge info in session storage so game can access it
    sessionStorage.setItem('activeChallenge', JSON.stringify({
      id: challenge.id,
      requirement: challenge.requirement,
      requirementType: challenge.requirementType,
      description: challenge.description,
      xp: challenge.xp,
      reward: challenge.reward,
      difficulty: challenge.difficulty || 'medium'
    }));
    
    // Create direct navigation based on game type and available routes
    const gameType = challenge.game?.type || 'unknown';
    const gameId = challenge.game?.id;
    const difficulty = challenge.difficulty || 'medium';
    
    // Map game types to their route patterns (based on App.jsx routes)
    const gameRoutes = {
      'memory': `/games/memory/${gameId}`,
      'word': `/games/word/${gameId}`,
      'pattern': `/games/pattern/${gameId}`,
      'math': `/games/math/${gameId}`,
      'reaction': `/games/reaction/${gameId}`,
      'reflex': `/games/reflex/${gameId}`, // Alternative route for reaction
      'snake': `/games/snake/${gameId}`,
      'sequence': `/games/sequence/${gameId}`
    };
    
    // Get the route for this game type
    let gamePath = gameRoutes[gameType];
    
    if (gamePath) {
      // Navigate to the specific game with challenge and difficulty parameters
      const fullPath = `${gamePath}?challenge=${challenge.id}&difficulty=${difficulty}&mode=challenge`;
      console.log('Navigating to challenge:', fullPath);
      navigate(fullPath);
    } else {
      // Fallback: try exercise navigation system
      const exerciseMapping = Object.entries(EXERCISE_GAME_MAPPING).find(
        ([name, mapping]) => mapping.gameTypePref === gameType || mapping.gameNamePref === challenge.game.name
      );
      
      if (exerciseMapping) {
        const [exerciseName] = exerciseMapping;
        navigateToExercise(exerciseName, difficulty, availableGames, {
          source: 'daily-challenges',
          challengeData: challenge,
          returnPath: '/patient-journey'
        });
      } else {
        // Final fallback: navigate to games page
        console.warn(`No route found for game type: ${gameType}, navigating to games page`);
        navigate('/games');
      }
    }
  };
  
  // Handle completing a challenge (this should be called from games when they finish)
  const handleCompleteChallenge = (challengeId, gameResults = null) => {
    // Use mock results for demo if no real results provided
    const mockResults = gameResults || {
      score: Math.floor(Math.random() * 500) + 600,
      duration: Math.floor(Math.random() * 300) + 120,
      errors: Math.floor(Math.random() * 3),
      streak: Math.floor(Math.random() * 10) + 5
    };
    
    // Update challenge progress using tracker
    const updatedChallenges = challengeTracker.updateChallengeProgress(challengeId, mockResults);
    setTodaysChallenges(updatedChallenges);
    
    // Update streak display
    const stats = challengeTracker.getChallengeStats();
    setStreak(stats.streak);
    setLastCompletedDate(new Date().toISOString().split('T')[0]);
    
    // Show completion animation
    setShowCompletionAnimation(true);
    setTimeout(() => setShowCompletionAnimation(false), 3000);
  };
  
  // Calculate progress for today's challenges
  const getOverallProgress = () => {
    if (!todaysChallenges.length) return 0;
    
    const completedCount = todaysChallenges.filter(c => c.completed).length;
    return Math.round((completedCount / todaysChallenges.length) * 100);
  };
  
  // Check if all challenges are completed
  const allChallengesCompleted = todaysChallenges.length > 0 && todaysChallenges.every(c => c.completed);
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Daily Challenges
          </Typography>
          
          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            onClick={handleRefreshChallenges}
          >
            Refresh Challenges
          </Button>
        </Box>
        
        {/* Progress bar and streak */}
        <Paper
          sx={{
            p: 3,
            mb: 4,
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
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">Today's Progress</Typography>
                  <Typography variant="body2">
                    {todaysChallenges.filter(c => c.completed).length}/{todaysChallenges.length} Completed
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={getOverallProgress()} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: allChallengesCompleted 
                        ? 'linear-gradient(90deg, #00E676, #00E5FF)' 
                        : undefined,
                    }
                  }}
                />
              </Box>
              
              {allChallengesCompleted && (
                <Chip 
                  icon={<StarIcon />}
                  label="All challenges completed! Come back tomorrow for new challenges." 
                  color="success"
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: { xs: 'center', md: 'flex-end' },
                }}
              >
                <StreakIcon 
                  sx={{ 
                    fontSize: 32, 
                    color: 'orange',
                    mr: 1,
                  }} 
                />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {streak} Day{streak !== 1 ? 's' : ''} Streak
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lastCompletedDate
                      ? `Last completed: ${new Date(lastCompletedDate).toLocaleDateString()}`
                      : 'Start your streak today!'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Daily Challenge Info */}
        {todaysChallenges.length > 0 && (
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
            icon={<TodayIcon />}
          >
            <strong>Today's Challenges Ready!</strong> Complete {todaysChallenges.length} challenges covering all available games. 
            Each game type offers unique cognitive benefits.
          </Alert>
        )}
        
        {/* Challenge cards */}
        <Grid container spacing={3}>
          {todaysChallenges.map((challenge, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={challenge.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    background: challenge.completed
                      ? 'linear-gradient(135deg, rgba(0, 230, 118, 0.1) 0%, rgba(0, 230, 118, 0.05) 100%)'
                      : undefined,
                    border: challenge.completed
                      ? '1px solid rgba(0, 230, 118, 0.3)'
                      : undefined,
                  }}
                >
                  {challenge.completed && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        zIndex: 1,
                      }}
                    >
                      <CompletedIcon 
                        sx={{ 
                          color: 'success.main',
                          fontSize: 28,
                        }} 
                      />
                    </Box>
                  )}
                  
                  <CardHeader
                    avatar={
                      <Avatar
                        sx={{
                          bgcolor: index === 0 
                            ? 'primary.main' 
                            : index === 1 
                              ? 'secondary.main' 
                              : 'success.main',
                        }}
                      >
                        {getGameInitial(challenge.game?.name)}
                      </Avatar>
                    }
                    title={challenge.game?.name || 'Unknown Game'}
                    subheader={`+${challenge.xp || 0} XP • ${(challenge.difficulty || 'medium').charAt(0).toUpperCase() + (challenge.difficulty || 'medium').slice(1)} Difficulty`}
                    action={
                      <Chip 
                        icon={getRewardIcon(challenge.reward)} 
                        label={getRewardLabel(challenge.reward)}
                        size="small"
                        color={getRewardColor(challenge.reward)}
                        sx={{ mt: 1 }}
                      />
                    }
                  />
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" paragraph>
                      {challenge.description}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {challenge.progress}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={challenge.progress} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                        }}
                      />
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    {/* For demo purposes, add a button to simulate challenge completion */}
                    {!challenge.completed && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        fullWidth
                        onClick={() => handleCompleteChallenge(challenge.id)}
                        sx={{ mb: 1 }}
                      >
                        Simulate Completion
                      </Button>
                    )}
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={challenge.completed ? <CompletedIcon /> : <PlayIcon />}
                      onClick={() => handleStartChallenge(challenge)}
                      disabled={challenge.completed}
                    >
                      {challenge.completed ? 'Completed' : 'Start Challenge'}
                    </Button>
                  </CardActions>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
        
        {/* Completion animation overlay */}
        <AnimatePresence>
          {showCompletionAnimation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                zIndex: 1000,
              }}
            >
              <motion.div
                initial={{ scale: 0.5, y: 100 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    maxWidth: 500,
                    background: 'rgba(19, 47, 76, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 4,
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <StarIcon sx={{ fontSize: 80, color: '#FFD700', mb: 2 }} />
                  </motion.div>
                  
                  <Typography variant="h4" sx={{ mb: 2, color: 'white' }}>
                    Challenge Completed!
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.8)' }}>
                    Great job! You've earned XP and rewards. Keep up the good work!
                  </Typography>
                  
                  <Chip 
                    icon={<StreakIcon />} 
                    label={`${streak} Day Streak!`} 
                    color="primary"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Paper>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Container>
  );
};

// Helper function to get the first letter of a game name
const getGameInitial = (name) => {
  return (name || 'G').charAt(0).toUpperCase();
};

// Helper function to get icon for reward type
const getRewardIcon = (reward) => {
  switch (reward) {
    case 'coins':
      return <StarIcon fontSize="small" />;
    case 'powerup':
      return <StreakIcon fontSize="small" />;
    case 'badge':
      return <TrophyIcon fontSize="small" />;
    default:
      return <StarIcon fontSize="small" />;
  }
};

// Helper function to get label for reward type
const getRewardLabel = (reward) => {
  switch (reward) {
    case 'coins':
      return 'Coins';
    case 'powerup':
      return 'Power-up';
    case 'badge':
      return 'Badge';
    default:
      return 'Reward';
  }
};

// Helper function to get color for reward type
const getRewardColor = (reward) => {
  switch (reward) {
    case 'coins':
      return 'primary';
    case 'powerup':
      return 'secondary';
    case 'badge':
      return 'success';
    default:
      return 'default';
  }
};

export default DailyChallenges; 