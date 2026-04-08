import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Checkbox,
  FormControlLabel,
  Divider,
  Fab,
  Tooltip,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as IncompleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { caregiverApi } from '../../services/apiService';
import { format, parse } from 'date-fns';

const RoutineManager = ({ 
  open, 
  onClose, 
  routineType, 
  patientId, 
  initialActivities = [],
  onSave 
}) => {
  const [activities, setActivities] = useState([]);
  const [editingActivity, setEditingActivity] = useState(null);
  const [newActivity, setNewActivity] = useState({
    name: '',
    description: '',
    scheduled_time: '',
    duration_minutes: 30,
    priority: 'normal',
    is_required: true,
    notes: '',
    completion_status: 'pending'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && patientId) {
      loadRoutineActivities();
    }
  }, [open, patientId, routineType]);

  const loadRoutineActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading routines for:', { patientId, routineType });
      
      const response = await caregiverApi.getPatientRoutines(patientId, routineType);
      
      console.log('Load response:', response);
      
      if (response.success) {
        console.log('Loaded routines:', response.routines);
        setActivities(response.routines || []);
      } else {
        console.log('No saved routines found, using initial activities:', initialActivities);
        // Initialize with provided activities if no saved routines
        const formattedActivities = initialActivities.map((activity, index) => ({
          id: `temp_${index}`,
          name: activity,
          description: '',
          scheduled_time: routineType === 'morning' ? '08:00' : '20:00',
          duration_minutes: 30,
          priority: 'normal',
          is_required: true,
          notes: '',
          completion_status: 'pending',
          created_at: new Date().toISOString()
        }));
        setActivities(formattedActivities);
      }
    } catch (error) {
      console.error('Error loading routine activities:', error);
      setError(`Failed to load routine activities: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = () => {
    if (!newActivity.name.trim()) return;

    const activity = {
      ...newActivity,
      id: `new_${Date.now()}`,
      created_at: new Date().toISOString()
    };

    setActivities([...activities, activity]);
    setNewActivity({
      name: '',
      description: '',
      scheduled_time: '',
      duration_minutes: 30,
      priority: 'normal',
      is_required: true,
      notes: '',
      completion_status: 'pending'
    });
  };

  const handleEditActivity = (activity) => {
    setEditingActivity({ ...activity });
  };

  const handleUpdateActivity = () => {
    if (!editingActivity) return;

    setActivities(activities.map(activity => 
      activity.id === editingActivity.id ? editingActivity : activity
    ));
    setEditingActivity(null);
  };

  const handleDeleteActivity = (activityId) => {
    setActivities(activities.filter(activity => activity.id !== activityId));
  };

  const handleToggleCompletion = async (activityId) => {
    const updatedActivities = activities.map(activity => 
      activity.id === activityId 
        ? { 
            ...activity, 
            completion_status: activity.completion_status === 'completed' ? 'pending' : 'completed',
            completed_at: activity.completion_status === 'completed' ? null : new Date().toISOString()
          }
        : activity
    );
    
    setActivities(updatedActivities);
    
    // Auto-save when completion status changes
    try {
      console.log('Auto-saving routine after completion toggle');
      const response = await caregiverApi.savePatientRoutine(patientId, {
        routine_type: routineType,
        activities: updatedActivities
      });
      
      if (response.success) {
        console.log('Auto-save successful');
        if (onSave) {
          onSave(updatedActivities);
        }
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleSaveRoutine = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Saving routine:', {
        patientId,
        routineType,
        activitiesCount: activities.length,
        activities: activities
      });
      
      const response = await caregiverApi.savePatientRoutine(patientId, {
        routine_type: routineType,
        activities: activities
      });

      console.log('Save response:', response);

      if (response.success) {
        console.log('Routine saved successfully');
        if (onSave) {
          onSave(activities);
        }
        onClose();
      } else {
        console.error('Failed to save routine:', response.error);
        setError(response.error || 'Failed to save routine');
      }
    } catch (error) {
      console.error('Error saving routine:', error);
      setError(`Failed to save routine: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'normal': return 'primary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getCompletionStats = () => {
    const total = activities.length;
    const completed = activities.filter(a => a.completion_status === 'completed').length;
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const stats = getCompletionStats();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {routineType === 'morning' ? 'Morning Routine' : 'Evening Routine'} Management
          </Typography>
          <Chip 
            label={`${stats.completed}/${stats.total} Completed (${stats.percentage}%)`}
            color={stats.percentage === 100 ? 'success' : 'primary'}
            variant="outlined"
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Add New Activity Section */}
        <Card sx={{ mb: 3, backgroundColor: 'rgba(25, 118, 210, 0.04)' }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <AddIcon sx={{ mr: 1 }} />
              Add New Activity
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Activity Name"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Time</InputLabel>
                  <Select
                    value={newActivity.scheduled_time}
                    label="Time"
                    onChange={(e) => setNewActivity({ ...newActivity, scheduled_time: e.target.value })}
                  >
                    {Array.from({ length: 96 }, (_, i) => {
                      const hours = Math.floor(i / 4);
                      const minutes = (i % 4) * 15;
                      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                      const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      });
                      return (
                        <MenuItem key={timeString} value={timeString}>
                          {displayTime}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newActivity.priority}
                    label="Priority"
                    onChange={(e) => setNewActivity({ ...newActivity, priority: e.target.value })}
                  >
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  size="small"
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newActivity.is_required}
                        onChange={(e) => setNewActivity({ ...newActivity, is_required: e.target.checked })}
                      />
                    }
                    label="Required Activity"
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddActivity}
                    disabled={!newActivity.name.trim()}
                  >
                    Add Activity
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Activities List */}
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <ScheduleIcon sx={{ mr: 1 }} />
          Scheduled Activities
        </Typography>
        
        {activities.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No activities scheduled yet. Add some activities to get started.
          </Alert>
        ) : (
          <List>
            {activities
              .sort((a, b) => a.scheduled_time?.localeCompare(b.scheduled_time) || 0)
              .map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem
                    sx={{
                      backgroundColor: activity.completion_status === 'completed' ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                      borderRadius: 1,
                      mb: 1,
                      border: '1px solid',
                      borderColor: activity.completion_status === 'completed' ? 'success.light' : 'divider'
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                        {activity.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                        <Chip
                          label={activity.scheduled_time}
                          size="small"
                          icon={<TimerIcon />}
                          variant="outlined"
                        />
                        <Chip
                          label={activity.priority}
                          size="small"
                          color={getPriorityColor(activity.priority)}
                          variant="outlined"
                        />
                        {activity.is_required && (
                          <Chip label="Required" size="small" color="warning" variant="outlined" />
                        )}
                      </Box>
                      {activity.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {activity.description}
                        </Typography>
                      )}
                      {activity.completion_status === 'completed' && activity.completed_at && (
                        <Typography variant="caption" color="success.main">
                          Completed at {format(new Date(activity.completed_at), 'HH:mm')}
                        </Typography>
                      )}
                    </Box>
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title={activity.completion_status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleCompletion(activity.id)}
                            color={activity.completion_status === 'completed' ? 'success' : 'default'}
                          >
                            {activity.completion_status === 'completed' ? <CompletedIcon /> : <IncompleteIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Activity">
                          <IconButton size="small" onClick={() => handleEditActivity(activity)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Activity">
                          <IconButton size="small" onClick={() => handleDeleteActivity(activity.id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < activities.length - 1 && <Divider />}
                </React.Fragment>
              ))}
          </List>
        )}

        {/* Edit Activity Dialog */}
        {editingActivity && (
          <Dialog open={true} onClose={() => setEditingActivity(null)} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Activity Name"
                    value={editingActivity.name}
                    onChange={(e) => setEditingActivity({ ...editingActivity, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Time</InputLabel>
                    <Select
                      value={editingActivity.scheduled_time}
                      label="Time"
                      onChange={(e) => setEditingActivity({ ...editingActivity, scheduled_time: e.target.value })}
                    >
                      {Array.from({ length: 96 }, (_, i) => {
                        const hours = Math.floor(i / 4);
                        const minutes = (i % 4) * 15;
                        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        });
                        return (
                          <MenuItem key={timeString} value={timeString}>
                            {displayTime}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={editingActivity.priority}
                      label="Priority"
                      onChange={(e) => setEditingActivity({ ...editingActivity, priority: e.target.value })}
                    >
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="low">Low</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={editingActivity.description}
                    onChange={(e) => setEditingActivity({ ...editingActivity, description: e.target.value })}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editingActivity.is_required}
                        onChange={(e) => setEditingActivity({ ...editingActivity, is_required: e.target.checked })}
                      />
                    }
                    label="Required Activity"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditingActivity(null)} startIcon={<CancelIcon />}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleUpdateActivity}
                startIcon={<SaveIcon />}
              >
                Save Changes
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSaveRoutine}
          disabled={loading}
          startIcon={<SaveIcon />}
        >
          {loading ? 'Saving...' : 'Save Routine'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoutineManager;