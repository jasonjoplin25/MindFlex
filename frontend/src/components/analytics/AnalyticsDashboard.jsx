import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Divider,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Assessment,
  Psychology,
  SportsEsports,
  Download,
  Refresh,
  DateRange,
  Insights
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { api } from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [selectedMetric, setSelectedMetric] = useState('performance');
  const [trends, setTrends] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  useEffect(() => {
    if (selectedPeriod >= 7) {
      fetchTrends();
    }
  }, [selectedMetric, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [analyticsResponse, dashboardResponse] = await Promise.all([
        api.get(`/analytics/user?days=${selectedPeriod}`),
        api.get('/analytics/dashboard')
      ]);

      if (analyticsResponse.data.success) {
        setAnalytics(analyticsResponse.data.analytics);
      }

      if (dashboardResponse.data.success) {
        setDashboardSummary(dashboardResponse.data.dashboard);
      }

      setError(null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const response = await api.get(`/analytics/trends?metric=${selectedMetric}&days=${selectedPeriod}`);
      if (response.data.success) {
        setTrends(response.data.trends);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await api.get(`/analytics/export?days=${selectedPeriod}&format=csv`);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics_${selectedPeriod}days.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
      case 'increasing':
      case 'strong_improvement':
      case 'moderate_improvement':
        return <TrendingUp color="success" />;
      case 'declining':
      case 'decreasing':
      case 'concerning_decline':
      case 'slight_decline':
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="action" />;
    }
  };

  const getTrendColor = (trend) => {
    if (trend?.includes('improve') || trend === 'increasing') return 'success';
    if (trend?.includes('decline') || trend === 'declining' || trend === 'decreasing') return 'error';
    return 'default';
  };

  const renderGameAnalytics = () => {
    if (!analytics?.games) return null;

    const gameData = analytics.games.game_breakdown?.map(game => ({
      name: game.game_name,
      sessions: game.sessions,
      avgScore: game.avg_score,
      timeMinutes: game.total_time_minutes
    })) || [];

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Game Performance Overview" />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h4" color="primary">
                  {analytics.games.total_sessions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Sessions ({selectedPeriod} days)
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">
                  {analytics.games.average_score}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Score
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getTrendIcon(analytics.games.improvement_trend)}
                <Chip 
                  label={analytics.games.improvement_trend?.replace('_', ' ')} 
                  color={getTrendColor(analytics.games.improvement_trend)}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Game Breakdown" />
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={gameData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, sessions }) => `${name}: ${sessions}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="sessions"
                  >
                    {gameData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {analytics.games.daily_performance?.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Daily Performance Trend" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.games.daily_performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avg_score" stroke="#8884d8" name="Average Score" />
                    <Line type="monotone" dataKey="sessions" stroke="#82ca9d" name="Sessions" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderTherapyAnalytics = () => {
    if (!analytics?.therapy) return null;

    const categoryData = analytics.therapy.category_preferences?.map(cat => ({
      name: cat.category,
      sessions: cat.sessions,
      effectiveness: cat.avg_effectiveness
    })) || [];

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Therapy Overview" />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h4" color="primary">
                  {analytics.therapy.total_sessions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Sessions
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">
                  {analytics.therapy.total_time_hours}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Time
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">
                  {analytics.therapy.average_effectiveness}/5
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Effectiveness
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={analytics.therapy.average_effectiveness ? (analytics.therapy.average_effectiveness / 5) * 100 : 0} 
                  sx={{ mt: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Mood Improvement" />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h4" color="primary">
                  {analytics.therapy.mood_improvement?.improvement_rate || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sessions with mood improvement
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  {analytics.therapy.mood_improvement?.sessions_with_improvement || 0} of {analytics.therapy.mood_improvement?.total_mood_sessions || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Successful sessions
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100, Math.max(0, analytics.therapy.mood_improvement?.improvement_rate || 0))} 
                color="success"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Therapy Frequency" />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h4" color="primary">
                  {analytics.therapy.session_frequency}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sessions per day
                </Typography>
              </Box>
              <Box>
                <Typography variant="body1">
                  {analytics.therapy.time_distribution?.find(t => t.sessions === Math.max(...analytics.therapy.time_distribution.map(td => td.sessions)))?.time_of_day || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Most active time
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {categoryData.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Category Preferences" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip />
                    <Legend />
                    <Bar dataKey="sessions" fill="#8884d8" name="Sessions" />
                    <Bar dataKey="effectiveness" fill="#82ca9d" name="Effectiveness" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderProgressInsights = () => {
    if (!analytics?.progress || !analytics?.summary) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Progress Metrics" 
              action={
                <Chip 
                  label={`${analytics.progress.engagement_score}/100`}
                  color={analytics.progress.engagement_score > 70 ? 'success' : analytics.progress.engagement_score > 40 ? 'warning' : 'error'}
                />
              }
            />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Engagement Score
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, Math.max(0, analytics.progress.engagement_score || 0))} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Activity Consistency: {analytics.progress.activity_consistency_percent}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, Math.max(0, analytics.progress.activity_consistency_percent || 0))} 
                  color="secondary"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {getTrendIcon(analytics.progress.activity_trend)}
                <Typography variant="body1">
                  Activity Trend: {analytics.progress.activity_trend}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary">
                {analytics.progress.active_days} active days out of {analytics.progress.total_days_in_period}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Insights & Recommendations" />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom color="success.main">
                  Strengths
                </Typography>
                {analytics.summary.areas_of_strength?.map((strength, index) => (
                  <Chip 
                    key={index} 
                    label={strength} 
                    color="success" 
                    variant="outlined" 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom color="info.main">
                  Insights
                </Typography>
                {analytics.summary.insights?.map((insight, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                    • {insight}
                  </Typography>
                ))}
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom color="warning.main">
                  Recommendations
                </Typography>
                {analytics.summary.recommendations?.map((rec, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                    • {rec}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderTrends = () => {
    if (!trends?.data_points) return null;

    return (
      <Card sx={{ mt: 3 }}>
        <CardHeader 
          title={`${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trends`}
          action={
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Metric</InputLabel>
              <Select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                label="Metric"
              >
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="activity">Activity</MenuItem>
                <MenuItem value="mood">Mood</MenuItem>
              </Select>
            </FormControl>
          }
        />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            {getTrendIcon(trends.trend)}
            <Typography variant="h6">
              Trend: {trends.trend}
            </Typography>
          </Box>
          
          <ResponsiveContainer width="100%" height={300}>
            {selectedMetric === 'performance' && (
              <AreaChart data={trends.data_points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="avg_score" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                  name="Average Score"
                />
              </AreaChart>
            )}
            
            {selectedMetric === 'activity' && (
              <BarChart data={trends.data_points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Bar dataKey="total_sessions" fill="#82ca9d" name="Total Sessions" />
              </BarChart>
            )}
            
            {selectedMetric === 'mood' && (
              <LineChart data={trends.data_points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Line type="monotone" dataKey="avg_mood_before" stroke="#ff7300" name="Before" />
                <Line type="monotone" dataKey="avg_mood_after" stroke="#387908" name="After" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Analytics Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                label="Period"
              >
                <MenuItem value={7}>Last 7 days</MenuItem>
                <MenuItem value={30}>Last 30 days</MenuItem>
                <MenuItem value={90}>Last 3 months</MenuItem>
                <MenuItem value={365}>Last year</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Export Data">
              <IconButton onClick={handleExportData}>
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchAnalyticsData}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Summary Cards */}
        {dashboardSummary && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <SportsEsports color="primary" />
                      <Box>
                        <Typography variant="h6">{dashboardSummary.weekly_summary.total_game_sessions}</Typography>
                        <Typography variant="body2" color="text.secondary">Game Sessions (7d)</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Psychology color="secondary" />
                      <Box>
                        <Typography variant="h6">{dashboardSummary.weekly_summary.total_therapy_sessions}</Typography>
                        <Typography variant="body2" color="text.secondary">Therapy Sessions (7d)</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Assessment color="info" />
                      <Box>
                        <Typography variant="h6">{dashboardSummary.weekly_summary.engagement_score}</Typography>
                        <Typography variant="body2" color="text.secondary">Engagement Score</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {getTrendIcon(dashboardSummary.weekly_summary.activity_trend)}
                      <Box>
                        <Typography variant="h6">{dashboardSummary.weekly_summary.activity_trend}</Typography>
                        <Typography variant="body2" color="text.secondary">Activity Trend</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        )}

        {analytics && (
          <>
            {/* Game Analytics Section */}
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SportsEsports color="primary" />
                Cognitive Training Analytics
              </Typography>
              <Divider sx={{ mb: 3 }} />
              {renderGameAnalytics()}
            </Paper>

            {/* Therapy Analytics Section */}
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Psychology color="secondary" />
                Therapy Analytics
              </Typography>
              <Divider sx={{ mb: 3 }} />
              {renderTherapyAnalytics()}
            </Paper>

            {/* Progress and Insights Section */}
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Insights color="info" />
                Progress & Insights
              </Typography>
              <Divider sx={{ mb: 3 }} />
              {renderProgressInsights()}
            </Paper>

            {/* Trends Section */}
            {selectedPeriod >= 7 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DateRange color="warning" />
                  Trend Analysis
                </Typography>
                <Divider sx={{ mb: 3 }} />
                {renderTrends()}
              </Paper>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default AnalyticsDashboard;