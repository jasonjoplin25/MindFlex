import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
  useTheme,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { gameService } from '../../services/gameService';

const GameLeaderboard = () => {
  const theme = useTheme();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState('memory');
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const [games, setGames] = useState([]);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesResponse = await gameService.getGames();
        setGames(gamesResponse.data || []);
      } catch (error) {
        console.error('Error fetching games:', error);
        setGames([]);
      }
    };
    fetchGames();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await gameService.getLeaderboard(selectedGame, selectedDifficulty);
        setLeaderboardData(response.data || []);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaderboardData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [selectedGame, selectedDifficulty]);

  const getScoreColor = (index) => {
    switch (index) {
      case 0:
        return theme.palette.warning.main; // Gold
      case 1:
        return theme.palette.grey[400]; // Silver
      case 2:
        return '#CD7F32'; // Bronze
      default:
        return theme.palette.text.primary;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          sx={{
            mb: 4,
            background: 'linear-gradient(45deg, #7C4DFF 30%, #00E5FF 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Game Leaderboard
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 4,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Game</InputLabel>
            <Select
              value={selectedGame}
              label="Game"
              onChange={(e) => setSelectedGame(e.target.value)}
            >
              {games.map((game) => (
                <MenuItem key={game.id} value={game.type}>
                  {game.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={selectedDifficulty}
              label="Difficulty"
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer
          component={Paper}
          sx={{
            background: 'rgba(19, 47, 76, 0.4)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Rank</TableCell>
                <TableCell>Player</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell align="right">Time</TableCell>
                <TableCell align="center">Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence mode="wait">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : leaderboardData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No scores recorded yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  leaderboardData.map((entry, index) => (
                    <TableRow
                      component={motion.tr}
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      sx={{
                        background:
                          index < 3
                            ? `linear-gradient(90deg, rgba(${
                                index === 0 ? '255, 215, 0' : index === 1 ? '192, 192, 192' : '205, 127, 50'
                              }, 0.1) 0%, transparent 100%)`
                            : undefined,
                      }}
                    >
                      <TableCell align="center">
                        <Chip
                          label={`#${index + 1}`}
                          sx={{
                            color: getScoreColor(index),
                            borderColor: getScoreColor(index),
                            variant: 'outlined',
                          }}
                        />
                      </TableCell>
                      <TableCell>{entry.player?.full_name || entry.player?.email || 'Anonymous'}</TableCell>
                      <TableCell align="right">
                        <Typography
                          sx={{
                            color: getScoreColor(index),
                            fontWeight: index < 3 ? 'bold' : 'normal',
                          }}
                        >
                          {entry.score.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {(() => {
                          const duration = entry.duration_seconds || 0;
                          const minutes = Math.floor(duration / 60);
                          const seconds = duration % 60;
                          return `${minutes}m ${seconds}s`;
                        })()}
                      </TableCell>
                      <TableCell align="center">
                        {new Date(entry.completed_at || entry.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default GameLeaderboard; 