import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Link,
  InputAdornment,
  Alert,
  CircularProgress 
} from '@mui/material';
import { 
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const validateForm = () => {
    if (!email) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return false;
    }
    return true;
  };
  
  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(error.message || 'Failed to send password reset email. Please try again.');
      } else {
        setSuccessMessage('Password reset link has been sent to your email.');
      }
    } catch (error) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper 
        elevation={3} 
        sx={{
          p: 4,
          maxWidth: 400,
          mx: 'auto',
          mt: 8,
          borderRadius: 2,
          background: theme => theme.palette.mode === 'dark' 
            ? 'rgba(19, 47, 76, 0.4)' 
            : 'rgba(255, 255, 255, 0.8)',
        }}
      >
        <Typography variant="h5" component="h1" align="center" gutterBottom>
          Reset Your Password
        </Typography>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Enter your email address and we'll send you a link to reset your password.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            icon={<CheckCircleIcon fontSize="inherit" />}
          >
            {successMessage}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={handleChange}
            disabled={loading || !!successMessage}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.2 }}
            disabled={loading || !!successMessage}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
          </Button>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              component={RouterLink}
              to="/login"
              startIcon={<ArrowBackIcon />}
              variant="text"
            >
              Back to Login
            </Button>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default ForgotPassword; 