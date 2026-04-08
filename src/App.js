import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';

// Layout components
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Page components
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CognitiveGames from './pages/CognitiveGames';
import GameDetail from './pages/GameDetail';
import SoundTherapy from './pages/SoundTherapy';
import SoundPlayer from './pages/SoundPlayer';
import CaregiverDashboard from './pages/CaregiverDashboard';
import PatientDetail from './pages/PatientDetail';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Game components
import MemoryGame from './games/memory/MemoryGame';
import WordScrambleGame from './games/wordScramble/WordScrambleGame';
import PatternMatchGame from './games/patternMatch/PatternMatchGame';
import ReactionTimeGame from './games/reactionTime/ReactionTimeGame';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Caregiver route component
const CaregiverRoute = ({ children }) => {
  const { user, loading, userProfile } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user || userProfile?.role !== 'caregiver') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <GameProvider>
      <Routes>
        {/* Auth routes */}
        <Route path="/" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
        
        {/* Protected routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          <Route path="dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="games" element={
            <ProtectedRoute>
              <CognitiveGames />
            </ProtectedRoute>
          } />
          
          <Route path="games/:gameId" element={
            <ProtectedRoute>
              <GameDetail />
            </ProtectedRoute>
          } />
          
          {/* Game routes */}
          <Route path="games/memory" element={
            <MemoryGame />
          } />
          
          <Route path="games/word-scramble" element={
            <WordScrambleGame />
          } />
          
          <Route path="games/pattern-match" element={
            <PatternMatchGame />
          } />
          
          <Route path="games/reaction-time" element={
            <ReactionTimeGame />
          } />
          
          <Route path="therapy" element={
            <ProtectedRoute>
              <SoundTherapy />
            </ProtectedRoute>
          } />
          
          <Route path="therapy/:soundId" element={
            <ProtectedRoute>
              <SoundPlayer />
            </ProtectedRoute>
          } />
          
          <Route path="caregiver" element={
            <CaregiverRoute>
              <CaregiverDashboard />
            </CaregiverRoute>
          } />
          
          <Route path="caregiver/patient/:patientId" element={
            <CaregiverRoute>
              <PatientDetail />
            </CaregiverRoute>
          } />
          
          <Route path="profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </GameProvider>
  );
}

export default App; 