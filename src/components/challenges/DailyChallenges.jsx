import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  IconButton,
  Chip,
  Divider,
  LinearProgress,
  CircularProgress,
  Avatar,
  Badge,
  Tooltip,
  Alert,
  useTheme,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Refresh as RefreshIcon,
  FlashOn as FlashOnIcon,
  Schedule as ScheduleIcon,
  TrendingUp as StreakIcon,
  CheckCircle as CompletedIcon,
  LocalFireDepartment as FireIcon,
  PlayArrow as PlayIcon,
  Lock as LockIcon,
  Psychology as BrainIcon,
  StarRate as StarIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Visibility as VisibilityIcon,
  DoNotDisturb as DoNotDisturbIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data for available games
const games = [
  {
    id: 'game-1',
    name: 'Memory Match',
    description: 'Test your visual memory by matching pairs of cards',
    thumbnail: 'memory-match.jpg',
    category: 'memory',
    color: '#4CAF50',
    difficulty: 'Easy',
    defaultRequirement: 500, // Default score requirement
  },
  {
    id: 'game-2',
    name: 'Sequence Memory',
    description: 'Remember and repeat increasingly complex sequences',
    thumbnail: 'sequence-memory.jpg',
    category: 'memory',
    color: '#4CAF50',
    difficulty: 'Medium',
    defaultRequirement: 600,
  },
  {
    id: 'game-3',
    name: 'Word Recall',
    description: 'Memorize and recall lists of words under time pressure',
    thumbnail: 'word-recall.jpg',
    category: 'memory',
    color: '#4CAF50',
    difficulty: 'Hard',
    defaultRequirement: 700,
  },
  {
    id: 'game-4',
    name: 'Focus Filter',
    description: 'Filter out distractions and focus on specific targets',
    thumbnail: 'focus-filter.jpg',
    category: 'attention',
    color: '#2196F3',
    difficulty: 'Medium',
    defaultRequirement: 45, // Default time requirement (seconds)
  },
  {
    id: 'game-5',
    name: 'Quick React',
    description: 'React as quickly as possible to visual and audio cues',
    thumbnail: 'quick-react.jpg',
    category: 'processingSpeed',
    color: '#FF9800',
    difficulty: 'Easy',
    defaultRequirement: 30, // Default time requirement (seconds)
  },
  {
    id: 'game-6',
    name: 'Logic Puzzles',
    description: 'Solve logic-based puzzles of increasing complexity',
    thumbnail: 'logic-puzzles.jpg',
    category: 'reasoning',
    color: '#9C27B0',
    difficulty: 'Hard',
    defaultRequirement: 3, // Default streak requirement
  },
];

// Function to generate daily challenges
const generateDailyChallenges = () => {
  // Select 3 random games
  const shuffledGames = [...games].sort(() => 0.5 - Math.random());
  const selectedGames = shuffledGames.slice(0, 3);
  
  // Types of challenges
  const challengeTypes = ['score', 'time', 'streak'];
  
  // Generate challenges
  return selectedGames.map((game, index) => {
    // Randomly select challenge type
    const challengeType = challengeTypes[index % challengeTypes.length];
    
    // Determine the requirement based on challenge type
    let requirement;
    let requirementLabel;
    
    switch (challengeType) {
      case 'score':
        requirement = game.defaultRequirement;
        requirementLabel = `Score ${requirement} points`;
        break;
      case 'time':
        requirement = game.defaultRequirement;
        requirementLabel = `Complete in ${requirement} seconds`;
        break;
      case 'streak':
        requirement = game.defaultRequirement;
        requirementLabel = `Achieve a ${requirement}x streak`;
        break;
      default:
        requirement = game.defaultRequirement;
        requirementLabel = `Score ${requirement} points`;
    }
    
    return {
      id: `challenge-${Date.now()}-${index}`,
      game,
      type: challengeType,
      requirement,
      requirementLabel,
      completed: false,
      progress: 0,
      points: calculatePoints(game.difficulty, challengeType),
    };
  });
};

