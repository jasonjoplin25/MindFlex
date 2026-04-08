import React, { useEffect, useState } from 'react';
import {
  Alert,
  Snackbar,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import {
  Alarm as AlarmIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { caregiverApi } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const ReminderNotificationSystem = ({ patientId }) => {
  const { user } = useAuth();
  const [activeNotification, setActiveNotification] = useState(null);
  const [checkedReminders, setCheckedReminders] = useState(new Set());

  // Check for due reminders every minute
  useEffect(() => {
    if (!patientId || user?.user_type !== 'caregiver') {
      return;
    }

    const checkReminders = async () => {
      try {
        const response = await caregiverApi.getPatientReminders(patientId);
        
        if (response.success && response.reminders) {
          const now = new Date();
          const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                             now.getMinutes().toString().padStart(2, '0');
          const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

          // Find reminders that should be triggered now
          const dueReminders = response.reminders.filter(reminder => {
            if (!reminder.active) return false;
            
            // Check if reminder is for today
            if (reminder.recurring && reminder.days_of_week && 
                !reminder.days_of_week.includes(currentDay)) {
              return false;
            }

            // Check if it's the right time (within 1 minute window)
            const reminderTime = reminder.time; // Format: "HH:MM"
            if (reminderTime === currentTime) {
              // Create unique key for this reminder at this time
              const reminderKey = `${reminder.id}-${currentTime}`;
              
              // Only show if we haven't already shown this reminder today
              if (!checkedReminders.has(reminderKey)) {
                setCheckedReminders(prev => new Set([...prev, reminderKey]));
                return true;
              }
            }
            
            return false;
          });

          // Show notification for the first due reminder (if any)
          if (dueReminders.length > 0 && !activeNotification) {
            const reminder = dueReminders[0];
            setActiveNotification({
              id: reminder.id,
              message: reminder.message,
              type: reminder.type,
              timestamp: new Date().toISOString()
            });

            // Also show browser notification if supported
            if (reminder.type === 'App Notification' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification('MindFlex Reminder', {
                  body: reminder.message,
                  icon: '/favicon.ico',
                  badge: '/favicon.ico',
                });
              } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') {
                    new Notification('MindFlex Reminder', {
                      body: reminder.message,
                      icon: '/favicon.ico',
                      badge: '/favicon.ico',
                    });
                  }
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking reminders:', error);
      }
    };

    // Check immediately
    checkReminders();

    // Set up interval to check every minute
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [patientId, user, activeNotification, checkedReminders]);

  // Clear checked reminders at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timeout = setTimeout(() => {
      setCheckedReminders(new Set());
    }, timeUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

  const handleClose = () => {
    setActiveNotification(null);
  };

  if (!activeNotification) {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 20, 
      right: 20, 
      zIndex: 10000,
      minWidth: 350,
      maxWidth: 500
    }}>
      <Alert
        severity="info"
        variant="filled"
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        icon={<AlarmIcon />}
        sx={{
          backgroundColor: '#1976d2',
          color: 'white',
          boxShadow: 3,
          borderRadius: 2,
          '& .MuiAlert-action': {
            alignItems: 'flex-start',
            pt: 0.5
          }
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Reminder Alert
          </Typography>
          <Typography variant="body2">
            {activeNotification.message}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
            {new Date(activeNotification.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>
      </Alert>
    </div>
  );
};

export default ReminderNotificationSystem;