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
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CompleteIcon,
  SelfImprovement as WellnessIcon,
  LocalHospital as HealthIcon,
  Psychology as MentalIcon,
  Restaurant as NutritionIcon,
  FitnessCenter as ExerciseIcon,
  Bedtime as RestIcon,
  AccessTime as TimeIcon,
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

const CaregiverSelfCareManager = ({ 
  open, 
  onClose, 
  patientId,
  initialActivities = [],
  onSave 
}) => {
  const [activities, setActivities] = useState([]);
  const [currentActivity, setCurrentActivity] = useState({
    id: null,
    name: '',
    care_type: 'wellness',
    scheduled_time: '10:00',
    duration_minutes: 30,
    priority: 'medium',
    notes: '',
    reminder_enabled: true,
    completion_status: 'pending'
  });
  const [editingIndex, setEditingIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0); // Start on Activity Schedule tab

  // Care types with descriptions
  const careTypes = [
    { value: 'wellness', label: 'Personal Wellness', icon: WellnessIcon, color: 'primary', description: 'Self-care activities for mental and emotional well-being', defaultDuration: 30 },
    { value: 'health', label: 'Health Maintenance', icon: HealthIcon, color: 'error', description: 'Medical appointments and health check-ups', defaultDuration: 60 },
    { value: 'mental_health', label: 'Mental Health', icon: MentalIcon, color: 'secondary', description: 'Stress management and mental health support', defaultDuration: 45 },
    { value: 'nutrition', label: 'Personal Nutrition', icon: NutritionIcon, color: 'success', description: 'Proper meals and hydration for caregiver', defaultDuration: 30 },
    { value: 'exercise', label: 'Physical Exercise', icon: ExerciseIcon, color: 'warning', description: 'Physical activity and fitness for caregiver', defaultDuration: 45 },
    { value: 'rest', label: 'Rest & Recovery', icon: RestIcon, color: 'info', description: 'Adequate sleep and relaxation time', defaultDuration: 60 }
  ];

  const priorities = [
    { value: 'high', label: 'High Priority', color: 'error' },
    { value: 'medium', label: 'Medium Priority', color: 'warning' },
    { value: 'low', label: 'Low Priority', color: 'success' }
  ];

  useEffect(() => {
    loadSavedActivities();
  }, [open, patientId]);

  const loadSavedActivities = async () => {
    if (!patientId) return;
    
    try {
      setLoading(true);
      const response = await caregiverApi.getPatientRoutines(patientId, 'caregiver_self_care');
      
      if (response.success && response.routines) {
        setActivities(response.routines);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading saved activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityChange = (field, value) => {
    setCurrentActivity(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddActivity = () => {
    setCurrentActivity({
      id: null,
      name: '',
      care_type: 'wellness',
      scheduled_time: '10:00',
      duration_minutes: 30,
      priority: 'medium',
      notes: '',
      reminder_enabled: true,
      completion_status: 'pending'
    });
    setEditingIndex(-1);
    setError(null);
  };

  const handleDeleteActivity = async (index) => {
    const updatedActivities = activities.filter((_, i) => i !== index);
    setActivities(updatedActivities);
    await saveActivitiesToBackend(updatedActivities);
  };

  const handleToggleCompletion = async (index) => {
    const updatedActivities = activities.map((activity, i) => {
      if (i === index) {
        return {
          ...activity,
          completion_status: activity.completion_status === 'completed' ? 'pending' : 'completed'
        };
      }
      return activity;
    });
    
    setActivities(updatedActivities);
    await saveActivitiesToBackend(updatedActivities);
  };

  const saveActivitiesToBackend = async (activityList) => {
    if (!patientId) return;

    try {
      const routineData = {
        routine_type: 'caregiver_self_care',
        activities: activityList.map(activity => ({
          name: activity.name,
          care_type: activity.care_type,
          scheduled_time: activity.scheduled_time,
          duration_minutes: activity.duration_minutes,
          priority: activity.priority,
          notes: activity.notes || '',
          reminder_enabled: activity.reminder_enabled,
          completion_status: activity.completion_status || 'pending'
        }))
      };

      const response = await caregiverApi.savePatientRoutine(patientId, routineData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to save activities');
      }
      
      console.log('Self-care activities saved successfully');
    } catch (error) {
      console.error('Error saving activities:', error);
      setError('Failed to save activities. Please try again.');
    }
  };

  const handleSave = async () => {
    await saveActivitiesToBackend(activities);
    if (onSave) onSave(activities);
    onClose();
  };

  const getCareTypeInfo = (type) => {
    const typeConfig = careTypes.find(t => t.value === type);
    if (typeConfig) {
      const Icon = typeConfig.icon;
      return { icon: <Icon color={typeConfig.color} />, label: typeConfig.label, config: typeConfig };
    }
    return { icon: <WellnessIcon />, label: 'Wellness', config: careTypes[0] };
  };

  const getCompletionStats = () => {
    const completed = activities.filter(activity => activity.completion_status === 'completed').length;
    const total = activities.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const handleAddActivityToList = () => {
    if (!currentActivity.name.trim()) {
      setError('Please enter an activity name');
      return;
    }

    const newActivity = {
      ...currentActivity,
      id: editingIndex >= 0 ? activities[editingIndex].id : Date.now()
    };

    let updatedActivities;
    if (editingIndex >= 0) {
      // Editing existing activity
      updatedActivities = activities.map((activity, index) => 
        index === editingIndex ? newActivity : activity
      );
    } else {
      // Adding new activity
      updatedActivities = [...activities, newActivity];
    }

    setActivities(updatedActivities);
    saveActivitiesToBackend(updatedActivities);
    
    // Reset form and go to activity list
    handleAddActivity();
    setSelectedTab(0);
    setError(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Caregiver Self-Care Planner</Typography>
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
            <Tab label="Activity Schedule" />
            <Tab label="Add/Edit Activity" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Activity Schedule Tab */}
        {selectedTab === 0 && (
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Self-Care Activity Schedule</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      handleAddActivity();
                      setSelectedTab(1);
                    }}
                  >
                    Schedule Activity
                  </Button>
                </Box>

                {/* Care Types Overview */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {careTypes.map((type) => (
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
                          // Pre-populate the form with this care type
                          setCurrentActivity({
                            ...currentActivity,
                            care_type: type.value,
                            duration_minutes: type.defaultDuration,
                            name: type.description // Pre-fill with the type description
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

                {activities.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No self-care activities scheduled yet.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Schedule self-care activities to maintain your well-being while caregiving.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        handleAddActivity();
                        setSelectedTab(1);
                      }}
                    >
                      Schedule First Activity
                    </Button>
                  </Paper>
                ) : (
                  <Grid container spacing={2}>
                    {activities
                      .sort((a, b) => a.scheduled_time?.localeCompare(b.scheduled_time) || 0)
                      .map((activity, index) => {
                        const careInfo = getCareTypeInfo(activity.care_type);
                        const priorityInfo = priorities.find(p => p.value === activity.priority);
                        return (
                          <Grid item xs={12} md={6} key={activity.id || index}>
                            <Card sx={{ height: '100%' }}>
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {careInfo.icon}
                                    <Typography variant="h6" component="h3">
                                      {activity.name}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Chip
                                      size="small"
                                      label={priorityInfo?.label}
                                      color={priorityInfo?.color}
                                      variant="outlined"
                                    />
                                    <Chip
                                      size="small"
                                      label={activity.completion_status === 'completed' ? 'Completed' : 'Scheduled'}
                                      color={activity.completion_status === 'completed' ? 'success' : 'default'}
                                      variant={activity.completion_status === 'completed' ? 'filled' : 'outlined'}
                                    />
                                  </Box>
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  {careInfo.label}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <TimeIcon fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    {activity.scheduled_time} - {activity.duration_minutes} minutes
                                  </Typography>
                                </Box>

                                {activity.notes && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {activity.notes}
                                  </Typography>
                                )}
                              </CardContent>
                              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                                <Box>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleToggleCompletion(index)}
                                    color={activity.completion_status === 'completed' ? 'success' : 'default'}
                                  >
                                    <CompleteIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setCurrentActivity(activity);
                                      setEditingIndex(index);
                                      setSelectedTab(1);
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteActivity(index)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </CardActions>
                            </Card>
                          </Grid>
                        );
                      })}
                  </Grid>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Add/Edit Activity Tab */}
        {selectedTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {editingIndex >= 0 ? 'Edit Self-Care Activity' : 'Add New Self-Care Activity'}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Activity Name"
                  value={currentActivity.name}
                  onChange={(e) => handleActivityChange('name', e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Care Type</InputLabel>
                  <Select
                    value={currentActivity.care_type}
                    onChange={(e) => {
                      const selectedType = careTypes.find(t => t.value === e.target.value);
                      handleActivityChange('care_type', e.target.value);
                      if (selectedType) {
                        handleActivityChange('duration_minutes', selectedType.defaultDuration);
                      }
                    }}
                    label="Care Type"
                  >
                    {careTypes.map((type) => (
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
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={currentActivity.priority}
                    onChange={(e) => handleActivityChange('priority', e.target.value)}
                    label="Priority"
                  >
                    {priorities.map((priority) => (
                      <MenuItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Scheduled Time</InputLabel>
                  <Select
                    value={currentActivity.scheduled_time}
                    onChange={(e) => handleActivityChange('scheduled_time', e.target.value)}
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
                  value={currentActivity.duration_minutes}
                  onChange={(e) => handleActivityChange('duration_minutes', parseInt(e.target.value) || 0)}
                  InputProps={{ inputProps: { min: 5, max: 480, step: 5 } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentActivity.reminder_enabled}
                      onChange={(e) => handleActivityChange('reminder_enabled', e.target.checked)}
                    />
                  }
                  label="Enable reminder notifications"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes & Reminders"
                  value={currentActivity.notes}
                  onChange={(e) => handleActivityChange('notes', e.target.value)}
                  placeholder="Additional notes, reminders, or specific requirements..."
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedTab(0);
                      setEditingIndex(-1);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleAddActivityToList}
                    startIcon={<AddIcon />}
                  >
                    {editingIndex >= 0 ? 'Update Activity' : 'Add Activity'}
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

export default CaregiverSelfCareManager;