// Calculate points based on difficulty and challenge type
const calculatePoints = (difficulty, type) => {
  const difficultyMultiplier = {
    'Easy': 1,
    'Medium': 1.5,
    'Hard': 2,
  };
  
  const typeMultiplier = {
    'score': 1,
    'time': 1.2,
    'streak': 1.5,
  };
  
  const basePoints = 100;
  return Math.round(basePoints * difficultyMultiplier[difficulty] * typeMultiplier[type]);
};

// Component for challenge card
const ChallengeCard = ({ challenge, onStartChallenge, onRefresh, showRefresh }) => {
  const theme = useTheme();
  const { game, type, requirementLabel, completed, progress, points } = challenge;
  
  // Get appropriate icon for challenge type
  const getChallengeIcon = () => {
    switch (type) {
      case 'score':
        return <TrophyIcon />;
      case 'time':
        return <ScheduleIcon />;
      case 'streak':
        return <FlashOnIcon />;
      default:
        return <TrophyIcon />;
    }
  };
  
  return (
    <Card 
      variant="outlined"
      component={motion.div}
      whileHover={{ y: -5, boxShadow: theme.shadows[4] }}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Points badge */}
      <Box
        sx={{
          position: 'absolute',
          top: -10,
          right: -10,
          bgcolor: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
          borderRadius: '50%',
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: theme.shadows[2],
          zIndex: 1,
          border: `2px solid ${theme.palette.background.paper}`,
          fontSize: 14,
          fontWeight: 'bold',
        }}
      >
        +{points}
      </Box>
      
      {/* Completion badge */}
      {completed && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            borderRadius: '50%',
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <CompletedIcon fontSize="large" />
        </Box>
      )}
      
      {/* Game thumbnail (placeholder) */}
      <Box
        sx={{
          position: 'relative',
          height: 140,
          backgroundColor: game.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BrainIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.3)' }} />
        <Typography 
          variant="h6" 
          component="div"
          sx={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0,
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            p: 1,
          }}
        >
          {game.name}
        </Typography>
      </Box>
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Chip 
            icon={getChallengeIcon()} 
            label={type.charAt(0).toUpperCase() + type.slice(1)} 
            size="small"
            sx={{ 
              bgcolor: `${game.color}20`, 
              color: game.color,
              '& .MuiChip-icon': { color: game.color },
            }}
          />
          <Box sx={{ ml: 'auto' }}>
            <Chip
              label={game.difficulty}
              size="small"
              color={
                game.difficulty === 'Easy' ? 'success' :
                game.difficulty === 'Medium' ? 'primary' : 'error'
              }
            />
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {game.description}
        </Typography>
        
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Challenge: {requirementLabel}
          </Typography>
          
          {!completed && (
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 6, 
                borderRadius: 1,
                bgcolor: `${game.color}20`,
                '& .MuiLinearProgress-bar': {
                  bgcolor: game.color,
                }
              }} 
            />
          )}
        </Box>
      </CardContent>
      
      <CardActions sx={{ p: 2, pt: 0 }}>
        {showRefresh ? (
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => onRefresh(challenge.id)}
            fullWidth
          >
            Refresh Challenge
          </Button>
        ) : (
          <Button
            variant="contained"
            size="small"
            startIcon={completed ? <VisibilityIcon /> : <PlayIcon />}
            onClick={() => onStartChallenge(challenge)}
            fullWidth
            color={completed ? "secondary" : "primary"}
            sx={{
              bgcolor: completed ? theme.palette.success.main : null,
              '&:hover': {
                bgcolor: completed ? theme.palette.success.dark : null,
              }
            }}
          >
            {completed ? "View Results" : "Start Challenge"}
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

// Component for completion celebration
const CompletionCelebration = ({ visible, points }) => {
  if (!visible) return null;
  
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1300,
      }}
    >
      <Box
        component={motion.div}
        initial={{ y: -50 }}
        animate={{ y: [0, -20, 0], transition: { repeat: Infinity, duration: 1.5 } }}
      >
        <TrophyIcon sx={{ fontSize: 100, color: 'gold', mb: 2 }} />
      </Box>
      
      <Typography 
        variant="h4" 
        color="white"
        component={motion.h4}
        initial={{ scale: 0.5 }}
        animate={{ scale: [1, 1.1, 1], transition: { duration: 0.5 } }}
        sx={{ mb: 2, textAlign: 'center' }}
      >
        Challenge Completed!
      </Typography>
      
      <Typography 
        variant="h5" 
        color="white"
        component={motion.h5}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.3 } }}
        sx={{ textAlign: 'center' }}
      >
        You earned <span style={{ color: 'gold', fontWeight: 'bold' }}>+{points}</span> points
      </Typography>
    </Box>
  );
};

