import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Alert,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Alarm as AlarmIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Message as MessageIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Repeat as RepeatIcon,
  CalendarToday as CalendarIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { motion } from 'framer-motion';
import { caregiverApi } from '../../services/apiService';

// Mock data for patient reminders
const generateMockReminders = (patientId) => {
  const reminderTypes = ['SMS', 'Email', 'App Notification'];
  const messages = [
    'Time for your daily brain training!',
    'Don\'t forget your cognitive exercise today',
    'Your MindFlex session is scheduled now',
    'Ready for your memory workout?',
    'Time to strengthen your cognitive skills!',
  ];
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const reminders = [];
  
  // Generate 3-5 reminders
  const count = Math.floor(Math.random() * 3) + 3;
  
  for (let i = 0; i < count; i++) {
    const hours = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
    const minutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
    
    const reminder = {
      id: `reminder-${patientId}-${i}`,
      type: reminderTypes[Math.floor(Math.random() * reminderTypes.length)],
      time: new Date(2023, 0, 1, hours, minutes),
      message: messages[Math.floor(Math.random() * messages.length)],
      active: Math.random() > 0.2, // 80% chance of being active
      recurring: Math.random() > 0.3, // 70% chance of being recurring
      daysOfWeek: Math.random() > 0.5 // 50% chance of specific days vs daily
        ? days.filter(() => Math.random() > 0.5) // Randomly select days
        : [...days], // All days
    };
    
    // Ensure at least one day is selected
    if (reminder.daysOfWeek.length === 0) {
      reminder.daysOfWeek = [days[Math.floor(Math.random() * days.length)]];
    }
    
    reminders.push(reminder);
  }
  
  return reminders;
};

