import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Search as SearchIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { caregiverApi } from '../../services/apiService';

const conditions = [
  'Mild Cognitive Impairment',
  'Early Stage Dementia',
  'Moderate Dementia',
  'Memory Loss',
  'Cognitive Decline',
  'Other',
];

const AddPatientDialog = ({ open, onClose, onAdd }) => {
  const [tabValue, setTabValue] = useState(0); // 0 = Search Existing, 1 = Create New
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    age: '',
    gender: '',
    condition: '',
    notes: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searching, setSearching] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (tabValue === 1) { // Create new patient
      if (!formData.first_name.trim()) {
        newErrors.first_name = 'First name is required';
      }

      if (!formData.last_name.trim()) {
        newErrors.last_name = 'Last name is required';
      }

      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      
      // For new patients, age and gender are required
      if (!formData.age) {
        newErrors.age = 'Age is required';
      } else if (formData.age < 0 || formData.age > 120) {
        newErrors.age = 'Please enter a valid age';
      }

      if (!formData.gender) {
        newErrors.gender = 'Gender is required';
      }
    } else if (tabValue === 0) { // Adding existing patient
      // For existing patients, only validate if fields are provided
      if (formData.age && (formData.age < 0 || formData.age > 120)) {
        newErrors.age = 'Please enter a valid age';
      }
      // Gender and age are optional for existing patients
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Search for existing users
  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await caregiverApi.searchUsers(query);
      setSearchResults(response.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
      setErrors({ search: 'Failed to search users. Please try again.' });
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear previous timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // Debounce search by 300ms
    window.searchTimeout = setTimeout(() => {
      searchUsers(query);
    }, 300);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      age: '',
      gender: '',
      condition: '',
      notes: '',
    });
  };

  const handleSubmit = async () => {
    console.log('Submit clicked, tabValue:', tabValue, 'selectedUser:', selectedUser); // Debug log
    
    if (tabValue === 0) {
      // Adding existing patient
      if (!selectedUser) {
        console.log('No user selected'); // Debug log
        setErrors({ search: 'Please select a user to add as patient' });
        return;
      }

      console.log('Validating form...'); // Debug log
      if (!validateForm()) {
        console.log('Form validation failed'); // Debug log
        return;
      }

      try {
        const patientData = {
          user_id: selectedUser.id,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender || null,
          condition: formData.condition || null,
          notes: formData.notes || '',
        };

        console.log('Adding patient with data:', patientData); // Debug log
        const response = await caregiverApi.addExistingPatient(patientData);
        console.log('Add patient response:', response); // Debug log
        
        if (response.success) {
          onAdd(response.patient);
          handleClose();
        } else {
          // Handle specific error cases
          let errorMessage = response.error || 'Failed to add patient';
          
          if (response.code === 'ALREADY_ASSIGNED') {
            errorMessage = 'This patient is already assigned to your care.';
          } else if (response.code === 'USER_NOT_FOUND') {
            errorMessage = 'User not found or is not a patient account.';
          } else if (response.code === 'CAREGIVER_NOT_FOUND') {
            errorMessage = 'Your caregiver account was not found. Please contact support.';
          }
          
          setErrors({ submit: errorMessage });
        }
      } catch (error) {
        console.error('Error adding existing patient:', error);
        setErrors({ submit: 'Failed to add patient. Please try again.' });
      }
    } else {
      // Creating new patient
      console.log('Creating new patient...'); // Debug log
      if (validateForm()) {
        onAdd(formData);
        handleClose();
      }
    }
  };

  const handleClose = () => {
    setTabValue(0);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      age: '',
      gender: '',
      condition: '',
      notes: '',
    });
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    setErrors({});
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        sx: {
          background: 'rgba(19, 47, 76, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div">
          Add Patient
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Tabs for switching between modes */}
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
            <Tab 
              icon={<SearchIcon />} 
              label="Search Existing" 
              iconPosition="start"
              sx={{ minWidth: 'auto' }}
            />
            <Tab 
              icon={<PersonAddIcon />} 
              label="Create New" 
              iconPosition="start"
              sx={{ minWidth: 'auto' }}
            />
          </Tabs>

          {/* Error alerts */}
          {errors.search && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.search}
            </Alert>
          )}
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.submit}
            </Alert>
          )}

          {/* Search Existing Patient Tab */}
          {tabValue === 0 && (
            <Box>
              <TextField
                fullWidth
                label="Search for existing users"
                placeholder="Enter name or email..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: searching && <CircularProgress size={20} />
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              />

              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Search Results:
                  </Typography>
                  {searchResults.length > 0 ? (
                    <List sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1 }}>
                      {searchResults.map((user) => (
                        <ListItem key={user.id} disablePadding>
                          <ListItemButton 
                            onClick={() => handleUserSelect(user)}
                            selected={selectedUser?.id === user.id}
                          >
                            <ListItemText
                              primary={user.name}
                              secondary={user.email}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  ) : !searching && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', p: 2, border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 1 }}>
                      No users found matching your search.
                    </Typography>
                  )}
                </Box>
              )}

              {/* Selected User Display */}
              {selectedUser && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Selected User:
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: 1,
                    background: 'rgba(255, 255, 255, 0.05)'
                  }}>
                    <Typography variant="body1">{selectedUser.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{selectedUser.email}</Typography>
                    <Chip label="Existing User" size="small" sx={{ mt: 1 }} />
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Create New Patient Tab */}
          {tabValue === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  error={!!errors.first_name}
                  helperText={errors.first_name}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  error={!!errors.last_name}
                  helperText={errors.last_name}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                />
              </Grid>
            </Grid>
          )}

          {/* Common fields for both modes */}
          {(tabValue === 0 && selectedUser) || tabValue === 1 ? (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={tabValue === 0 ? "Age (optional)" : "Age"}
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  error={!!errors.age}
                  helperText={errors.age || (tabValue === 0 ? "Leave blank if unknown" : "")}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.gender}>
                  <InputLabel>{tabValue === 0 ? "Gender (optional)" : "Gender"}</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    label={tabValue === 0 ? "Gender (optional)" : "Gender"}
                    onChange={handleChange}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                    <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                  </Select>
                  {errors.gender && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.gender}
                    </Typography>
                  )}
                  {tabValue === 0 && !errors.gender && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      Leave blank if unknown
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Condition</InputLabel>
                  <Select
                    name="condition"
                    value={formData.condition}
                    label="Condition"
                    onChange={handleChange}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    {conditions.map((condition) => (
                      <MenuItem key={condition} value={condition}>
                        {condition}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Additional Notes"
                  name="notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information about the patient..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                />
              </Grid>
            </Grid>
          ) : null}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={handleClose}
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={tabValue === 0 && !selectedUser}
        >
          {tabValue === 0 ? 'Add Patient' : 'Create Patient'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPatientDialog;