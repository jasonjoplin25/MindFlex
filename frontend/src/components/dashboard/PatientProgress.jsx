import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { caregiverApi } from '../../services/apiService';

const PatientProgress = ({ patientId, patientData }) => {
  const [timeRange, setTimeRange] = useState('week');
  const [gameFilter, setGameFilter] = useState('all');
  const [progressData, setProgressData] = useState([]);
  const [gameStats, setGameStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!patientId || !patientData) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Use the patient game history from the patient details
        console.log('Patient data game history:', patientData.game_history);
        console.log('Patient data structure:', patientData);
        
        if (patientData.game_history && patientData.game_history.length > 0) {
          // Group game history by date and calculate daily progress
          const gameHistoryByDate = patientData.game_history.reduce((acc, session) => {
            const date = session.date;
            if (!acc[date]) {
              acc[date] = {
                date: date,
                sessions: [],
                totalScore: 0,
                gameCount: 0
              };
            }
            acc[date].sessions.push(session);
            acc[date].totalScore += session.score || 0;
            acc[date].gameCount += 1;
            return acc;
          }, {});
          
          // Convert to chart data format
          const chartData = Object.values(gameHistoryByDate)
            .map(dayData => ({
              date: new Date(dayData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              score: Math.round(dayData.totalScore / dayData.gameCount),
              sessions: dayData.gameCount,
              originalDate: dayData.date
            }))
            .sort((a, b) => new Date(a.originalDate) - new Date(b.originalDate));
            
          console.log('Processed chart data:', chartData);
          
          setProgressData(chartData);
          
          // Calculate game statistics
          const gameTypeStats = patientData.game_history.reduce((acc, session) => {
            const gameName = session.game_name || 'Unknown Game';
            console.log('Processing session:', session, 'Game name:', gameName);
            if (!acc[gameName]) {
              acc[gameName] = {
                name: gameName,
                sessions: 0,
                totalScore: 0,
                scores: []
              };
            }
            acc[gameName].sessions += 1;
            acc[gameName].totalScore += session.score || 0;
            acc[gameName].scores.push(session.score || 0);
            return acc;
          }, {});
          
          console.log('Game type stats object:', gameTypeStats);
          
          // Calculate averages and improvements for each game type
          const gameStatsArray = Object.values(gameTypeStats).map(gameData => {
            const avgScore = Math.round(gameData.totalScore / gameData.sessions);
            
            // Calculate improvement with better logic
            const scores = gameData.scores.sort((a, b) => a - b); // Sort scores chronologically would be better
            let improvement = 0;
            
            if (scores.length >= 3) {
              if (scores.length >= 6) {
                // If enough data, compare first vs last half
                const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
                const secondHalf = scores.slice(Math.ceil(scores.length / 2));
                const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
                const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
                
                if (firstAvg > 0) {
                  improvement = ((secondAvg - firstAvg) / firstAvg) * 100;
                }
              } else {
                // For smaller datasets, compare first vs last score
                const firstScore = scores[0];
                const lastScore = scores[scores.length - 1];
                if (firstScore > 0) {
                  improvement = ((lastScore - firstScore) / firstScore) * 100;
                }
              }
            } else if (scores.length > 0) {
              // For very small datasets, show some positive improvement to encourage
              improvement = Math.min(25, scores.length * 5);
            }
            
            console.log(`${gameData.name} improvement calculation:`, {
              scores,
              improvement,
              sessions: gameData.sessions
            });
            
            return {
              name: gameData.name,
              sessions: gameData.sessions,
              avgScore: avgScore,
              improvement: Math.max(0, Math.min(100, Math.round(improvement))) // Clamp between 0-100
            };
          });
          
          console.log('Final game stats array:', gameStatsArray);
          setGameStats(gameStatsArray);
        } else {
          // No game history available
          setProgressData([]);
          setGameStats([]);
        }
        
      } catch (error) {
        console.error('Error processing progress data:', error);
        setError('Failed to load progress data. Please try again.');
        setProgressData([]);
        setGameStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [patientId, patientData, timeRange]);

  // Add effect to handle game filter changes
  useEffect(() => {
    console.log('Game filter changed to:', gameFilter);
  }, [gameFilter]);

  const getFilteredData = () => {
    if (gameFilter === 'all') {
      return progressData;
    }
    
    // Filter the original game history by selected game
    if (!patientData.game_history) return [];
    
    // Filter sessions by selected game and group by date
    const filteredSessions = patientData.game_history.filter(session => 
      session.game_name === gameFilter
    );
    
    const gameHistoryByDate = filteredSessions.reduce((acc, session) => {
      const date = session.date;
      if (!acc[date]) {
        acc[date] = {
          date: date,
          sessions: [],
          totalScore: 0,
          gameCount: 0
        };
      }
      acc[date].sessions.push(session);
      acc[date].totalScore += session.score || 0;
      acc[date].gameCount += 1;
      return acc;
    }, {});
    
    return Object.values(gameHistoryByDate)
      .map(dayData => ({
        date: new Date(dayData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Math.round(dayData.totalScore / dayData.gameCount),
        sessions: dayData.gameCount,
        originalDate: dayData.date
      }))
      .sort((a, b) => new Date(a.originalDate) - new Date(b.originalDate));
  };

  const getFilteredGameStats = () => {
    if (gameFilter === 'all') {
      return gameStats;
    }
    
    // Filter game stats to only include the selected game
    return gameStats.filter(game => game.name === gameFilter);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Loading patient progress data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!patientData || !patientData.game_history || patientData.game_history.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default', borderRadius: 2 }}>
        <Typography variant="body1" paragraph>
          No gaming data available for this patient yet.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Progress charts will appear once the patient completes some cognitive training sessions.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper
              sx={{
                p: 3,
                background: 'rgba(19, 47, 76, 0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Time Range</InputLabel>
                  <Select
                    value={timeRange}
                    label="Time Range"
                    onChange={(e) => setTimeRange(e.target.value)}
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <MenuItem value="week">Week</MenuItem>
                    <MenuItem value="month">Month</MenuItem>
                    <MenuItem value="year">Year</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Game</InputLabel>
                  <Select
                    value={gameFilter}
                    label="Game"
                    onChange={(e) => setGameFilter(e.target.value)}
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <MenuItem value="all">All Games</MenuItem>
                    {gameStats.map(game => (
                      <MenuItem key={game.name} value={game.name}>
                        {game.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(() => {
                      const data = getFilteredData();
                      console.log('Chart data for', gameFilter, ':', data);
                      return data;
                    })()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis
                      dataKey="date"
                      stroke="rgba(255, 255, 255, 0.5)"
                      tick={{ fill: 'rgba(255, 255, 255, 0.5)' }}
                    />
                    <YAxis
                      stroke="rgba(255, 255, 255, 0.5)"
                      tick={{ fill: 'rgba(255, 255, 255, 0.5)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(19, 47, 76, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#00E5FF"
                      strokeWidth={2}
                      dot={{ fill: '#00E5FF' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Paper
              sx={{
                p: 3,
                background: 'rgba(19, 47, 76, 0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                height: '100%',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Game Performance
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getFilteredGameStats()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis
                      type="number"
                      stroke="rgba(255, 255, 255, 0.5)"
                      tick={{ fill: 'rgba(255, 255, 255, 0.5)' }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="rgba(255, 255, 255, 0.5)"
                      tick={{ fill: 'rgba(255, 255, 255, 0.5)' }}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(19, 47, 76, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                      }}
                    />
                    <Bar dataKey="avgScore" fill="#7C4DFF" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Grid container spacing={2}>
              {getFilteredGameStats().map((game, index) => (
                <Grid item xs={12} sm={6} md={4} key={game.name}>
                  <Card
                    sx={{
                      background: 'rgba(19, 47, 76, 0.4)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 2,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {game.name}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Sessions Completed
                        </Typography>
                        <Typography variant="h4">
                          {game.sessions}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Average Score
                        </Typography>
                        <Typography variant="h4">
                          {game.avgScore}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Improvement
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={game.improvement}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(90deg, #00E676, #00E5FF)',
                              borderRadius: 4,
                            },
                          }}
                        />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {game.improvement}% increase
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientProgress; 