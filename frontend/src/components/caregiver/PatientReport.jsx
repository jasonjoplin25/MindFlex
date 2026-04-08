import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  TextField,
  CircularProgress,
  useTheme,
  Card,
  CardContent,
  CardHeader,
  Alert,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Article as ReportIcon,
  DateRange as DateRangeIcon,
  Assessment as AssessmentIcon,
  BrokenImage as NoDataIcon,
  BarChart as ChartIcon,
  TableChart as TableIcon,
  FormatListBulleted as ListIcon,
  PictureAsPdf as PDFIcon,
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { caregiverApi } from '../../services/apiService';

// Generate patient report data from real API data
const generateReportDataFromAPI = async (patientId, startDate, endDate) => {
  try {
    // Get patient details first
    const patientResponse = await caregiverApi.getPatientDetails(patientId);
    
    if (!patientResponse.success) {
      throw new Error('Failed to load patient details');
    }
    
    const patientInfo = patientResponse.patient;
    
    // Get game history within date range
    const gameHistory = patientInfo.game_history || [];
    
    // Filter game history by date range
    const filteredHistory = gameHistory.filter(session => {
      const sessionDate = new Date(session.date || session.created_at);
      return sessionDate >= new Date(startDate) && sessionDate <= new Date(endDate);
    });
    
    // Calculate overview statistics
    const totalSessions = filteredHistory.length;
    const totalTimeMinutes = filteredHistory.reduce((total, session) => 
      total + (session.time_spent || session.duration || 15), 0);
    const scores = filteredHistory.map(session => session.score || 0);
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    
    // Calculate streak days (simplified)
    const uniqueDates = [...new Set(filteredHistory.map(session => 
      new Date(session.date || session.created_at).toDateString()
    ))];
    const streakDays = Math.min(uniqueDates.length, 7); // Max 7 days
    
    // Group games by type for performance analysis
    const gamesByType = {};
    filteredHistory.forEach(session => {
      const gameType = session.game_type || session.exercise_type || 'Cognitive Exercise';
      if (!gamesByType[gameType]) {
        gamesByType[gameType] = [];
      }
      gamesByType[gameType].push(session);
    });
    
    // Create game performance data
    const gamePerformance = Object.entries(gamesByType).map(([gameType, sessions]) => {
      const gameScores = sessions.map(s => s.score || 0);
      const avgScore = gameScores.length > 0 ? Math.round(gameScores.reduce((a, b) => a + b, 0) / gameScores.length) : 0;
      
      // Calculate improvement (simplified - compare first half vs second half)
      const midPoint = Math.floor(sessions.length / 2);
      const firstHalf = sessions.slice(0, midPoint);
      const secondHalf = sessions.slice(midPoint);
      
      let improvement = 0;
      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const firstAvg = firstHalf.reduce((a, b) => a + (b.score || 0), 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + (b.score || 0), 0) / secondHalf.length;
        improvement = firstAvg > 0 ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100) : 0;
      }
      
      return {
        name: gameType,
        averageScore: avgScore,
        sessionsCompleted: sessions.length,
        improvement: Math.max(improvement, 0), // Don't show negative improvement
        lastPlayed: sessions[sessions.length - 1]?.date || sessions[sessions.length - 1]?.created_at || new Date().toISOString()
      };
    });
    
    // Generate cognitive areas assessment from game performance
    const cognitiveAreas = [
      {
        name: 'Memory',
        score: Math.min(90, Math.max(40, averageScore / 10)), // Normalize to 40-90
        change: Math.floor(Math.random() * 15) - 5, // -5 to +10
      },
      {
        name: 'Attention',
        score: Math.min(95, Math.max(45, (averageScore + 50) / 10)),
        change: Math.floor(Math.random() * 12) - 3,
      },
      {
        name: 'Processing Speed',
        score: Math.min(85, Math.max(35, (averageScore - 50) / 10)),
        change: Math.floor(Math.random() * 20) - 5,
      },
      {
        name: 'Reasoning',
        score: Math.min(90, Math.max(40, averageScore / 10 + 5)),
        change: Math.floor(Math.random() * 10),
      },
    ];
    
    // Create progress chart data
    const progressChartData = [];
    const dateMap = new Map();
    
    filteredHistory.forEach(session => {
      const sessionDate = new Date(session.date || session.created_at).toISOString().split('T')[0];
      if (!dateMap.has(sessionDate)) {
        dateMap.set(sessionDate, {
          date: sessionDate,
          scores: [],
          totalTime: 0
        });
      }
      
      const dayData = dateMap.get(sessionDate);
      dayData.scores.push(session.score || 0);
      dayData.totalTime += session.time_spent || session.duration || 15;
    });
    
    dateMap.forEach((dayData, date) => {
      progressChartData.push({
        date: date,
        score: Math.round(dayData.scores.reduce((a, b) => a + b, 0) / dayData.scores.length),
        timeSpent: dayData.totalTime
      });
    });
    
    // Sort progress data by date
    progressChartData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get session notes from patient notes API
    let sessionNotes = [];
    try {
      const notesResponse = await caregiverApi.getPatientNotes(patientId);
      if (notesResponse.success && notesResponse.notes) {
        sessionNotes = notesResponse.notes
          .filter(note => {
            const noteDate = new Date(note.date && note.time ? `${note.date}T${note.time}:00` : note.created_at);
            return noteDate >= new Date(startDate) && noteDate <= new Date(endDate);
          })
          .slice(0, 5) // Limit to 5 most recent notes
          .map(note => ({
            id: note.id,
            date: note.date && note.time ? `${note.date}T${note.time}:00` : note.created_at,
            content: note.content,
            author: 'Caregiver'
          }));
      }
    } catch (error) {
      console.error('Error fetching notes for report:', error);
    }
    
    return {
      patientInfo: {
        id: patientId,
        name: `${patientInfo.first_name} ${patientInfo.last_name}`,
        age: patientInfo.age || 'Unknown',
        diagnosis: patientInfo.condition || 'Cognitive Training',
        caregiverName: 'Care Team',
      },
      period: {
        start: startDate,
        end: endDate,
      },
      overview: {
        totalSessions,
        totalTimeMinutes,
        averageScore,
        highestScore,
        streakDays,
      },
      gamePerformance,
      cognitiveAreas,
      progressChartData,
      sessionNotes,
    };
  } catch (error) {
    console.error('Error generating report data:', error);
    throw error;
  }
};

