import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  useTheme,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const UserProfile = () => {
  const theme = useTheme();
  const { user, updateProfile, uploadProfileImage, getCurrentUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [profileData, setProfileData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    bio: user?.bio || '',
  });

  // Update profileData when user changes
  React.useEffect(() => {
    if (user) {
      console.log('User object in profile:', user);
      console.log('User profile_image:', user.profile_image);
      console.log('User profile_image_url:', user.profile_image_url);
      setProfileData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        bio: user.bio || '',
      });
    }
  }, [user]);
  
  const handleEditToggle = () => {
    setEditMode(!editMode);
    setError('');
    setSuccess('');
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image file size must be less than 5MB');
      return;
    }

    try {
      setImageLoading(true);
      setError('');
      setSuccess('');

      const { error } = await uploadProfileImage(file);

      if (error) throw error;

      // Refresh user profile data to ensure UI updates
      await getCurrentUser();

      setSuccess('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image: ' + (error?.message || 'Unknown error'));
    } finally {
      setImageLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const userData = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        bio: profileData.bio,
      };
      
      const { error } = await updateProfile(userData);
      
      if (error) throw error;
      
      setSuccess('Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h5">Please sign in to view your profile</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        User Profile
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 4,
          background: theme.palette.mode === 'dark' 
            ? 'rgba(19, 47, 76, 0.4)' 
            : 'rgba(255, 255, 255, 0.8)',
        }}
      >
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar 
                sx={{ width: 80, height: 80, mr: 2 }}
                src={user.profile_image ? `http://localhost:5000/api/uploads/profile_images/${user.profile_image}` : user.avatar_url}
                alt={user.email}
                onError={(e) => {
                  console.log('Avatar image failed to load:', e.target.src);
                }}
                onLoad={() => {
                  console.log('Avatar image loaded successfully');
                }}
              >
                {user.email?.charAt(0).toUpperCase()}
              </Avatar>
              
              <Tooltip title="Change profile picture">
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: -8,
                    right: 8,
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    width: 32,
                    height: 32,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                  }}
                  onClick={handleImageClick}
                  disabled={imageLoading}
                  size="small"
                >
                  {imageLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <PhotoCameraIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                style={{ display: 'none' }}
              />
            </Box>
            
            <Box>
              <Typography variant="h6">
                {user.full_name || user.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Box>
          
          <Button 
            variant="outlined" 
            startIcon={editMode ? <SaveIcon /> : <EditIcon />}
            onClick={editMode ? handleSubmit : handleEditToggle}
            disabled={loading}
          >
            {editMode ? 'Save Profile' : 'Edit Profile'}
          </Button>
        </Box>
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={profileData.firstName}
                onChange={handleChange}
                disabled={!editMode || loading}
                variant={editMode ? "outlined" : "filled"}
                InputProps={{ readOnly: !editMode }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={profileData.lastName}
                onChange={handleChange}
                disabled={!editMode || loading}
                variant={editMode ? "outlined" : "filled"}
                InputProps={{ readOnly: !editMode }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={user.email}
                disabled={true}
                variant="filled"
                InputProps={{ readOnly: true }}
                helperText="Email cannot be changed"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                value={profileData.bio}
                onChange={handleChange}
                disabled={!editMode || loading}
                variant={editMode ? "outlined" : "filled"}
                InputProps={{ readOnly: !editMode }}
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default UserProfile; 