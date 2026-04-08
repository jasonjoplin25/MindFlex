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
  People as SocialIcon,
  Person as IndividualIcon,
  Group as GroupIcon,
  Home as FamilyIcon,
  Call as PhoneIcon,
  Videocam as VideoIcon,
  LocationOn as OutingIcon,
  AccessTime as TimeIcon,
  EmojiPeople as CommunityIcon,
  Favorite as BondingIcon,
  RecordVoiceOver as ConversationIcon,
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

const SocialEngagementManager = ({ 
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
    activity_type: 'family_visit',
    interaction_type: 'in_person',
    scheduled_time: '14:00',
    duration_minutes: 60,
    participants: '',
    location: '',
    preparation_notes: '',
    conversation_topics: '',
    mood_goals: '',
    accessibility_notes: '',
    transport_needed: false,
    completion_status: 'pending'
  });
  const [editingIndex, setEditingIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);

  // Social activity types with descriptions
  const activityTypes = [
    { value: 'family_visit', label: 'Family Visit', icon: FamilyIcon, color: 'primary', description: 'Quality time with family members', defaultDuration: 90 },
    { value: 'friend_meetup', label: 'Friend Meetup', icon: GroupIcon, color: 'secondary', description: 'Social interaction with friends', defaultDuration: 60 },
    { value: 'community_event', label: 'Community Event', icon: CommunityIcon, color: 'success', description: 'Local community gatherings', defaultDuration: 120 },
    { value: 'support_group', label: 'Support Group', icon: GroupIcon, color: 'info', description: 'Peer support and sharing', defaultDuration: 90 },
    { value: 'recreational_activity', label: 'Recreational Activity', icon: BondingIcon, color: 'warning', description: 'Fun social activities and hobbies', defaultDuration: 60 },
    { value: 'conversation_time', label: 'Conversation Time', icon: ConversationIcon, color: 'error', description: 'Focused talking and listening', defaultDuration: 30 }
  ];

  const interactionTypes = [
    { value: 'in_person', label: 'In Person', icon: IndividualIcon, description: 'Face-to-face interaction' },
    { value: 'phone_call', label: 'Phone Call', icon: PhoneIcon, description: 'Voice conversation via phone' },
    { value: 'video_call', label: 'Video Call', icon: VideoIcon, description: 'Video conversation online' },
    { value: 'outing', label: 'Outing', icon: OutingIcon, description: 'Activity outside the home' }
  ];

  useEffect(() => {
    loadSavedActivities();
  }, [open, patientId]);

  const loadSavedActivities = async () => {
    if (!patientId) return;
    
    try {
      setLoading(true);
      const response = await caregiverApi.getPatientRoutines(patientId, 'social_engagement');
      
      if (response.success && response.routines) {
        setActivities(response.routines);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading saved social activities:', error);
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
      activity_type: 'family_visit',
      interaction_type: 'in_person',
      scheduled_time: '14:00',
      duration_minutes: 60,
      participants: '',
      location: '',
      preparation_notes: '',
      conversation_topics: '',
      mood_goals: '',
      accessibility_notes: '',
      transport_needed: false,
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
      id: currentActivity.id || `social_${Date.now()}`,
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
      activity_type: 'family_visit',
      interaction_type: 'in_person',
      scheduled_time: '14:00',
      duration_minutes: 60,
      participants: '',
      location: '',
      preparation_notes: '',
      conversation_topics: '',
      mood_goals: '',
      accessibility_notes: '',
      transport_needed: false,
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
        routine_type: 'social_engagement',
        activities: activityList.map(activity => ({
          name: activity.name,
          activity_type: activity.activity_type,
          interaction_type: activity.interaction_type,
          scheduled_time: activity.scheduled_time,
          duration_minutes: activity.duration_minutes,
          participants: activity.participants || '',
          location: activity.location || '',
          preparation_notes: activity.preparation_notes || '',
          conversation_topics: activity.conversation_topics || '',
          mood_goals: activity.mood_goals || '',
          accessibility_notes: activity.accessibility_notes || '',
          transport_needed: activity.transport_needed || false,
          completion_status: activity.completion_status || 'pending'
        }))
      };

      const response = await caregiverApi.savePatientRoutine(patientId, routineData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to save social activities');
      }
      
      console.log('Social engagement activities saved successfully');
    } catch (error) {
      console.error('Error saving social activities:', error);
      setError('Failed to save social activities. Please try again.');
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
    return <SocialIcon />;
  };

  const getInteractionTypeIcon = (type) => {
    const typeConfig = interactionTypes.find(t => t.value === type);
    if (typeConfig) {
      const Icon = typeConfig.icon;
      return <Icon fontSize="small" />;
    }
    return <IndividualIcon fontSize="small" />;
  };

  const getCompletionStats = () => {
    const completed = activities.filter(activity => activity.completion_status === 'completed').length;
    const total = activities.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Social Engagement Planner</Typography>
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
            <Tab label="Social Activities" />
            <Tab label="Add/Edit Activity" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Social Activities Tab */}
        {selectedTab === 0 && (
          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Social Engagement Schedule</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      handleAddActivity();
                      setSelectedTab(1);
                    }}
                  >
                    Plan Activity
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
                            Click to plan
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                {activities.length === 0 ? (
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No social activities planned yet.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Plan social interactions to support emotional well-being and connection.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        handleAddActivity();
                        setSelectedTab(1);
                      }}
                    >
                      Plan First Activity
                    </Button>
                  </Paper>
                ) : (
                  <Grid container spacing={2}>
                    {activities
                      .sort((a, b) => a.scheduled_time?.localeCompare(b.scheduled_time) || 0)
                      .map((activity, index) => (
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
                                  label={activity.completion_status === 'completed' ? 'Completed' : 'Planned'}
                                  color={activity.completion_status === 'completed' ? 'success' : 'default'}
                                  variant={activity.completion_status === 'completed' ? 'filled' : 'outlined'}
                                />
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {activityTypes.find(t => t.value === activity.activity_type)?.label || 'Social Activity'}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <TimeIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                  {activity.scheduled_time} - {activity.duration_minutes} minutes
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                {getInteractionTypeIcon(activity.interaction_type)}
                                <Typography variant="body2">
                                  {interactionTypes.find(t => t.value === activity.interaction_type)?.label || activity.interaction_type}
                                </Typography>
                              </Box>

                              {activity.participants && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  👥 {activity.participants}
                                </Typography>
                              )}

                              {activity.location && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  📍 {activity.location}
                                </Typography>
                              )}

                              {activity.mood_goals && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  🎯 {activity.mood_goals}
                                </Typography>
                              )}

                              {activity.transport_needed && (
                                <Chip
                                  label="🚗 Transport needed"
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                  sx={{ mt: 1 }}
                                />
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
              {editingIndex >= 0 ? 'Edit Social Activity' : 'Plan New Social Activity'}
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
                    onChange={(e) => {
                      const selectedType = activityTypes.find(t => t.value === e.target.value);
                      handleActivityChange('activity_type', e.target.value);
                      if (selectedType) {
                        handleActivityChange('duration_minutes', selectedType.defaultDuration);
                      }
                    }}
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
                  <InputLabel>Interaction Type</InputLabel>
                  <Select
                    value={currentActivity.interaction_type}
                    onChange={(e) => handleActivityChange('interaction_type', e.target.value)}
                    label="Interaction Type"
                  >
                    {interactionTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <type.icon />
                          <Box>
                            <Typography variant="body2">{type.label}</Typography>
                            <Typography variant="caption" color="text.secondary">{type.description}</Typography>
                          </Box>
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
                  inputProps={{ min: 15, max: 300 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Participants"
                  value={currentActivity.participants}
                  onChange={(e) => handleActivityChange('participants', e.target.value)}
                  placeholder="e.g., Mom, Dad, Sister Sarah"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={currentActivity.location}
                  onChange={(e) => handleActivityChange('location', e.target.value)}
                  placeholder="e.g., Home, Park, Community Center"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Conversation Topics"
                  value={currentActivity.conversation_topics}
                  onChange={(e) => handleActivityChange('conversation_topics', e.target.value)}
                  placeholder="e.g., Family memories, current events, shared interests"
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mood/Social Goals"
                  value={currentActivity.mood_goals}
                  onChange={(e) => handleActivityChange('mood_goals', e.target.value)}
                  placeholder="e.g., Reduce loneliness, improve mood, strengthen bonds"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentActivity.transport_needed}
                      onChange={(e) => handleActivityChange('transport_needed', e.target.checked)}
                    />
                  }
                  label="Transportation needed"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Accessibility Notes"
                  value={currentActivity.accessibility_notes}
                  onChange={(e) => handleActivityChange('accessibility_notes', e.target.value)}
                  placeholder="Special accommodations needed, mobility considerations..."
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Preparation Notes"
                  value={currentActivity.preparation_notes}
                  onChange={(e) => handleActivityChange('preparation_notes', e.target.value)}
                  placeholder="What to prepare beforehand, reminders, special considerations..."
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveActivity}
                    disabled={!currentActivity.name.trim()}
                  >
                    {editingIndex >= 0 ? 'Update Activity' : 'Plan Activity'}
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

export default SocialEngagementManager;