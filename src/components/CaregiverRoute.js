import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CaregiverRoute = () => {
  const { user, userProfile, loading } = useAuth();

  // Show loading state while checking authentication and profile
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if not a caregiver
  if (userProfile?.role !== 'caregiver') {
    return <Navigate to="/dashboard" replace />;
  }

  // Render child routes if authenticated and is a caregiver
  return <Outlet />;
};

export default CaregiverRoute; 