import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Box, CircularProgress, Card, CardContent, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Build } from '@mui/icons-material';
import GameCard from '../components/games/GameCard';
import { getGames } from '../services/gameService';

const GamesPage = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const { data, error } = await getGames();

      if (error) throw error;

      setGames(data);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to load games. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Cognitive Training Games
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Choose from our selection of brain training games designed to improve memory, attention, and cognitive skills.
      </Typography>
      

      <Grid container spacing={3}>
        {games.map((game) => (
          <Grid item key={game.id} xs={12} sm={6} md={4}>
            <GameCard game={game} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default GamesPage; 