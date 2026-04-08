import React from 'react';
import { Paper, Box, Typography, Tooltip, Chip } from '@mui/material';
import { motion } from 'framer-motion';

const AchievementCard = ({ achievement, earned, progress }) => {
  const isEarned = earned || false;
  const progressValue = progress ? Math.min(progress, 100) : 0;
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          p: 2,
          borderRadius: 2,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          background: theme => 
            isEarned 
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
              : theme.palette.mode === 'dark'
                ? 'rgba(19, 47, 76, 0.4)'
                : 'rgba(255, 255, 255, 0.8)',
          border: theme => 
            isEarned 
              ? `1px solid ${theme.palette.primary.light}`
              : `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          boxShadow: theme => 
            isEarned 
              ? `0 8px 16px -2px ${theme.palette.primary.main}40`
              : 'none',
          display: 'flex',
          flexDirection: 'column',
          '&::after': isEarned ? {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          } : {},
        }}
      >
        {!isEarned && progressValue > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: 3,
              width: `${progressValue}%`,
              background: theme => `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              borderRadius: 2,
              transition: 'width 0.5s ease-in-out',
            }}
          />
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h2" sx={{ fontSize: '2.5rem', lineHeight: 1 }}>
            {achievement.icon || '🏆'}
          </Typography>
          
          {isEarned && (
            <Chip 
              label={`+${achievement.points || 0}`} 
              size="small" 
              color="secondary"
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </Box>
        
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{ 
            color: isEarned ? 'white' : 'text.primary',
            mt: 1 
          }}
        >
          {achievement.name || achievement.title || 'Achievement'}
        </Typography>
        
        <Typography 
          variant="body2" 
          sx={{ 
            color: isEarned ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary',
            flexGrow: 1,
          }}
        >
          {achievement.description || 'No description available'}
        </Typography>
        
        <Box mt={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Chip 
              label={achievement.badge_level ? 
                achievement.badge_level.charAt(0).toUpperCase() + achievement.badge_level.slice(1) :
                'General'
              } 
              size="small" 
              sx={{
                bgcolor: isEarned ? 'rgba(255, 255, 255, 0.2)' : 'action.selected',
                color: isEarned ? 'white' : 'text.primary',
                fontWeight: 'medium',
              }}
            />
            {!isEarned && progressValue > 0 && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 'medium' 
                }}
              >
                {progressValue}%
              </Typography>
            )}
          </Box>
          {isEarned && (
            <Typography 
              variant="caption" 
              component="div" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontStyle: 'italic' 
              }}
            >
              Earned • +{achievement.points || 0} points
            </Typography>
          )}
        </Box>
      </Paper>
    </motion.div>
  );
};

export default AchievementCard; 