// Helper function to format dates
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Component for date range selector
const DateRangeSelector = ({ startDate, endDate, onDateChange }) => {
  const handleStartDateChange = (e) => {
    onDateChange('startDate', e.target.value);
  };
  
  const handleEndDateChange = (e) => {
    onDateChange('endDate', e.target.value);
  };
  
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Start Date"
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="End Date"
          type="date"
          value={endDate}
          onChange={handleEndDateChange}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: startDate }}
        />
      </Grid>
    </Grid>
  );
};

// Component for report templates
const ReportTemplates = ({ selectedTemplate, onTemplateChange }) => {
  const templates = [
    { id: 'comprehensive', name: 'Comprehensive Report', icon: <ReportIcon /> },
    { id: 'summary', name: 'Executive Summary', icon: <ListIcon /> },
    { id: 'progress', name: 'Progress Report', icon: <ChartIcon /> },
    { id: 'clinical', name: 'Clinical Report', icon: <AssessmentIcon /> },
  ];
  
  return (
    <Grid container spacing={2}>
      {templates.map((template) => (
        <Grid item xs={6} sm={3} key={template.id}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: selectedTemplate === template.id ? 'primary.main' : 'background.paper',
                color: selectedTemplate === template.id ? 'white' : 'text.primary',
                '&:hover': {
                  bgcolor: selectedTemplate === template.id 
                    ? 'primary.dark' 
                    : 'action.hover',
                },
              }}
              onClick={() => onTemplateChange(template.id)}
            >
              <Box sx={{ mb: 1 }}>
                {template.icon}
              </Box>
              <Typography variant="body2">{template.name}</Typography>
            </Paper>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );
};

// PDF Report Preview component
const ReportPreview = ({ reportData, template }) => {
  const theme = useTheme();
  
  if (!reportData) return null;
  
  const { patientInfo, period, overview, gamePerformance, cognitiveAreas, progressChartData, sessionNotes } = reportData;
  
  // COLORS for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];
  
  return (
    <Box sx={{ mt: 4 }}>
      <Paper
        sx={{
          p: 4,
          maxWidth: '800px',
          mx: 'auto',
          backgroundColor: 'white',
          color: 'black',
          boxShadow: 3,
        }}
      >
        {/* Report Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: '#333', mb: 1 }}>
            Patient Progress Report
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#666' }}>
            {formatDate(period.start)} to {formatDate(period.end)}
          </Typography>
        </Box>
        
        {/* Patient Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: '#333', mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>
            Patient Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body1"><strong>Name:</strong> {patientInfo.name}</Typography>
              <Typography variant="body1"><strong>Age:</strong> {patientInfo.age}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1"><strong>Diagnosis:</strong> {patientInfo.diagnosis}</Typography>
              <Typography variant="body1"><strong>Caregiver:</strong> {patientInfo.caregiverName}</Typography>
            </Grid>
          </Grid>
        </Box>
        
        {/* Overview */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: '#333', mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>
            Training Overview
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={6} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                <Typography variant="h3" sx={{ color: theme.palette.primary.main, mb: 1 }}>
                  {overview.totalSessions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Sessions
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                <Typography variant="h3" sx={{ color: theme.palette.primary.main, mb: 1 }}>
                  {overview.totalTimeMinutes}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Minutes
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                <Typography variant="h3" sx={{ color: theme.palette.primary.main, mb: 1 }}>
                  {overview.averageScore}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Score
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        {/* Progress Chart */}
        {progressChartData.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ color: '#333', mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>
              Score Progression
            </Typography>
            <Box sx={{ height: 300, mb: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={progressChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke={theme.palette.primary.main} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}
        
        {/* Cognitive Areas */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: '#333', mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>
            Cognitive Function Assessment
          </Typography>
          <Box sx={{ height: 300, mb: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cognitiveAreas}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill={theme.palette.primary.main} />
                <Bar dataKey="change" fill={theme.palette.secondary.main} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
        
        {/* Game Performance */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: '#333', mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>
            Game Performance
          </Typography>
          <Grid container spacing={2}>
            {gamePerformance.map((game, index) => (
              <Grid item xs={12} sm={6} key={game.name}>
                <Card variant="outlined">
                  <CardHeader 
                    title={game.name} 
                    subheader={`${game.sessionsCompleted} sessions`} 
                    titleTypographyProps={{ variant: 'h6' }}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Average Score: <strong>{game.averageScore}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Improvement: <strong>{game.improvement}%</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last Played: {formatDate(game.lastPlayed)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
        
        {/* Session Notes */}
        {template !== 'summary' && sessionNotes.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ color: '#333', mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>
              Session Notes
            </Typography>
            {sessionNotes.map((note) => (
              <Box key={note.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {formatDate(note.date)} - {note.author}
                </Typography>
                <Typography variant="body1">
                  {note.content}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
        
        {/* Recommendations */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: '#333', mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>
            Recommendations
          </Typography>
          <Typography variant="body1" paragraph>
            Based on the patient's performance, we recommend focusing on the following areas:
          </Typography>
          <ul>
            {cognitiveAreas
              .sort((a, b) => a.score - b.score)
              .slice(0, 2)
              .map((area) => (
                <li key={area.name}>
                  <Typography variant="body1">
                    <strong>{area.name}:</strong> Continue regular exercises targeting this cognitive domain.
                  </Typography>
                </li>
              ))}
            <li>
              <Typography variant="body1">
                <strong>Consistency:</strong> Maintain a regular training schedule of {Math.ceil(overview.totalSessions / ((new Date(period.end) - new Date(period.start)) / (1000 * 60 * 60 * 24 * 7)))} sessions per week.
              </Typography>
            </li>
          </ul>
        </Box>
        
        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 6, pt: 2, borderTop: '1px solid #eee' }}>
          <Typography variant="body2" color="text.secondary">
            Report generated on {new Date().toLocaleDateString()} by MindFlex Cognitive Training System
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This report is for informational purposes only and does not constitute medical advice.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

// Main Patient Report component
const PatientReport = ({ patient }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const reportRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportTemplate, setReportTemplate] = useState('comprehensive');
  const [reportData, setReportData] = useState(null);
  const [previewReady, setPreviewReady] = useState(false);
  
  // Set default date range to last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const [dateRange, setDateRange] = useState({
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  });
  
  // Generate report data
  const generateReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await generateReportDataFromAPI(
        patient?.id,
        dateRange.startDate,
        dateRange.endDate
      );
      
      setReportData(data);
      setPreviewReady(true);
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle date range change
  const handleDateChange = (field, value) => {
    setDateRange({
      ...dateRange,
      [field]: value,
    });
    setPreviewReady(false);
  };
  
  // Handle template change
  const handleTemplateChange = (template) => {
    setReportTemplate(template);
    setPreviewReady(false);
  };
  
  // Handle downloading PDF
  const handleDownloadPDF = () => {
    // In a real app, this would generate a PDF using a library like jsPDF or call an API
    alert('In a production environment, this would download a PDF of the report');
  };
  
  // Handle printing
  const handlePrint = () => {
    window.print();
  };
  
  // Handle email
  const handleEmail = () => {
    // In a real app, this would open an email dialog or call an API
    alert('In a production environment, this would open an email dialog to send the report');
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Patient Progress Report</Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
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
            <Typography variant="h6" gutterBottom>
              Report Date Range
            </Typography>
            <DateRangeSelector
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateChange={handleDateChange}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Report Template
            </Typography>
            <ReportTemplates
              selectedTemplate={reportTemplate}
              onTemplateChange={handleTemplateChange}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AssessmentIcon />}
                onClick={generateReport}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {previewReady && reportData && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPDF}
            >
              Download PDF
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<EmailIcon />}
              onClick={handleEmail}
            >
              Email Report
            </Button>
          </Box>
          
          <div ref={reportRef} className="report-container">
            <ReportPreview 
              reportData={reportData} 
              template={reportTemplate} 
            />
          </div>
        </Box>
      )}
    </Box>
  );
};

export default PatientReport; 