import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  CheckCircle as CompletedIcon,
  HourglassEmpty as InProgressIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import AchievementCard from './AchievementCard';
import { getAchievements, getUserAchievements, getUserProgress } from '../../services/achievementService';

const AchievementsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [userProgress, setUserProgress] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get all achievement definitions
        const { data: allAchievements } = await getAchievements();
        
        // Get user's earned achievements and progress
        const { data: earnedAchievements } = await getUserAchievements(user?.id || 'mock-user-id');
        const { data: progressData } = await getUserProgress(user?.id || 'mock-user-id');
        
        setAchievements(allAchievements || []);
        setUserAchievements(earnedAchievements || []);
        setUserProgress(progressData || {});
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Calculate total points and percentage of achievements earned
  const totalPoints = Array.isArray(achievements) ? achievements.reduce((sum, achievement) => sum + (achievement.points || 0), 0) : 0;
  const earnedPoints = Array.isArray(userAchievements) ? userAchievements
    .reduce((sum, achievement) => sum + (achievement.points || 0), 0) : 0;
  
  const completionPercentage = Array.isArray(achievements) && achievements.length 
    ? Math.round((Array.isArray(userAchievements) ? userAchievements.length : 0) / achievements.length * 100) 
    : 0;
  
  // Filter achievements based on active tab
  const filteredAchievements = Array.isArray(achievements) ? achievements.filter(achievement => {
    if (activeTab === 'all') return true;
    if (activeTab === 'earned') {
      return Array.isArray(userAchievements) ? userAchievements.some(ua => ua.id === achievement.id) : false;
    }
    if (activeTab === 'unearned') {
      return Array.isArray(userAchievements) ? !userAchievements.some(ua => ua.id === achievement.id) : true;
    }
    return achievement.badge_level === activeTab;
  }) : [];
  
  // Get unique categories for category tabs (based on badge levels since achievements don't have categories)
  const categories = Array.isArray(achievements) ? [...new Set(achievements.map(a => a.badge_level).filter(Boolean))] : [];

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
          Achievements
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
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
                    <Typography variant="h6">Total Points</Typography>
                    <Typography variant="h4" color="primary">
                      {earnedPoints} / {totalPoints}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} md={4}>
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
                  <CompletedIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Completion</Typography>
                    <Typography variant="h4" color="success.main">
                      {completionPercentage}%
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} md={4}>
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
                  <CategoryIcon sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Categories</Typography>
                    <Typography variant="h4" color="secondary">
                      {categories.length}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
        
        <Paper
          sx={{
            background: theme => theme.palette.mode === 'dark'
              ? 'rgba(19, 47, 76, 0.4)'
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            mb: 3,
            border: theme => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<Box display="flex" alignItems="center">
                All <Chip label={Array.isArray(achievements) ? achievements.length : 0} size="small" sx={{ ml: 1 }} />
              </Box>}
              value="all"
            />
            <Tab 
              icon={<Box display="flex" alignItems="center">
                <CompletedIcon fontSize="small" sx={{ mr: 0.5 }} />
                Earned <Chip label={Array.isArray(userAchievements) ? userAchievements.length : 0} size="small" sx={{ ml: 1 }} />
              </Box>}
              value="earned"
            />
            <Tab 
              icon={<Box display="flex" alignItems="center">
                <InProgressIcon fontSize="small" sx={{ mr: 0.5 }} />
                In Progress <Chip label={(Array.isArray(achievements) ? achievements.length : 0) - (Array.isArray(userAchievements) ? userAchievements.length : 0)} size="small" sx={{ ml: 1 }} />
              </Box>}
              value="unearned"
            />
            
            {/* Category tabs */}
            {categories.map(category => (
              <Tab 
                key={category}
                label={category.charAt(0).toUpperCase() + category.slice(1)} 
                value={category} 
              />
            ))}
          </Tabs>
        </Paper>
        
        <Grid container spacing={3}>
          {filteredAchievements.map(achievement => {
            const isEarned = Array.isArray(userAchievements) ? userAchievements.some(ua => ua.id === achievement.id) : false;
            
            // Calculate progress percentage for unearned achievements
            let progressPercentage = 0;
            if (!isEarned && userProgress && achievement.criteria) {
              const criteria = achievement.criteria;
              
              // Map achievement criteria to actual user stats
              if (criteria.total_games || criteria.games_completed) {
                const target = criteria.total_games || criteria.games_completed;
                progressPercentage = Math.min(100, Math.round((userProgress.total_games || 0) / target * 100));
              } else if (criteria.memory_games_completed) {
                progressPercentage = Math.min(100, Math.round((userProgress.memory_games_completed || 0) / criteria.memory_games_completed * 100));
              } else if (criteria.word_games_completed) {
                progressPercentage = Math.min(100, Math.round((userProgress.word_games_completed || 0) / criteria.word_games_completed * 100));
              } else if (criteria.reaction_games_completed) {
                progressPercentage = Math.min(100, Math.round((userProgress.reaction_games_completed || 0) / criteria.reaction_games_completed * 100));
              } else if (criteria.math_games_completed) {
                progressPercentage = Math.min(100, Math.round((userProgress.math_games_completed || 0) / criteria.math_games_completed * 100));
              } else if (criteria.pattern_games_completed) {
                progressPercentage = Math.min(100, Math.round((userProgress.pattern_games_completed || 0) / criteria.pattern_games_completed * 100));
              } else if (criteria.max_score) {
                progressPercentage = Math.min(100, Math.round((userProgress.max_score || 0) / criteria.max_score * 100));
              } else if (criteria.min_score_percent) {
                // Use actual best score percentage if available, otherwise estimate
                const bestScorePercent = userProgress.best_score_percent || 0;
                if (bestScorePercent > 0) {
                  progressPercentage = Math.min(100, Math.round(bestScorePercent / criteria.min_score_percent * 100));
                } else {
                  // Fallback estimation for when max_possible_score isn't set in game sessions
                  const bestScore = Math.max(...Object.values(userProgress.best_scores || {}).map(s => s.score || 0), 0);
                  const estimatedPercent = Math.min(100, bestScore / 20); // more conservative estimation
                  progressPercentage = Math.min(100, Math.round(estimatedPercent / criteria.min_score_percent * 100));
                }
              } else if (criteria.perfect_games) {
                progressPercentage = Math.min(100, Math.round((userProgress.perfect_games || 0) / criteria.perfect_games * 100));
              } else if (criteria.consecutive_days) {
                progressPercentage = Math.min(100, Math.round((userProgress.consecutive_days || 0) / criteria.consecutive_days * 100));
              } else {
                // Fallback for other criteria
                const criteriaKey = Object.keys(criteria)[0];
                const requiredValue = criteria[criteriaKey];
                const currentValue = userProgress[criteriaKey] || 0;
                progressPercentage = Math.min(100, Math.round(currentValue / requiredValue * 100));
              }
            }
            
            return (
              <Grid item key={achievement.id} xs={12} sm={6} md={4}>
                <AchievementCard 
                  achievement={achievement} 
                  earned={isEarned}
                  progress={progressPercentage}
                />
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Container>
  );
};

export default AchievementsPage; 