import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  useScrollTrigger,
  Slide,
  Tooltip,
} from '@mui/material';
import {
  SportsEsports as GamesIcon,
  Leaderboard as LeaderboardIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  Dashboard as DashboardIcon,
  MedicalServices as CaregiverIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  EmojiEvents as AchievementsIcon,
  Psychology as PsychologyIcon,
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  SmartToy as AIIcon,
  Chat as ChatIcon,
  Analytics as AnalyticsIcon,
  RecordVoiceOver as CommunicationIcon,
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLLM } from '../../contexts/LLMContext';

function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const { activeProvider } = useLLM();
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Get user role for navigation filtering
  const userRole = user?.user_type || null;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      handleMenuClose();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <HideOnScroll>
      <AppBar
        position="fixed"
        sx={{
          background: theme => theme.palette.mode === 'dark' 
            ? 'rgba(10, 25, 41, 0.8)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: theme => `1px solid ${theme.palette.mode === 'dark' 
            ? theme.palette.primary.dark
            : theme.palette.grey[200]
          }`,
        }}
      >
        <Toolbar>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            <GamesIcon
              sx={{
                fontSize: '2rem',
                mr: 1,
                background: 'linear-gradient(45deg, #7C4DFF 30%, #00E5FF 90%)',
                borderRadius: '50%',
                padding: '4px',
                color: 'white'
              }}
            />
            <Typography
              variant="h6"
              sx={{
                background: theme => theme.palette.mode === 'dark' 
                  ? 'linear-gradient(45deg, #7C4DFF 30%, #00E5FF 90%)'
                  : 'linear-gradient(45deg, #5A3DCC 30%, #0099CC 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold',
              }}
            >
              MindFlex
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            startIcon={<GamesIcon />}
            onClick={() => navigate('/games')}
            sx={{ 
              mr: 2,
              color: theme => theme.palette.mode === 'dark' ? 'white' : 'black'
            }}
          >
            Games
          </Button>

          {/* Dashboard - Show appropriate dashboard based on user role */}
          <Button
            startIcon={<DashboardIcon />}
            onClick={() => navigate(userRole === 'caregiver' ? '/caregiver' : '/dashboard')}
            sx={{ 
              mr: 2,
              color: theme => theme.palette.mode === 'dark' ? 'white' : 'black'
            }}
          >
            Dashboard
          </Button>

          <Button
            startIcon={<LeaderboardIcon />}
            onClick={() => navigate('/leaderboard')}
            sx={{ 
              mr: 2,
              color: theme => theme.palette.mode === 'dark' ? 'white' : 'black'
            }}
          >
            Leaderboard
          </Button>

          <Button
            startIcon={<AchievementsIcon />}
            onClick={() => navigate('/achievements')}
            sx={{ 
              mr: 2,
              color: theme => theme.palette.mode === 'dark' ? 'white' : 'black'
            }}
          >
            Achievements
          </Button>

          {/* Analytics - Only for caregivers */}
          {userRole === 'caregiver' && (
            <Button
              startIcon={<AnalyticsIcon />}
              onClick={() => navigate('/analytics')}
              sx={{ 
                mr: 2,
                color: theme => theme.palette.mode === 'dark' ? 'white' : 'black'
              }}
            >
              Analytics
            </Button>
          )}

          {/* Chat - Available for all users */}
          <Button
            startIcon={<ChatIcon />}
            onClick={() => navigate('/chat')}
            sx={{ 
              mr: 2,
              color: theme => theme.palette.mode === 'dark' ? 'white' : 'black'
            }}
          >
            Chat
          </Button>

          {/* Communication - Available for all users */}
          <Button
            startIcon={<CommunicationIcon />}
            onClick={() => navigate('/communication')}
            sx={{ 
              mr: 2,
              color: theme => theme.palette.mode === 'dark' ? 'white' : 'black'
            }}
          >
            Communication
          </Button>

          {/* Caregiver Dashboard - Only for caregivers */}
          {userRole === 'caregiver' && (
            <Button
              startIcon={<CaregiverIcon />}
              onClick={() => navigate('/caregiver')}
              sx={{ 
                mr: 2,
                color: theme => theme.palette.mode === 'dark' ? 'white' : 'black'
              }}
            >
              Caregiver
            </Button>
          )}

          {/* Patient Journey - Available for all users but shows different content based on role */}
          <Button
            component={Link}
            to="/patient-journey"
            startIcon={<PsychologyIcon />}
            sx={{ 
              display: { xs: 'none', md: 'flex' },
              color: theme => theme.palette.mode === 'dark' ? 'white' : 'black'
            }}
          >
            Patient Journey
          </Button>

          <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton 
              onClick={toggleTheme}
              sx={{ 
                mr: 2,
                color: theme => theme.palette.mode === 'dark' ? 'white' : 'black'
              }}
            >
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {user ? (
            <>
              <IconButton onClick={handleMenuOpen} size="small">
                <Avatar
                  sx={{
                    bgcolor: theme => theme.palette.primary.main,
                    border: theme => `2px solid ${theme.palette.secondary.main}`,
                  }}
                  src={user.profile_image ? `http://localhost:5000/api/uploads/profile_images/${user.profile_image}` : user.avatar_url}
                  alt={user.email}
                >
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    background: theme => theme.palette.mode === 'dark'
                      ? 'rgba(10, 25, 41, 0.9)'
                      : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    border: theme => `1px solid ${theme.palette.mode === 'dark'
                      ? theme.palette.primary.dark
                      : theme.palette.grey[200]
                    }`,
                  },
                }}
              >
                <MenuItem onClick={() => handleNavigate('/profile')}>
                  <ListItemIcon>
                    <AccountIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography>Profile</Typography>
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/patient-journey')}>
                  <ListItemIcon>
                    <PsychologyIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography>Patient Journey</Typography>
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/chat')}>
                  <ListItemIcon>
                    <ChatIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography>Chat with AI</Typography>
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/communication')}>
                  <ListItemIcon>
                    <CommunicationIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography>Communication</Typography>
                </MenuItem>
                {/* LLM Settings - Only for caregivers */}
                {userRole === 'caregiver' && (
                  <MenuItem onClick={() => handleNavigate('/settings/llm')}>
                    <ListItemIcon>
                      <AIIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography>LLM Settings {activeProvider && `(${activeProvider === 'local' ? 'Ollama' : activeProvider})`}</Typography>
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography>Logout</Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              component={Link}
              to="/login"
              startIcon={<LoginIcon />}
              sx={{ 
                display: { xs: 'none', md: 'flex' },
                color: theme => theme.palette.mode === 'dark' ? 'white' : 'black'
              }}
            >
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>
    </HideOnScroll>
  );
};

export default Navbar; 