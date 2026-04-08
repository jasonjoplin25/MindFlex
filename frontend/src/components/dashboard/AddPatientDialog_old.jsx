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
import { api } from '../../services/api';

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

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (formData.age < 0 || formData.age > 120) {
      newErrors.age = 'Please enter a valid age';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.condition) {
      newErrors.condition = 'Condition is required';
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
      const response = await api.get(`/caregiver/search-users?query=${encodeURIComponent(query)}`);
      if (response.data.success) {
        setSearchResults(response.data.users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
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
    if (tabValue === 0) {
      // Adding existing patient
      if (!selectedUser) {
        setErrors({ search: 'Please select a user to add as patient' });
        return;
      }

      try {
        const patientData = {
          user_id: selectedUser.id,
          age: formData.age,
          gender: formData.gender,
          condition: formData.condition,
          notes: formData.notes,
        };

        const response = await api.post('/caregiver/add-existing-patient', patientData);
        if (response.data.success) {
          onAdd(response.data.patient);
          handleClose();
        } else {
          setErrors({ submit: response.data.error || 'Failed to add patient' });
        }
      } catch (error) {
        console.error('Error adding existing patient:', error);
        setErrors({ submit: 'Failed to add patient. Please try again.' });
      }
    } else {
      // Creating new patient
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
              {searchResults.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Search Results:
                  </Typography>
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
            <Box>
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

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                error={!!errors.age}
                helperText={errors.age}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.gender}>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  label="Gender"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.condition}>
                <InputLabel>Condition</InputLabel>
                <Select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  label="Condition"
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
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            background: 'linear-gradient(45deg, #7C4DFF 30%, #00E5FF 90%)',
          }}
        >
          Add Patient
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPatientDialog; 