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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  DirectionsWalk as WalkIcon,
  FitnessCenter as StrengthIcon,
  SelfImprovement as YogaIcon,
  Pool as SwimIcon,
  DirectionsBike as BikeIcon,
  AccessTime as TimeIcon,
  TrendingUp as IntensityIcon,
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

const PhysicalActivityManager = ({ 
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
    activity_type: 'walking',
    intensity: 'low',
    duration_minutes: 30,
    scheduled_time: '09:00',
    location: '',
    equipment_needed: '',
    notes: '',
    completion_status: 'pending'
  });
  const [editingIndex, setEditingIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);

  // Physical activity types with descriptions
  const activityTypes = [
    { value: 'walking', label: 'Walking', icon: WalkIcon, color: 'primary', description: 'Light cardio exercise' },
    { value: 'strength', label: 'Strength Training', icon: StrengthIcon, color: 'secondary', description: 'Muscle building exercises' },
    { value: 'yoga', label: 'Yoga/Stretching', icon: YogaIcon, color: 'success', description: 'Flexibility and balance' },
    { value: 'swimming', label: 'Swimming', icon: SwimIcon, color: 'info', description: 'Full body water exercise' },
    { value: 'cycling', label: 'Cycling', icon: BikeIcon, color: 'warning', description: 'Cardio and leg strengthening' },
    { value: 'other', label: 'Other Activities', icon: WalkIcon, color: 'default', description: 'Custom physical activities' }
  ];

  useEffect(() => {
    loadSavedActivities();
  }, [open, patientId]);

  const loadSavedActivities = async () => {
    if (!patientId) return;
    
    try {
      setLoading(true);
      const response = await caregiverApi.getPatientRoutines(patientId, 'physical_activities');
      
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
      activity_type: 'walking',
      intensity: 'low',
      duration_minutes: 30,
      scheduled_time: '09:00',
      location: '',
      equipment_needed: '',
      notes: '',
      completion_status: 'pending'
    });
    setEditingIndex(-1);
  };

  const handleEditActivity = (index) => {
    const activity = activities[index];
    setCurrentActivity(activity);
    setEditingIndex(index);
  };

  const handleSaveActivity = async () => {
    if (!currentActivity.name.trim()) {
      setError('Activity name is required');
      return;
    }

    const newActivity = {
      ...currentActivity,
      id: currentActivity.id || `activity_${Date.now()}`,
    };

    const updatedActivities = editingIndex >= 0
      ? activities.map((activity, index) => index === editingIndex ? newActivity : activity)
      : [...activities, newActivity];

    setActivities(updatedActivities);
    await saveActivitiesToBackend(updatedActivities);
    
    // Reset form
    setCurrentActivity({
      id: null,
      name: '',
      activity_type: 'walking',
      intensity: 'low',
      duration_minutes: 30,
      scheduled_time: '09:00',
      location: '',
      equipment_needed: '',
      notes: '',
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
        routine_type: 'physical_activities',
        activities: activityList.map(activity => ({
          name: activity.name,
          activity_type: activity.activity_type,
          intensity: activity.intensity,
          duration_minutes: activity.duration_minutes,
          scheduled_time: activity.scheduled_time,
          location: activity.location || '',
          equipment_needed: activity.equipment_needed || '',
          notes: activity.notes || '',
          completion_status: activity.completion_status || 'pending'
        }))
      };

      const response = await caregiverApi.savePatientRoutine(patientId, routineData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to save activities');
      }
      
      console.log('Physical activities saved successfully');
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

  const getActivityTypeIcon = (type) => {
    const typeConfig = activityTypes.find(t => t.value === type);
    if (typeConfig) {
      const Icon = typeConfig.icon;
      return <Icon color={typeConfig.color} />;
    }
    return <WalkIcon />;
  };

  const getCompletionStats = () => {
    const completed = activities.filter(activity => activity.completion_status === 'completed').length;
    const total = activities.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getIntensityColor = (intensity) => {
    switch (intensity) {
      case 'low': return 'success';
      case 'moderate': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Physical Activity Planner</Typography>
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
            <Tab label="Activity List" />
            <Tab label="Add/Edit Activity" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Activity List Tab */}
        {selectedTab === 0 && (
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Planned Physical Activities</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      handleAddActivity();
                      setSelectedTab(1);
                    }}
                  >
                    Add Activity
                  </Button>
                </Box>

                {/* Activity Types Overview */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {activityTypes.map((type) => (
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
                          // Pre-populate the form with this activity type
                          setCurrentActivity({
                            ...currentActivity,
                            activity_type: type.value,
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
                            Click to plan this activity
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                {activities.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No physical activities planned yet.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Add activities to promote physical health and well-being.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        handleAddActivity();
                        setSelectedTab(1);
                      }}
                    >
                      Add First Activity
                    </Button>
                  </Paper>
                ) : (
                  <Grid container spacing={2}>
                    {activities.map((activity, index) => (
                      <Grid item xs={12} md={6} key={activity.id || index}>
                        <Card sx={{ height: '100%' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getActivityTypeIcon(activity.activity_type)}
                                <Typography variant="h6" component="h3">
                                  {activity.name}
                                </Typography>
                              </Box>
                              <Chip
                                size="small"
                                label={activity.completion_status === 'completed' ? 'Completed' : 'Pending'}
                                color={activity.completion_status === 'completed' ? 'success' : 'default'}
                                variant={activity.completion_status === 'completed' ? 'filled' : 'outlined'}
                              />
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {activityTypes.find(t => t.value === activity.activity_type)?.label || 'Unknown Type'}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <TimeIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {activity.scheduled_time} - {activity.duration_minutes} minutes
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <IntensityIcon fontSize="small" color="action" />
                              <Chip
                                label={`${activity.intensity} intensity`}
                                size="small"
                                color={getIntensityColor(activity.intensity)}
                                variant="outlined"
                              />
                            </Box>

                            {activity.location && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                📍 {activity.location}
                              </Typography>
                            )}

                            {activity.equipment_needed && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                🛠️ {activity.equipment_needed}
                              </Typography>
                            )}
                            
                            {activity.notes && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {activity.notes}
                              </Typography>
                            )}
                          </CardContent>
                          
                          <CardActions sx={{ justifyContent: 'space-between' }}>
                            <Box>
                              <Tooltip title="Edit Activity">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    handleEditActivity(index);
                                    setSelectedTab(1);
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Activity">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteActivity(index)}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            
                            <Box>
                              <Tooltip title={activity.completion_status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleCompletion(index)}
                                  color={activity.completion_status === 'completed' ? 'success' : 'default'}
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

        {/* Add/Edit Activity Tab */}
        {selectedTab === 1 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {editingIndex >= 0 ? 'Edit Physical Activity' : 'Add New Physical Activity'}
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
                  <InputLabel>Activity Type</InputLabel>
                  <Select
                    value={currentActivity.activity_type}
                    onChange={(e) => handleActivityChange('activity_type', e.target.value)}
                    label="Activity Type"
                  >
                    {activityTypes.map((type) => (
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
                  <InputLabel>Intensity</InputLabel>
                  <Select
                    value={currentActivity.intensity}
                    onChange={(e) => handleActivityChange('intensity', e.target.value)}
                    label="Intensity"
                  >
                    <MenuItem value="low">Low Intensity</MenuItem>
                    <MenuItem value="moderate">Moderate Intensity</MenuItem>
                    <MenuItem value="high">High Intensity</MenuItem>
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
                  inputProps={{ min: 1, max: 180 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={currentActivity.location}
                  onChange={(e) => handleActivityChange('location', e.target.value)}
                  placeholder="e.g., Park, Gym, Home"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Equipment Needed"
                  value={currentActivity.equipment_needed}
                  onChange={(e) => handleActivityChange('equipment_needed', e.target.value)}
                  placeholder="e.g., Walking shoes, Yoga mat, Dumbbells"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={currentActivity.notes}
                  onChange={(e) => handleActivityChange('notes', e.target.value)}
                  placeholder="Any special instructions, modifications, or goals for this activity..."
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveActivity}
                    disabled={!currentActivity.name.trim()}
                  >
                    {editingIndex >= 0 ? 'Update Activity' : 'Add Activity'}
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

export default PhysicalActivityManager;