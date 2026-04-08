import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProviderWrapper = ({ children }) => {
  const [mode, setMode] = useState('dark');
  
  // Load theme preference from localStorage on initial load
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);
  
  // Save theme preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);
  
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'));
  };
  
  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#7C4DFF',
        light: '#B47CFF',
        dark: '#5C3DBF',
      },
      secondary: {
        main: '#00E5FF',
        light: '#6EFFFF',
        dark: '#00B2CC',
      },
      background: {
        default: '#f5f8fa',
        paper: '#ffffff',
      },
      success: {
        main: '#00E676',
      },
      error: {
        main: '#FF1744',
      },
      text: {
        primary: '#1A2027',
        secondary: '#637381',
      },
    },
    typography: {
      fontFamily: '"Exo 2", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
        background: 'linear-gradient(45deg, #7C4DFF 30%, #00E5FF 90%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
          },
          contained: {
            background: 'linear-gradient(45deg, #7C4DFF 30%, #00E5FF 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #6C3DFF 30%, #00D5FF 90%)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: '#ffffff',
            boxShadow: '0 8px 16px 0 rgba(145, 158, 171, 0.16)',
            border: '1px solid rgba(145, 158, 171, 0.16)',
          },
        },
      },
    },
  });
  
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#7C4DFF',
        light: '#B47CFF',
        dark: '#5C3DBF',
      },
      secondary: {
        main: '#00E5FF',
        light: '#6EFFFF',
        dark: '#00B2CC',
      },
      background: {
        default: '#0A1929',
        paper: '#132F4C',
      },
      success: {
        main: '#00E676',
      },
      error: {
        main: '#FF1744',
      },
    },
    typography: {
      fontFamily: '"Exo 2", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
        background: 'linear-gradient(45deg, #7C4DFF 30%, #00E5FF 90%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
          },
          contained: {
            background: 'linear-gradient(45deg, #7C4DFF 30%, #00E5FF 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #6C3DFF 30%, #00D5FF 90%)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: 'linear-gradient(145deg, rgba(19, 47, 76, 0.9) 0%, rgba(10, 25, 41, 0.9) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(124, 77, 255, 0.1)',
          },
        },
      },
    },
  });
  
  const theme = mode === 'dark' ? darkTheme : lightTheme;
  
  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 