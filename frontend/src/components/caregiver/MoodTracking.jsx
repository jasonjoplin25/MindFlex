import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Grid,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon,
  SentimentSatisfiedAlt as HappyIcon,
  SentimentNeutral as NeutralIcon,
  SentimentDissatisfied as SadIcon,
  SentimentVeryDissatisfied as AngryIcon,
  CalendarToday as CalendarIcon,
  Timeline as TimelineIcon,
  BarChart as ChartIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, subDays, isSameDay } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { caregiverApi } from '../../services/apiService';

const MoodChip = styled(Chip)(({ theme, mood }) => {
  let color;
  switch (mood) {
    case 'happy':
      color = theme.palette.success.main;
      break;
    case 'content':
      color = theme.palette.success.light;
      break;
    case 'neutral':
      color = theme.palette.info.main;
      break;
    case 'anxious':
      color = theme.palette.warning.light;
      break;
    case 'sad':
      color = theme.palette.warning.main;
      break;
    case 'agitated':
      color = theme.palette.error.light;
      break;
    case 'angry':
      color = theme.palette.error.main;
      break;
    default:
      color = theme.palette.grey[500];
  }

  return {
    backgroundColor: color,
    color: theme.palette.getContrastText(color),
    '& .MuiChip-icon': {
      color: 'inherit',
    },
  };
});

const MoodIcon = ({ mood, size = 'small' }) => {
  switch (mood) {
    case 'happy':
    case 'content':
      return <HappyIcon fontSize={size} />;
    case 'neutral':
      return <NeutralIcon fontSize={size} />;
    case 'anxious':
    case 'sad':
      return <SadIcon fontSize={size} />;
    case 'agitated':
    case 'angry':
      return <AngryIcon fontSize={size} />;
    default:
      return <NeutralIcon fontSize={size} />;
  }
};

const moodOptions = [
  { value: 'happy', label: 'Happy' },
  { value: 'content', label: 'Content' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'sad', label: 'Sad' },
  { value: 'agitated', label: 'Agitated' },
  { value: 'angry', label: 'Angry' },
];

const commonSymptoms = [
  'Confusion',
  'Restlessness',
  'Fatigue',
  'Irritability',
  'Memory issues',
  'Disorientation',
  'Physical discomfort',
  'Repetitive behavior',
  'Poor appetite',
  'Trouble sleeping',
];

const commonFactors = [
  'Medication change',
  'Missed medication',
  'Good night sleep',
  'Poor sleep',
  'Visitors',
  'Change in routine',
  'Weather change',
  'Physical activity',
  'Loud environment',
  'Calm environment',
  'After meals',
  'Before meals',
];

