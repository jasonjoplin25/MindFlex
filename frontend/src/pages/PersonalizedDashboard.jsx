import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
  Chip,
  useTheme,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  Favorite as HeartIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAchievements, getUserAchievements, getUserProgress } from '../services/achievementService';
import { getGames } from '../services/gameService';
import AchievementCard from '../components/achievements/AchievementCard';

// Component for Game Recommendations
const GameRecommendation = ({ game, reason, onClick }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: theme => theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, rgba(19, 47, 76, 0.9) 0%, rgba(10, 25, 41, 0.9) 100%)'
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 245, 245, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          overflow: 'hidden',
          border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        }}
      >
        <Box
          sx={{
            p: 2,
            background: theme => `linear-gradient(145deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              background: 'radial-gradient(circle at top right, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Typography variant="h6" component="div">
            {game.name}
          </Typography>

          <Box sx={{ display: 'flex', mt: 1 }}>
            {reason === 'new' && (
              <Chip 
                icon={<StarIcon fontSize="small" />} 
                label="New for You" 
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.2)', 
                  color: 'white',
                  fontWeight: 'medium',
                }} 
              />
            )}
            {reason === 'recommended' && (
              <Chip 
                icon={<TrendingUpIcon fontSize="small" />} 
                label="Recommended" 
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.2)', 
                  color: 'white',
                  fontWeight: 'medium', 
                }} 
              />
            )}
            {reason === 'favorite' && (
              <Chip 
                icon={<HeartIcon fontSize="small" />} 
                label="Your Favorite" 
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.2)', 
                  color: 'white',
                  fontWeight: 'medium', 
                }} 
              />
            )}
            {reason === 'practice' && (
              <Chip 
                icon={<ScheduleIcon fontSize="small" />} 
                label="Needs Practice" 
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.2)', 
                  color: 'white',
                  fontWeight: 'medium', 
                }} 
              />
            )}
          </Box>
        </Box>
        
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {game.description}
          </Typography>
          
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {game.difficulty_levels.map(level => (
              <Chip 
                key={level}
                label={level} 
                size="small" 
                variant="outlined"
              />
            ))}
          </Box>
        </CardContent>
        
        <CardActions>
          <Button 
            fullWidth 
            color="primary" 
            variant="contained" 
            startIcon={<PlayIcon />}
            onClick={onClick}
          >
            Play Now
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );
};

const PersonalizedDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState([]);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState({
    totalPoints: 0,
    totalGamesPlayed: 0,
    favoriteGame: null,
    streak: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get games
        const { data: gamesData } = await getGames();
        
        // Get achievements
        const { data: allAchievements } = await getAchievements();
        const { data: earnedAchievements } = await getUserAchievements(user?.id || 'mock-user-id');
        const { data: progressData } = await getUserProgress(user?.id || 'mock-user-id');
        
        // Calculate total points
        const userAchievements = (earnedAchievements || []).map(ua => {
          const achievement = (allAchievements || []).find(a => a.id === ua.achievement_id);
          return {
            ...ua,
            ...achievement,
          };
        }).filter(Boolean);
        
        // Get only recently earned achievements (last 3)
        const recent = [...userAchievements]
          .sort((a, b) => new Date(b.earned_at) - new Date(a.earned_at))
          .slice(0, 3);
        
        // Generate recommendations based on user progress
        const gameRecommendations = generateRecommendations(gamesData, progressData);
        
        // Set states
        setGames(gamesData);
        setRecentAchievements(recent);
        setUserProgress(progressData);
        setRecommendations(gameRecommendations);
        setStats({
          totalPoints: userAchievements.reduce((sum, a) => sum + a.points, 0),
          totalGamesPlayed: progressData?.total_games || 0,
          favoriteGame: determineUserFavoriteGame(gamesData, progressData),
          streak: progressData?.consecutive_days || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Determine user's favorite game based on play count
  const determineUserFavoriteGame = (games, progress) => {
    if (!games?.length || !progress?.games_by_type) return null;
    
    // Find the game type with the most plays
    const gameTypes = progress.games_by_type;
    const mostPlayedType = Object.keys(gameTypes).reduce((a, b) => 
      gameTypes[a] > gameTypes[b] ? a : b, Object.keys(gameTypes)[0]
    );
    
    // Find the game object that matches the most played type
    return games.find(game => game.type === mostPlayedType) || games[0];
  };
  
  // Generate personalized game recommendations
  const generateRecommendations = (games, progress) => {
    if (!games.length) return [];
    
    const recommendations = [];
    
    // Add favorite game (if any)
    const favoriteGame = games[0]; // Mock - first game is favorite
    if (favoriteGame) {
      recommendations.push({
        game: favoriteGame,
        reason: 'favorite',
      });
    }
    
    // Add a game that needs practice (one with lowest score)
    const practiceGame = games[1]; // Mock - second game needs practice
    if (practiceGame) {
      recommendations.push({
        game: practiceGame,
        reason: 'practice',
      });
    }
    
    // Add a new game they haven't played much
    const newGame = games[2]; // Mock - third game is new
    if (newGame) {
      recommendations.push({
        game: newGame,
        reason: 'new',
      });
    }
    
    // If we have less than 3 recommendations, add more games
    while (recommendations.length < 3 && recommendations.length < games.length) {
      const remainingGames = games.filter(game => 
        !recommendations.some(rec => rec.game.id === game.id)
      );
      
      if (remainingGames.length === 0) break;
      
      recommendations.push({
        game: remainingGames[0],
        reason: 'recommended',
      });
    }
    
    return recommendations;
  };
  
  const handlePlayGame = (game) => {
    navigate(`/games/${game.type}/${game.id}`);
  };
  
  const handleViewAllAchievements = () => {
    navigate('/achievements');
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
        <Typography variant="h4" component="h1" gutterBottom>
          Your Dashboard
        </Typography>
        
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Paper
                sx={{
                  p: 3,
                  background: theme => theme.palette.mode === 'dark'
                    ? 'rgba(19, 47, 76, 0.4)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrophyIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Achievement Points</Typography>
                    <Typography variant="h5" color="primary.main">{stats.totalPoints}</Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Paper
                sx={{
                  p: 3,
                  background: theme => theme.palette.mode === 'dark'
                    ? 'rgba(19, 47, 76, 0.4)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PlayIcon sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Games Played</Typography>
                    <Typography variant="h5" color="secondary.main">{stats.totalGamesPlayed}</Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Paper
                sx={{
                  p: 3,
                  background: theme => theme.palette.mode === 'dark'
                    ? 'rgba(19, 47, 76, 0.4)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <HeartIcon sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Favorite Game</Typography>
                    <Typography variant="h5" color="error.main">
                      {stats.favoriteGame ? stats.favoriteGame.name : 'None'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Paper
                sx={{
                  p: 3,
                  background: theme => theme.palette.mode === 'dark'
                    ? 'rgba(19, 47, 76, 0.4)'
                    : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Daily Streak</Typography>
                    <Typography variant="h5" color="success.main">{stats.streak} days</Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
        
        {/* Recommended Games */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" gutterBottom>
            Recommended for You
          </Typography>
          <Grid container spacing={3}>
            {recommendations.map((recommendation, index) => (
              <Grid item xs={12} sm={6} md={4} key={`${recommendation.game.id}-${index}`}>
                <GameRecommendation
                  game={recommendation.game}
                  reason={recommendation.reason}
                  onClick={() => handlePlayGame(recommendation.game)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
        
        {/* Recent Achievements */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Recent Achievements
            </Typography>
            <Button 
              variant="outlined" 
              onClick={handleViewAllAchievements}
              endIcon={<TrophyIcon />}
            >
              View All
            </Button>
          </Box>
          
          {recentAchievements.length > 0 ? (
            <Grid container spacing={3}>
              {recentAchievements.map((achievement) => (
                <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                  <AchievementCard 
                    achievement={achievement} 
                    earned={true}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                background: theme => theme.palette.mode === 'dark'
                  ? 'rgba(19, 47, 76, 0.4)'
                  : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              }}
            >
              <Typography variant="h6" gutterBottom>
                No achievements yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start playing games to earn achievements and unlock rewards!
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/')}
                sx={{ mt: 2 }}
              >
                Play Games
              </Button>
            </Paper>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default PersonalizedDashboard; 