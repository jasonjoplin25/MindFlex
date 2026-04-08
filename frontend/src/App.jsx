import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import Navbar from './components/layout/Navbar';
import LandingPage from './pages/LandingPage';
import GamesPage from './pages/GamesPage';
import MemoryGame from './components/games/memory/MemoryGame';
import WordScramble from './components/games/word/WordScramble';
import PatternGame from './components/games/pattern/PatternGame';
import MathGame from './components/games/math/MathGame';
import ReactionGame from './components/games/reaction/ReactionGame';
import SnakeGame from './components/games/snake/SnakeGame';
import SequenceGame from './components/games/sequence/SequenceGame';
import SudokuGameWrapper from './components/games/sudoku/SudokuGameWrapper';
import CrosswordGameWrapper from './components/games/crossword/CrosswordGameWrapper';
import GameLeaderboard from './components/games/GameLeaderboard';
import MissionBuilder from './components/games/mission/MissionBuilder';
import UserProfile from './components/profile/UserProfile';
import CaregiverDashboard from './components/dashboard/CaregiverDashboard';
import PersonalizedDashboard from './pages/PersonalizedDashboard';
import AchievementsPage from './components/achievements/AchievementsPage';
import PatientJourneyPage from './pages/PatientJourneyPage';
import LLMSettingsPage from './pages/LLMSettingsPage';
import ChatPage from './pages/ChatPage';
import ApiDebugger from './pages/ApiDebugger';
import AnalyticsPage from './pages/AnalyticsPage';
import CommunicationPage from './pages/CommunicationPage';
import { ThemeProviderWrapper } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LLMProvider } from './contexts/LLMContext';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPassword from './components/auth/ForgotPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  
  return (
    <AuthProvider>
      <ThemeProviderWrapper>
        <LLMProvider>
          <CssBaseline />
          <Box
            sx={{
              minHeight: '100vh',
              background: theme => 
                theme.palette.mode === 'dark' 
                  ? 'radial-gradient(circle at 50% 0%, rgba(124, 77, 255, 0.15) 0%, rgba(0, 229, 255, 0.15) 100%)'
                  : 'linear-gradient(120deg, rgba(240, 245, 250, 0.8) 0%, rgba(250, 250, 250, 0.8) 100%)',
              backgroundAttachment: 'fixed',
            }}
          >
            {!isLandingPage && <Navbar />}
            <Box
              component="main"
              sx={{
                pt: isLandingPage ? 0 : 8,
                pb: 6,
                position: 'relative',
              }}
            >
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/games" element={<GamesPage />} />
                <Route path="/dashboard" element={<PersonalizedDashboard />} />
                <Route path="/games/memory/:gameId" element={<MemoryGame />} />
                <Route path="/games/word/:gameId" element={<WordScramble />} />
                <Route path="/games/pattern/:gameId" element={<PatternGame />} />
                <Route path="/games/math/:gameId" element={<MathGame />} />
                <Route path="/games/reflex/:gameId" element={<ReactionGame />} />
                <Route path="/games/reaction/:gameId" element={<ReactionGame />} />
                <Route path="/games/snake/:gameId" element={<SnakeGame />} />
                <Route path="/games/sequence/:gameId" element={<SequenceGame />} />
                <Route path="/games/sudoku/:gameId" element={<SudokuGameWrapper />} />
                <Route path="/games/crossword/:gameId" element={<CrosswordGameWrapper />} />
                <Route path="/mission-builder" element={<MissionBuilder />} />
                <Route path="/leaderboard" element={<GameLeaderboard />} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } />
                <Route path="/caregiver" element={<CaregiverDashboard />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/patient-journey" element={<PatientJourneyPage />} />
                <Route path="/settings/llm" element={<LLMSettingsPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/communication" element={<CommunicationPage />} />
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } />
                <Route path="/api-debug" element={<ApiDebugger />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Routes>
            </Box>
          </Box>
        </LLMProvider>
      </ThemeProviderWrapper>
    </AuthProvider>
  );
}

export default App; 