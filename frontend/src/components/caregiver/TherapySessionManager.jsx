import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  Divider,
  Paper,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  HealthAndSafety as TherapyIcon,
  Psychology as CognitiveIcon,
  Accessibility as PhysicalIcon,
  RecordVoiceOver as SpeechIcon,
  SelfImprovement as OccupationalIcon,
  Group as GroupIcon,
  Person as IndividualIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Phone as VirtualIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { caregiverApi } from '../../services/apiService';

// Generate time options in 15-minute intervals
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeString);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

const TherapySessionManager = ({ 
  open, 
  onClose, 
  patientId,
  initialSessions = [],
  onSave 
}) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState({
    id: null,
    name: '',
    therapy_type: 'cognitive',
    session_format: 'individual',
    scheduled_time: '10:00',
    duration_minutes: 60,
    location: 'clinic',
    therapist_name: '',
    goals: '',
    preparation_notes: '',
    equipment_needed: '',
    homework_assignments: '',
    progress_notes: '',
    completion_status: 'pending'
  });
  const [editingIndex, setEditingIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);

  // Therapy types with descriptions
  const therapyTypes = [
    { value: 'cognitive', label: 'Cognitive Therapy', icon: CognitiveIcon, color: 'primary', description: 'Memory, attention, and thinking skills', defaultDuration: 60 },
    { value: 'physical', label: 'Physical Therapy', icon: PhysicalIcon, color: 'success', description: 'Movement, strength, and mobility', defaultDuration: 45 },
    { value: 'speech', label: 'Speech Therapy', icon: SpeechIcon, color: 'warning', description: 'Communication and language skills', defaultDuration: 45 },
    { value: 'occupational', label: 'Occupational Therapy', icon: OccupationalIcon, color: 'info', description: 'Daily living and work skills', defaultDuration: 60 },
    { value: 'group', label: 'Group Therapy', icon: GroupIcon, color: 'secondary', description: 'Social interaction and peer support', defaultDuration: 90 },
    { value: 'counseling', label: 'Counseling', icon: TherapyIcon, color: 'error', description: 'Emotional and psychological support', defaultDuration: 50 }
  ];

  const sessionFormats = [
    { value: 'individual', label: 'Individual Session', icon: IndividualIcon },
    { value: 'group', label: 'Group Session', icon: GroupIcon },
    { value: 'family', label: 'Family Session', icon: GroupIcon }
  ];

  const locationTypes = [
    { value: 'clinic', label: 'Clinic/Office', icon: LocationIcon },
    { value: 'home', label: 'Home Visit', icon: HomeIcon },
    { value: 'virtual', label: 'Virtual/Online', icon: VirtualIcon }
  ];

  useEffect(() => {
    loadSavedSessions();
  }, [open, patientId]);

  const loadSavedSessions = async () => {
    if (!patientId) return;
    
    try {
      setLoading(true);
      const response = await caregiverApi.getPatientRoutines(patientId, 'therapy_sessions');
      
      if (response.success && response.routines) {
        setSessions(response.routines);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Error loading saved sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionChange = (field, value) => {
    setCurrentSession(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSession = () => {
    setCurrentSession({
      id: null,
      name: '',
      therapy_type: 'cognitive',
      session_format: 'individual',
      scheduled_time: '10:00',
      duration_minutes: 60,
      location: 'clinic',
      therapist_name: '',
      goals: '',
      preparation_notes: '',
      equipment_needed: '',
      homework_assignments: '',
      progress_notes: '',
      completion_status: 'pending'
    });
    setEditingIndex(-1);
  };

  const handleEditSession = (index) => {
    const session = sessions[index];
    setCurrentSession(session);
    setEditingIndex(index);
  };

  const handleSaveSession = async () => {
    if (!currentSession.name.trim()) {
      setError('Session name is required');
      return;
    }

    const newSession = {
      ...currentSession,
      id: currentSession.id || `session_${Date.now()}`,
    };

    const updatedSessions = editingIndex >= 0
      ? sessions.map((session, index) => index === editingIndex ? newSession : session)
      : [...sessions, newSession];

    setSessions(updatedSessions);
    await saveSessionsToBackend(updatedSessions);
    
    // Reset form
    setCurrentSession({
      id: null,
      name: '',
      therapy_type: 'cognitive',
      session_format: 'individual',
      scheduled_time: '10:00',
      duration_minutes: 60,
      location: 'clinic',
      therapist_name: '',
      goals: '',
      preparation_notes: '',
      equipment_needed: '',
      homework_assignments: '',
      progress_notes: '',
      completion_status: 'pending'
    });
    setEditingIndex(-1);
    setError(null);
  };

  const handleDeleteSession = async (index) => {
    const updatedSessions = sessions.filter((_, i) => i !== index);
    setSessions(updatedSessions);
    await saveSessionsToBackend(updatedSessions);
  };

  const handleToggleCompletion = async (index) => {
    const updatedSessions = sessions.map((session, i) => {
      if (i === index) {
        return {
          ...session,
          completion_status: session.completion_status === 'completed' ? 'pending' : 'completed'
        };
      }
      return session;
    });
    
    setSessions(updatedSessions);
    await saveSessionsToBackend(updatedSessions);
  };

  const saveSessionsToBackend = async (sessionList) => {
    if (!patientId) return;

    try {
      const routineData = {
        routine_type: 'therapy_sessions',
        activities: sessionList.map(session => ({
          name: session.name,
          therapy_type: session.therapy_type,
          session_format: session.session_format,
          scheduled_time: session.scheduled_time,
          duration_minutes: session.duration_minutes,
          location: session.location,
          therapist_name: session.therapist_name || '',
          goals: session.goals || '',
          preparation_notes: session.preparation_notes || '',
          equipment_needed: session.equipment_needed || '',
          homework_assignments: session.homework_assignments || '',
          progress_notes: session.progress_notes || '',
          completion_status: session.completion_status || 'pending'
        }))
      };

      const response = await caregiverApi.savePatientRoutine(patientId, routineData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to save sessions');
      }
      
      console.log('Therapy sessions saved successfully');
    } catch (error) {
      console.error('Error saving sessions:', error);
      setError('Failed to save sessions. Please try again.');
    }
  };

  const handleSave = async () => {
    await saveSessionsToBackend(sessions);
    if (onSave) onSave(sessions);
    onClose();
  };

  const getTherapyTypeIcon = (type) => {
    const typeConfig = therapyTypes.find(t => t.value === type);
    if (typeConfig) {
      const Icon = typeConfig.icon;
      return <Icon color={typeConfig.color} />;
    }
    return <TherapyIcon />;
  };

  const getCompletionStats = () => {
    const completed = sessions.filter(session => session.completion_status === 'completed').length;
    const total = sessions.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getLocationIcon = (location) => {
    const locationConfig = locationTypes.find(l => l.value === location);
    if (locationConfig) {
      const Icon = locationConfig.icon;
      return <Icon fontSize="small" />;
    }
    return <LocationIcon fontSize="small" />;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Therapy Sessions Planner</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getCompletionStats().total > 0 && (
              <Chip
                label={`${getCompletionStats().completed}/${getCompletionStats().total} Complete`}
                color={getCompletionStats().percentage === 100 ? 'success' : 'primary'}
                size="small"
              />
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Session Schedule" />
            <Tab label="Add/Edit Session" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Session Schedule Tab */}
        {selectedTab === 0 && (
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Therapy Session Schedule</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      handleAddSession();
                      setSelectedTab(1);
                    }}
                  >
                    Schedule Session
                  </Button>
                </Box>

                {/* Therapy Types Overview */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {therapyTypes.map((type) => (
                    <Grid item xs={12} sm={6} md={4} key={type.value}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          textAlign: 'center', 
                          cursor: 'pointer', 
                          '&:hover': { 
                            bgcolor: 'action.hover',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)'
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                        onClick={() => {
                          // Pre-populate the form with this therapy type
                          setCurrentSession({
                            ...currentSession,
                            therapy_type: type.value,
                            duration_minutes: type.defaultDuration,
                            name: type.label // Pre-fill with the type name as starting point
                          });
                          setSelectedTab(1); // Switch to Add/Edit tab
                        }}
                      >
                        <type.icon color={type.color} sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="subtitle2" gutterBottom>{type.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {type.description}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                            Click to schedule
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                {sessions.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No therapy sessions scheduled yet.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Schedule therapy sessions to support recovery and skill development.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        handleAddSession();
                        setSelectedTab(1);
                      }}
                    >
                      Schedule First Session
                    </Button>
                  </Paper>
                ) : (
                  <Grid container spacing={2}>
                    {sessions
                      .sort((a, b) => a.scheduled_time?.localeCompare(b.scheduled_time) || 0)
                      .map((session, index) => (
                        <Grid item xs={12} md={6} key={session.id || index}>
                          <Card sx={{ height: '100%' }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {getTherapyTypeIcon(session.therapy_type)}
                                  <Typography variant="h6" component="h3">
                                    {session.name}
                                  </Typography>
                                </Box>
                                <Chip
                                  size="small"
                                  label={session.completion_status === 'completed' ? 'Completed' : 'Scheduled'}
                                  color={session.completion_status === 'completed' ? 'success' : 'default'}
                                  variant={session.completion_status === 'completed' ? 'filled' : 'outlined'}
                                />
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {therapyTypes.find(t => t.value === session.therapy_type)?.label || 'Unknown Type'}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <TimeIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                  {session.scheduled_time} - {session.duration_minutes} minutes
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                {getLocationIcon(session.location)}
                                <Typography variant="body2">
                                  {locationTypes.find(l => l.value === session.location)?.label || session.location}
                                </Typography>
                              </Box>

                              {session.therapist_name && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  👨‍⚕️ {session.therapist_name}
                                </Typography>
                              )}

                              {session.goals && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  🎯 {session.goals}
                                </Typography>
                              )}

                              {session.equipment_needed && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  🛠️ {session.equipment_needed}
                                </Typography>
                              )}
                            </CardContent>
                            
                            <CardActions sx={{ justifyContent: 'space-between' }}>
                              <Box>
                                <Tooltip title="Edit Session">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      handleEditSession(index);
                                      setSelectedTab(1);
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Session">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteSession(index)}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                              
                              <Box>
                                <Tooltip title={session.completion_status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleToggleCompletion(index)}
                                    color={session.completion_status === 'completed' ? 'success' : 'default'}
                                  >
                                    <CompleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                  </Grid>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Add/Edit Session Tab */}
        {selectedTab === 1 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {editingIndex >= 0 ? 'Edit Therapy Session' : 'Schedule New Therapy Session'}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Session Name"
                  value={currentSession.name}
                  onChange={(e) => handleSessionChange('name', e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Therapy Type</InputLabel>
                  <Select
                    value={currentSession.therapy_type}
                    onChange={(e) => {
                      const selectedType = therapyTypes.find(t => t.value === e.target.value);
                      handleSessionChange('therapy_type', e.target.value);
                      if (selectedType) {
                        handleSessionChange('duration_minutes', selectedType.defaultDuration);
                      }
                    }}
                    label="Therapy Type"
                  >
                    {therapyTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <type.icon color={type.color} />
                          {type.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Session Format</InputLabel>
                  <Select
                    value={currentSession.session_format}
                    onChange={(e) => handleSessionChange('session_format', e.target.value)}
                    label="Session Format"
                  >
                    {sessionFormats.map((format) => (
                      <MenuItem key={format.value} value={format.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <format.icon />
                          {format.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Location</InputLabel>
                  <Select
                    value={currentSession.location}
                    onChange={(e) => handleSessionChange('location', e.target.value)}
                    label="Location"
                  >
                    {locationTypes.map((location) => (
                      <MenuItem key={location.value} value={location.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <location.icon />
                          {location.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Scheduled Time</InputLabel>
                  <Select
                    value={currentSession.scheduled_time}
                    onChange={(e) => handleSessionChange('scheduled_time', e.target.value)}
                    label="Scheduled Time"
                  >
                    {timeOptions.map((time) => (
                      <MenuItem key={time} value={time}>
                        {time}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (minutes)"
                  value={currentSession.duration_minutes}
                  onChange={(e) => handleSessionChange('duration_minutes', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 15, max: 180 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Therapist Name"
                  value={currentSession.therapist_name}
                  onChange={(e) => handleSessionChange('therapist_name', e.target.value)}
                  placeholder="e.g., Dr. Smith, Lisa Johnson PT"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Equipment Needed"
                  value={currentSession.equipment_needed}
                  onChange={(e) => handleSessionChange('equipment_needed', e.target.value)}
                  placeholder="e.g., Walker, Exercise mat, Communication board"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Session Goals"
                  value={currentSession.goals}
                  onChange={(e) => handleSessionChange('goals', e.target.value)}
                  placeholder="e.g., Improve balance, Practice speech exercises, Work on memory recall"
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Preparation Notes"
                  value={currentSession.preparation_notes}
                  onChange={(e) => handleSessionChange('preparation_notes', e.target.value)}
                  placeholder="What to prepare before the session, reminders, special instructions..."
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Homework/Follow-up"
                  value={currentSession.homework_assignments}
                  onChange={(e) => handleSessionChange('homework_assignments', e.target.value)}
                  placeholder="Exercises to practice at home, follow-up tasks..."
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveSession}
                    disabled={!currentSession.name.trim()}
                  >
                    {editingIndex >= 0 ? 'Update Session' : 'Schedule Session'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedTab(0);
                      setEditingIndex(-1);
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={handleSave}>
          Save All Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TherapySessionManager;