// Component for reminder form
const ReminderForm = ({ reminder, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'App Notification',
    time: new Date(),
    message: 'Time for your daily brain training!',
    active: true,
    recurring: true,
    daysOfWeek: ['Monday', 'Wednesday', 'Friday'],
    ...reminder,
  });
  
  const [errors, setErrors] = useState({});
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    
    // Clear error when field is updated
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null,
      });
    }
  };
  
  const toggleDay = (day) => {
    const currentDays = [...formData.daysOfWeek];
    const index = currentDays.indexOf(day);
    
    if (index === -1) {
      currentDays.push(day);
    } else {
      currentDays.splice(index, 1);
    }
    
    handleChange('daysOfWeek', currentDays);
  };
  
  const handleSave = () => {
    // Validate form
    const newErrors = {};
    
    if (!formData.message || formData.message.trim() === '') {
      newErrors.message = 'Message is required';
    }
    
    if (formData.recurring && formData.daysOfWeek.length === 0) {
      newErrors.daysOfWeek = 'Please select at least one day';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave(formData);
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            {reminder ? 'Edit Reminder' : 'Create New Reminder'}
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Reminder Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              label="Reminder Type"
            >
              <MenuItem value="SMS">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MessageIcon sx={{ mr: 1 }} /> SMS
                </Box>
              </MenuItem>
              <MenuItem value="Email">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon sx={{ mr: 1 }} /> Email
                </Box>
              </MenuItem>
              <MenuItem value="App Notification">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <NotificationsIcon sx={{ mr: 1 }} /> App Notification
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <TimePicker
              label="Reminder Time"
              value={formData.time}
              onChange={(newTime) => handleChange('time', newTime)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Reminder Message"
            value={formData.message}
            onChange={(e) => handleChange('message', e.target.value)}
            error={!!errors.message}
            helperText={errors.message}
            multiline
            rows={2}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.active}
                onChange={(e) => handleChange('active', e.target.checked)}
                color="primary"
              />
            }
            label="Active"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.recurring}
                onChange={(e) => handleChange('recurring', e.target.checked)}
                color="primary"
              />
            }
            label="Recurring"
          />
        </Grid>
        
        {formData.recurring && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Days of Week
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {days.map((day) => (
                <Chip
                  key={day}
                  label={day.substring(0, 3)}
                  color={formData.daysOfWeek.includes(day) ? 'primary' : 'default'}
                  onClick={() => toggleDay(day)}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
            {errors.daysOfWeek && (
              <Typography color="error" variant="caption">
                {errors.daysOfWeek}
              </Typography>
            )}
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSave}
              startIcon={<SaveIcon />}
            >
              Save Reminder
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

// Main Reminder System component
const ReminderSystem = ({ patient }) => {
  const theme = useTheme();
  
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  useEffect(() => {
    const fetchReminders = async () => {
      if (!patient?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        const response = await caregiverApi.getPatientReminders(patient.id);
        
        if (response.success) {
          // Transform API response to component format
          const transformedReminders = response.reminders.map(reminder => ({
            id: reminder.id,
            type: reminder.type,
            time: new Date(`2023-01-01T${reminder.time}:00`), // Convert time string to Date
            message: reminder.message,
            active: reminder.active,
            recurring: reminder.recurring,
            daysOfWeek: reminder.days_of_week || []
          }));
          
          setReminders(transformedReminders);
        } else {
          console.error('Failed to fetch reminders:', response.error);
          setReminders([]);
        }
      } catch (error) {
        console.error('Error fetching reminders:', error);
        setReminders([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReminders();
  }, [patient?.id]);
  
  const handleCreateReminder = () => {
    setCurrentReminder(null);
    setOpenDialog(true);
  };
  
  const handleEditReminder = (reminder) => {
    setCurrentReminder(reminder);
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleSaveReminder = async (reminderData) => {
    try {
      if (!patient?.id) {
        setSnackbar({
          open: true,
          message: 'No patient selected',
          severity: 'error',
        });
        return;
      }

      // Transform time from Date to string
      const timeString = reminderData.time instanceof Date 
        ? reminderData.time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
        : '09:00';

      const apiData = {
        type: reminderData.type,
        message: reminderData.message,
        time: timeString,
        active: reminderData.active,
        recurring: reminderData.recurring,
        days_of_week: reminderData.daysOfWeek
      };

      let response;
      
      if (currentReminder) {
        // Update existing reminder
        response = await caregiverApi.updateReminder(patient.id, currentReminder.id, apiData);
        
        if (response.success) {
          // Update reminder in local state
          const updatedReminder = {
            ...reminderData,
            id: currentReminder.id,
          };
          setReminders(reminders.map((rem) => 
            rem.id === currentReminder.id ? updatedReminder : rem
          ));
          setSnackbar({
            open: true,
            message: 'Reminder updated successfully',
            severity: 'success',
          });
        } else {
          throw new Error(response.error || 'Failed to update reminder');
        }
      } else {
        // Create new reminder
        response = await caregiverApi.createReminder(patient.id, apiData);
        
        if (response.success) {
          // Add new reminder to local state
          const newReminder = {
            ...reminderData,
            id: response.reminder.id,
          };
          setReminders([...reminders, newReminder]);
          setSnackbar({
            open: true,
            message: 'Reminder created successfully',
            severity: 'success',
          });
        } else {
          throw new Error(response.error || 'Failed to create reminder');
        }
      }
      
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving reminder:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save reminder',
        severity: 'error',
      });
    }
  };
  
  const handleDeleteReminder = async (id) => {
    // Add confirmation dialog
    if (!window.confirm('Are you sure you want to delete this reminder?')) {
      return;
    }

    try {
      if (!patient?.id) {
        setSnackbar({
          open: true,
          message: 'No patient selected',
          severity: 'error',
        });
        return;
      }

      const response = await caregiverApi.deleteReminder(patient.id, id);
      
      if (response.success) {
        setReminders(reminders.filter((rem) => rem.id !== id));
        setSnackbar({
          open: true,
          message: 'Reminder deleted successfully',
          severity: 'success',
        });
      } else {
        throw new Error(response.error || 'Failed to delete reminder');
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete reminder',
        severity: 'error',
      });
    }
  };
  
  const handleToggleReminder = async (id) => {
    try {
      if (!patient?.id) {
        setSnackbar({
          open: true,
          message: 'No patient selected',
          severity: 'error',
        });
        return;
      }

      const response = await caregiverApi.toggleReminder(patient.id, id);
      
      if (response.success) {
        setReminders(reminders.map((rem) => 
          rem.id === id ? { ...rem, active: !rem.active } : rem
        ));
        
        const isNowActive = reminders.find(rem => rem.id === id)?.active === false;
        
        setSnackbar({
          open: true,
          message: `Reminder ${isNowActive ? 'activated' : 'deactivated'} successfully`,
          severity: 'info',
        });
      } else {
        throw new Error(response.error || 'Failed to toggle reminder');
      }
    } catch (error) {
      console.error('Error toggling reminder:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to toggle reminder',
        severity: 'error',
      });
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };
  
  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get icon based on reminder type
  const getReminderTypeIcon = (type) => {
    switch (type) {
      case 'SMS':
        return <MessageIcon />;
      case 'Email':
        return <EmailIcon />;
      case 'App Notification':
        return <NotificationsIcon />;
      default:
        return <AlarmIcon />;
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Reminder System</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateReminder}
        >
          Create Reminder
        </Button>
      </Box>
      
      <Paper
        sx={{
          p: 3,
          background: theme => theme.palette.mode === 'dark'
            ? 'rgba(19, 47, 76, 0.4)'
            : 'rgba(255, 255, 255, 0.8)',
          borderRadius: 2,
        }}
      >
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading reminders...</Typography>
          </Box>
        ) : reminders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <NotificationsOffIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Reminders Set
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Create reminders to help the patient maintain a consistent training schedule.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCreateReminder}
            >
              Create First Reminder
            </Button>
          </Box>
        ) : (
          <List>
            {reminders.map((reminder) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ListItem
                  sx={{
                    mb: 2,
                    p: 2,
                    backgroundColor: reminder.active
                      ? theme.palette.background.paper
                      : theme.palette.action.disabledBackground,
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                          {getReminderTypeIcon(reminder.type)}
                          <Typography variant="subtitle1" component="span" sx={{ ml: 1 }}>
                            {reminder.type}
                          </Typography>
                        </Box>
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                          <AlarmIcon fontSize="small" sx={{ mr: 0.5 }} />
                          <Typography variant="body2" component="span">
                            {formatTime(reminder.time)}
                          </Typography>
                        </Box>
                        {reminder.active ? (
                          <Chip 
                            size="small" 
                            color="success" 
                            label="Active"
                            icon={<NotificationsActiveIcon />}
                            sx={{ ml: 2 }}
                          />
                        ) : (
                          <Chip 
                            size="small" 
                            color="default" 
                            label="Inactive"
                            icon={<NotificationsOffIcon />}
                            sx={{ ml: 2 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          {reminder.message}
                        </Typography>
                        {reminder.recurring && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <RepeatIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {reminder.daysOfWeek.map((day) => (
                                <Chip
                                  key={day}
                                  label={day.substring(0, 3)}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title={reminder.active ? 'Deactivate' : 'Activate'}>
                        <IconButton
                          edge="end"
                          onClick={() => handleToggleReminder(reminder.id)}
                          color={reminder.active ? 'primary' : 'default'}
                        >
                          {reminder.active ? <NotificationsActiveIcon /> : <NotificationsOffIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          edge="end"
                          onClick={() => handleEditReminder(reminder)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteReminder(reminder.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              </motion.div>
            ))}
          </List>
        )}
      </Paper>
      
      {/* Reminder Form Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogContent>
          <ReminderForm
            reminder={currentReminder}
            onSave={handleSaveReminder}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
      
      {/* Snackbar for notifications */}
      {snackbar.open && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity || 'info'}
            variant="filled"
            sx={{ 
              minWidth: 300,
              boxShadow: 3
            }}
          >
            {snackbar.message}
          </Alert>
        </div>
      )}
    </Box>
  );
};

export default ReminderSystem; 