const MoodTracking = ({ patientId }) => {
  const [viewMode, setViewMode] = useState('calendar');
  const [moodEntries, setMoodEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEntry, setNewEntry] = useState({
    mood: 'neutral',
    notes: '',
    symptoms: [],
    factors: [],
    timestamp: new Date(),
  });
  const [symptomInput, setSymptomInput] = useState('');
  const [factorInput, setFactorInput] = useState('');

  useEffect(() => {
    const fetchMoodEntries = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await caregiverApi.getMoodTracking(patientId);
        
        if (response.success) {
          // Sort entries by date/time
          const sortedEntries = response.mood_entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setMoodEntries(sortedEntries);
        } else {
          setError(response.error || 'Failed to load mood tracking data. Please try again.');
        }
      } catch (error) {
        console.error('Error fetching mood entries:', error);
        setError('Failed to load mood tracking data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (patientId) {
      fetchMoodEntries();
    }
  }, [patientId]);

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleAddMoodEntry = async () => {
    try {
      setLoading(true);
      
      const moodData = {
        mood: newEntry.mood,
        notes: newEntry.notes,
        symptoms: newEntry.symptoms,
        factors: newEntry.factors,
        timestamp: newEntry.timestamp.toISOString(),
      };
      
      const response = await caregiverApi.addMoodEntry(patientId, moodData);
      
      if (response.success) {
        // Add the new entry to the beginning of the list
        setMoodEntries([response.mood_entry, ...moodEntries]);
        
        // Reset the form
        setNewEntry({
          mood: 'neutral',
          notes: '',
          symptoms: [],
          factors: [],
          timestamp: new Date(),
        });
        
        setShowAddDialog(false);
      } else {
        setError(response.error || 'Failed to add mood entry. Please try again.');
      }
    } catch (error) {
      console.error('Error adding mood entry:', error);
      setError('Failed to add mood entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSymptom = () => {
    if (symptomInput.trim() && !newEntry.symptoms.includes(symptomInput.trim())) {
      setNewEntry({
        ...newEntry,
        symptoms: [...newEntry.symptoms, symptomInput.trim()],
      });
      setSymptomInput('');
    }
  };

  const handleAddFactor = () => {
    if (factorInput.trim() && !newEntry.factors.includes(factorInput.trim())) {
      setNewEntry({
        ...newEntry,
        factors: [...newEntry.factors, factorInput.trim()],
      });
      setFactorInput('');
    }
  };

  const handleRemoveSymptom = (symptom) => {
    setNewEntry({
      ...newEntry,
      symptoms: newEntry.symptoms.filter((s) => s !== symptom),
    });
  };

  const handleRemoveFactor = (factor) => {
    setNewEntry({
      ...newEntry,
      factors: newEntry.factors.filter((f) => f !== factor),
    });
  };

  const getLastSevenDays = () => {
    return Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
  };

  const getEntriesForDate = (date) => {
    return moodEntries.filter((entry) => 
      entry && entry.timestamp && isSameDay(new Date(entry.timestamp), date)
    );
  };

  const getMoodStats = () => {
    const stats = {
      happy: 0,
      content: 0,
      neutral: 0,
      anxious: 0,
      sad: 0,
      agitated: 0,
      angry: 0,
    };
    
    moodEntries.forEach((entry) => {
      if (stats[entry.mood] !== undefined) {
        stats[entry.mood]++;
      }
    });
    
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    return {
      stats,
      total,
      percentages: Object.fromEntries(
        Object.entries(stats).map(([mood, count]) => [
          mood,
          total > 0 ? Math.round((count / total) * 100) : 0,
        ])
      ),
    };
  };

  const renderCalendarView = () => {
    const days = getLastSevenDays();
    
    return (
      <Grid container spacing={2}>
        {days.map((day) => {
          const dayEntries = getEntriesForDate(day);
          return (
            <Grid item xs={12} key={day.toISOString()}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {format(day, 'EEEE, MMMM d')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dayEntries.length > 0 
                      ? `${dayEntries.length} ${dayEntries.length === 1 ? 'entry' : 'entries'}`
                      : 'No entries'}
                  </Typography>
                </Box>
                
                {dayEntries.length > 0 ? (
                  <Box>
                    {dayEntries.map((entry) => (
                      <Card key={entry.id} sx={{ mb: 1, borderRadius: 2 }}>
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <MoodChip
                                icon={<MoodIcon mood={entry.mood} />}
                                label={moodOptions.find(option => option.value === entry.mood)?.label || entry.mood}
                                mood={entry.mood}
                                size="small"
                              />
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                {format(new Date(entry.timestamp), 'h:mm a')}
                              </Typography>
                            </Box>
                            <Box>
                              <Tooltip title="Edit entry">
                                <IconButton size="small">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                          
                          {entry.notes && (
                            <Typography variant="body2" paragraph sx={{ mt: 1, mb: 1 }}>
                              {entry.notes}
                            </Typography>
                          )}
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {entry.symptoms && entry.symptoms.length > 0 && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Symptoms:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  {entry.symptoms.map((symptom, i) => (
                                    <Chip
                                      key={i}
                                      label={symptom}
                                      size="small"
                                      variant="outlined"
                                      color="warning"
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
                            
                            {entry.factors && entry.factors.length > 0 && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Factors:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  {entry.factors.map((factor, i) => (
                                    <Chip
                                      key={i}
                                      label={factor}
                                      size="small"
                                      variant="outlined"
                                      color="info"
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      backgroundColor: 'background.default',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No mood entries recorded for this day
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderTimelineView = () => {
    return (
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {moodEntries.map((entry) => (
          <React.Fragment key={entry.id}>
            <ListItem
              alignItems="flex-start"
              secondaryAction={
                <Tooltip title="Edit entry">
                  <IconButton edge="end" aria-label="edit">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              }
            >
              <ListItemIcon>
                <Avatar sx={{ bgcolor: getMoodColor(entry.mood) }}>
                  <MoodIcon mood={entry.mood} />
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
                      {moodOptions.find(option => option.value === entry.mood)?.label || entry.mood}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(entry.timestamp), 'MMM d, yyyy • h:mm a')}
                    </Typography>
                  </Box>
                }
                secondaryTypographyProps={{ component: 'div' }}
                secondary={
                  <Box sx={{ mt: 1 }}>
                    {entry.notes && (
                      <Typography variant="body2" component="div" paragraph sx={{ mt: 1, mb: 1 }}>
                        {entry.notes}
                      </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {entry.symptoms && entry.symptoms.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Symptoms:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {entry.symptoms.map((symptom, i) => (
                              <Chip
                                key={i}
                                label={symptom}
                                size="small"
                                variant="outlined"
                                color="warning"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      {entry.factors && entry.factors.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Factors:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {entry.factors.map((factor, i) => (
                              <Chip
                                key={i}
                                label={factor}
                                size="small"
                                variant="outlined"
                                color="info"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                }
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))}
      </List>
    );
  };

  const renderAnalyticsView = () => {
    const { stats, percentages, total } = getMoodStats();
    
    return (
      <Box>
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Mood Distribution
            </Typography>
            <Box sx={{ mt: 3 }}>
              {moodOptions.map((option) => (
                <Box key={option.value} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MoodIcon mood={option.value} />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {option.label}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {stats[option.value] || 0} entries ({percentages[option.value] || 0}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={percentages[option.value] || 0}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      bgcolor: 'background.default',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getMoodColor(option.value),
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Common Symptoms
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {getTopSymptoms().map((item, index) => (
                    <Box key={index} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{item.symptom}</Typography>
                        <Typography variant="body2">{item.count} times</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(item.count / moodEntries.length) * 100}
                        sx={{ height: 8, borderRadius: 1 }}
                        color="warning"
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Common Factors
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {getTopFactors().map((item, index) => (
                    <Box key={index} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{item.factor}</Typography>
                        <Typography variant="body2">{item.count} times</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(item.count / moodEntries.length) * 100}
                        sx={{ height: 8, borderRadius: 1 }}
                        color="info"
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Card sx={{ mt: 3, borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Insights
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" paragraph>
              Based on the mood data collected, here are some patterns that may be helpful:
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <NotificationIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Morning patterns"
                  secondary="Patient tends to be more content in the mornings, especially after a good night's sleep and taking medication on time."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <NotificationIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Environmental triggers"
                  secondary="Loud environments appear to correlate with increased agitation. Maintaining a calm, quiet environment may help prevent agitation episodes."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <NotificationIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Positive activities"
                  secondary="Music therapy sessions consistently result in positive mood outcomes. Consider incorporating more music into daily routines."
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const getTopSymptoms = () => {
    const symptomCounts = {};
    
    moodEntries.forEach((entry) => {
      if (entry.symptoms && Array.isArray(entry.symptoms)) {
        entry.symptoms.forEach((symptom) => {
          symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
        });
      }
    });
    
    return Object.entries(symptomCounts)
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getTopFactors = () => {
    const factorCounts = {};
    
    moodEntries.forEach((entry) => {
      if (entry.factors && Array.isArray(entry.factors)) {
        entry.factors.forEach((factor) => {
          factorCounts[factor] = (factorCounts[factor] || 0) + 1;
        });
      }
    });
    
    return Object.entries(factorCounts)
      .map(([factor, count]) => ({ factor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getMoodColor = (mood) => {
    switch (mood) {
      case 'happy': return '#4caf50'; // green
      case 'content': return '#8bc34a'; // light green
      case 'neutral': return '#2196f3'; // blue
      case 'anxious': return '#ff9800'; // orange
      case 'sad': return '#ffc107'; // amber
      case 'agitated': return '#f44336'; // red
      case 'angry': return '#d32f2f'; // dark red
      default: return '#9e9e9e'; // grey
    }
  };

  const Avatar = styled(Box)(({ theme, sx }) => ({
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    ...sx,
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Mood Tracking
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddDialog(true)}
        >
          Add Mood Entry
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          aria-label="view mode"
        >
          <ToggleButton value="calendar" aria-label="calendar view">
            <CalendarIcon sx={{ mr: 1 }} /> Calendar
          </ToggleButton>
          <ToggleButton value="timeline" aria-label="timeline view">
            <TimelineIcon sx={{ mr: 1 }} /> Timeline
          </ToggleButton>
          <ToggleButton value="analytics" aria-label="analytics view">
            <ChartIcon sx={{ mr: 1 }} /> Analytics
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Loading mood tracking data...
          </Typography>
        </Box>
      ) : moodEntries.length > 0 ? (
        <Box>
          {viewMode === 'calendar' && renderCalendarView()}
          {viewMode === 'timeline' && renderTimelineView()}
          {viewMode === 'analytics' && renderAnalyticsView()}
        </Box>
      ) : (
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="body1" paragraph>
            No mood entries recorded yet.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddDialog(true)}
          >
            Add First Mood Entry
          </Button>
        </Box>
      )}
      
      {/* Add Mood Entry Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Mood Entry</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Mood</InputLabel>
                <Select
                  value={newEntry.mood}
                  onChange={(e) => setNewEntry({ ...newEntry, mood: e.target.value })}
                  label="Mood"
                >
                  {moodOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MoodIcon mood={option.value} />
                        <Typography sx={{ ml: 1 }}>{option.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date & Time"
                  value={newEntry.timestamp}
                  onChange={(newDate) => setNewEntry({ ...newEntry, timestamp: newDate })}
                  renderInput={(params) => <TextField fullWidth {...params} />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                placeholder="Describe the mood, context, or any observations..."
                value={newEntry.notes}
                onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Symptoms
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {newEntry.symptoms.map((symptom, index) => (
                  <Chip
                    key={index}
                    label={symptom}
                    onDelete={() => handleRemoveSymptom(symptom)}
                    color="warning"
                    variant="outlined"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Add symptom"
                  value={symptomInput}
                  onChange={(e) => setSymptomInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSymptom();
                    }
                  }}
                  sx={{ mr: 1 }}
                />
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={handleAddSymptom}
                  disabled={!symptomInput.trim()}
                >
                  Add
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Common: {commonSymptoms.slice(0, 5).join(', ')}...
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Factors
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {newEntry.factors.map((factor, index) => (
                  <Chip
                    key={index}
                    label={factor}
                    onDelete={() => handleRemoveFactor(factor)}
                    color="info"
                    variant="outlined"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Add factor"
                  value={factorInput}
                  onChange={(e) => setFactorInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFactor();
                    }
                  }}
                  sx={{ mr: 1 }}
                />
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={handleAddFactor}
                  disabled={!factorInput.trim()}
                >
                  Add
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Common: {commonFactors.slice(0, 5).join(', ')}...
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddMoodEntry}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Entry'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MoodTracking; 