// Main DailyChallenges component
const DailyChallenges = ({ patient }) => {
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState([]);
  const [streak, setStreak] = useState(0);
  const [lastCompleted, setLastCompleted] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedPoints, setCompletedPoints] = useState(0);
  
  // Load or generate challenges on component mount
  useEffect(() => {
    setLoading(true);
    
    // Check localStorage for today's challenges
    const today = new Date().toISOString().split('T')[0];
    const storedChallenges = localStorage.getItem('dailyChallenges');
    const storedChallengesDate = localStorage.getItem('dailyChallengesDate');
    const storedStreak = localStorage.getItem('challengeStreak');
    const storedLastCompleted = localStorage.getItem('lastChallengeCompleted');
    
    // Set streak and last completed date
    if (storedStreak) {
      setStreak(parseInt(storedStreak, 10));
    }
    
    if (storedLastCompleted) {
      setLastCompleted(storedLastCompleted);
    }
    
    // Check if challenges are from today
    if (storedChallenges && storedChallengesDate === today) {
      setChallenges(JSON.parse(storedChallenges));
    } else {
      // Generate new challenges
      const newChallenges = generateDailyChallenges();
      setChallenges(newChallenges);
      
      // Store in localStorage
      localStorage.setItem('dailyChallenges', JSON.stringify(newChallenges));
      localStorage.setItem('dailyChallengesDate', today);
    }
    
    // Check streak continuity
    if (storedLastCompleted) {
      const lastCompletedDate = new Date(storedLastCompleted);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // If last completed is before yesterday, reset streak
      if (lastCompletedDate < new Date(yesterday.toISOString().split('T')[0])) {
        setStreak(0);
        localStorage.setItem('challengeStreak', '0');
      }
    }
    
    setLoading(false);
  }, []);
  
  // Save challenges to localStorage
  const saveChallenges = (updatedChallenges) => {
    localStorage.setItem('dailyChallenges', JSON.stringify(updatedChallenges));
  };
  
  // Handle starting a challenge
  const handleStartChallenge = (challenge) => {
    if (challenge.completed) {
      // In a real app, this would show results or details
      alert(`You've already completed this challenge! You scored ${challenge.progress}% of the requirement.`);
      return;
    }
    
    // In a real app, this would launch the game
    // For now, we'll simulate completing the challenge
    simulateChallenge(challenge);
  };
  
  // Simulate completing a challenge
  const simulateChallenge = (challenge) => {
    // Simulate random progress (70-100% to guarantee completion for demo)
    const randomProgress = Math.floor(Math.random() * 31) + 70;
    
    // Update the challenge
    const updatedChallenges = challenges.map(c => {
      if (c.id === challenge.id) {
        return {
          ...c,
          completed: true,
          progress: randomProgress,
        };
      }
      return c;
    });
    
    setChallenges(updatedChallenges);
    saveChallenges(updatedChallenges);
    
    // Show celebration
    setCompletedPoints(challenge.points);
    setShowCelebration(true);
    
    // Hide celebration after 3 seconds
    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
    
    // Update streak
    const today = new Date().toISOString().split('T')[0];
    
    if (lastCompleted !== today) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setLastCompleted(today);
      
      localStorage.setItem('challengeStreak', newStreak.toString());
      localStorage.setItem('lastChallengeCompleted', today);
    }
  };
  
  // Handle refreshing a challenge
  const handleRefreshChallenge = (challengeId) => {
    // Find the challenge
    const challengeIndex = challenges.findIndex(c => c.id === challengeId);
    if (challengeIndex === -1) return;
    
    // Get a new random game (different from current ones)
    const currentGameIds = challenges.map(c => c.game.id);
    const availableGames = games.filter(g => !currentGameIds.includes(g.id));
    
    if (availableGames.length === 0) {
      alert('No more games available to refresh with!');
      return;
    }
    
    const randomGame = availableGames[Math.floor(Math.random() * availableGames.length)];
    
    // Keep the same challenge type but update the game
    const oldChallenge = challenges[challengeIndex];
    const newChallenge = {
      ...oldChallenge,
      id: `challenge-${Date.now()}-${challengeIndex}`,
      game: randomGame,
      requirement: randomGame.defaultRequirement,
      requirementLabel: getRequirementLabel(oldChallenge.type, randomGame.defaultRequirement),
      completed: false,
      progress: 0,
      points: calculatePoints(randomGame.difficulty, oldChallenge.type),
    };
    
    // Update challenges
    const updatedChallenges = [...challenges];
    updatedChallenges[challengeIndex] = newChallenge;
    
    setChallenges(updatedChallenges);
    saveChallenges(updatedChallenges);
  };
  
  // Helper function to get requirement label
  const getRequirementLabel = (type, requirement) => {
    switch (type) {
      case 'score':
        return `Score ${requirement} points`;
      case 'time':
        return `Complete in ${requirement} seconds`;
      case 'streak':
        return `Achieve a ${requirement}x streak`;
      default:
        return `Score ${requirement} points`;
    }
  };
  
  // Calculate total daily progress
  const calculateProgress = () => {
    if (challenges.length === 0) return 0;
    
    const completed = challenges.filter(c => c.completed).length;
    return Math.round((completed / challenges.length) * 100);
  };
  
  const totalProgress = calculateProgress();
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Daily Challenges</Typography>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            const newChallenges = generateDailyChallenges();
            setChallenges(newChallenges);
            saveChallenges(newChallenges);
          }}
        >
          New Challenges
        </Button>
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
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  bgcolor: streak > 0 ? 'primary.main' : 'action.disabledBackground',
                  color: streak > 0 ? 'white' : 'text.disabled',
                  borderRadius: '50%',
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                }}
              >
                <FireIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h6">
                  {streak} Day{streak !== 1 ? 's' : ''} Streak
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {streak > 0 
                    ? `You've completed challenges ${streak} day${streak !== 1 ? 's' : ''} in a row!` 
                    : 'Complete a challenge to start your streak!'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Daily Progress: {totalProgress}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={totalProgress} 
                sx={{ height: 10, borderRadius: 5 }} 
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {challenges.filter(c => c.completed).length} of {challenges.length} challenges completed
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {challenges.map((challenge, index) => (
              <Grid item xs={12} sm={6} md={4} key={challenge.id}>
                <ChallengeCard 
                  challenge={challenge}
                  onStartChallenge={handleStartChallenge}
                  onRefresh={handleRefreshChallenge}
                  showRefresh={challenge.completed && index < 2} // Allow refreshing completed challenges
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      
      {/* Completion celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <CompletionCelebration visible={showCelebration} points={completedPoints} />
        )}
      </AnimatePresence>
    </Box>
  );
};

export default DailyChallenges; 