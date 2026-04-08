import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI, tokenManager, handleApiError, isAuthenticated } from '../services/api';

// Create the auth context
export const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component to wrap around the app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to sign up a new user
  const signUp = async (email, password, userData = {}) => {
    try {
      setError(null);
      setLoading(true);
      
      const registrationData = {
        email,
        password,
        ...userData
      };
      
      console.log('Registration data being sent:', registrationData);
      
      const response = await authAPI.register(registrationData);
      const { user, access_token, refresh_token } = response.data;
      
      // Store tokens
      tokenManager.setTokens(access_token, refresh_token);
      
      // Set user state
      setUser(user);
      
      return { 
        data: { user },
        error: null 
      };
    } catch (error) {
      console.error('Signup process error:', error);
      const apiError = handleApiError(error);
      console.log('Processed error:', apiError);
      setError(apiError.error);
      return { data: null, error: apiError };
    } finally {
      setLoading(false);
    }
  };

  // Function to sign in a user
  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      // Validate input
      if (!email || !password) {
        const errorMessage = `Missing ${!email ? 'email' : 'password'} for sign in`;
        setError(errorMessage);
        return { 
          data: null, 
          error: { message: errorMessage } 
        };
      }
      
      const response = await authAPI.login(email, password);
      const { user, access_token, refresh_token } = response.data;
      
      // Store tokens
      tokenManager.setTokens(access_token, refresh_token);
      
      // Set user state
      setUser(user);
      
      console.log('User authenticated successfully:', user.id);
      return { data: { user }, error: null };
    } catch (error) {
      console.error('Login error:', error);
      const apiError = handleApiError(error);
      setError(apiError.error);
      return { 
        data: null, 
        error: { message: apiError.error }
      };
    } finally {
      setLoading(false);
    }
  };

  // Function to sign out
  const signOut = async () => {
    try {
      setError(null);
      
      // Try to call logout endpoint
      try {
        await authAPI.logout();
      } catch (logoutError) {
        // If logout fails, just clear tokens locally
        console.warn('Logout API call failed, clearing tokens locally:', logoutError);
      }
      
      // Clear tokens and user state
      tokenManager.clearTokens();
      setUser(null);
      
      return { error: null };
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.error);
      return { error: apiError };
    }
  };

  // Function to reset password (placeholder - implement if backend supports it)
  const resetPassword = async (email) => {
    try {
      setError(null);
      
      // For now, return a message since we haven't implemented password reset in backend
      return { 
        data: { message: 'Password reset functionality will be available soon' }, 
        error: null 
      };
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.error);
      return { data: null, error: apiError };
    }
  };

  // Function to update user data
  const updateProfile = async (userData) => {
    try {
      setError(null);
      
      const response = await authAPI.updateProfile(userData);
      const updatedUser = response.data;
      
      setUser(updatedUser);
      return { data: updatedUser, error: null };
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.error);
      return { data: null, error: apiError };
    }
  };

  // Function to upload profile image
  const uploadProfileImage = async (file) => {
    try {
      setError(null);
      
      const formData = new FormData();
      formData.append('profile_image', file);
      
      const response = await authAPI.uploadProfileImage(formData);
      const updatedUser = response.data;
      
      console.log('Upload response user:', updatedUser);
      console.log('Profile image field:', updatedUser.profile_image);
      
      setUser(updatedUser);
      return { data: updatedUser, error: null };
    } catch (error) {
      const apiError = handleApiError(error);
      setError(apiError.error);
      console.error('Upload error:', apiError);
      return { data: null, error: apiError };
    }
  };

  // Function to get current user profile
  const getCurrentUser = async () => {
    try {
      const response = await authAPI.getProfile();
      const userData = response.data;
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error getting current user:', error);
      const apiError = handleApiError(error);
      if (apiError.status === 401) {
        // Token invalid, clear auth state
        tokenManager.clearTokens();
        setUser(null);
      }
      throw error;
    }
  };

  // Check authentication status on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isAuthenticated()) {
          // Token exists and is valid, get user data
          await getCurrentUser();
        } else {
          // No valid token, clear state
          tokenManager.clearTokens();
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear auth state on error
        tokenManager.clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Value to be provided to consumers
  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    uploadProfileImage,
    getCurrentUser,
    isAuthenticated: () => isAuthenticated() && user !== null,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="auth-loading">Loading authentication...</div>
      )}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 