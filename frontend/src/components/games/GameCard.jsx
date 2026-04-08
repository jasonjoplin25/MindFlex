import React from 'react';
import { Card, CardContent, CardMedia, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const GameCard = ({ game }) => {
  const navigate = useNavigate();

  const handlePlayGame = () => {
    navigate(`/games/${game.type}/${game.id}`);
  };

  // Generate a gradient background based on the game type as a fallback
  const getGradientBackground = (type) => {
    const gradients = {
      memory: 'linear-gradient(135deg, #7C4DFF 0%, #00C853 100%)',
      word: 'linear-gradient(135deg, #FF4081 0%, #7C4DFF 100%)',
      pattern: 'linear-gradient(135deg, #00E5FF 0%, #2979FF 100%)',
      math: 'linear-gradient(135deg, #FF9100 0%, #FF1744 100%)',
      reflex: 'linear-gradient(135deg, #18FFFF 0%, #00B0FF 100%)',
      snake: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
      sudoku: 'linear-gradient(135deg, #9C27B0 0%, #E91E63 100%)',
      crossword: 'linear-gradient(135deg, #FF5722 0%, #FF9800 100%)',
      default: 'linear-gradient(135deg, #7C4DFF 30%, #00E5FF 90%)'
    };
    
    return gradients[type] || gradients.default;
  };

  return (
    <Card sx={{ 
      maxWidth: 345, 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'scale(1.02)',
      }
    }}>
      <CardMedia
        component="div"
        sx={{ 
          height: 140,
          background: getGradientBackground(game.type),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography variant="h5" sx={{ 
          color: '#fff', 
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
        }}>
          {game.name}
        </Typography>
      </CardMedia>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography gutterBottom variant="h6" component="div">
          {game.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {game.description}
        </Typography>
        <Box sx={{ mt: 'auto' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Difficulty: {Array.isArray(game.difficulty_levels) ? game.difficulty_levels.join(', ') : 'All Levels'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Duration: {Math.floor((game.avg_duration_seconds || 180) / 60)} minutes
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            onClick={handlePlayGame}
            sx={{ mt: 2 }}
          >
            Play Game
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GameCard; 