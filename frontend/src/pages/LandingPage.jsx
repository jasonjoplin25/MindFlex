import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  CardMedia,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  IconButton,
  Tabs,
  Tab,
  InputAdornment,
  MobileStepper,
} from '@mui/material';
import {
  Psychology as BrainIcon,
  Speed as SpeedIcon,
  EmojiEvents as AchievementsIcon,
  Analytics as StatsIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  ArrowForward as ArrowIcon,
  Spa as MeditationIcon,
  Notifications as NotificationIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Email as EmailIcon,
  AccountCircle as AccountCircleIcon,
  Lock as LockIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

// Import Three.js
import * as THREE from 'three';
import { getImageUrl } from '../utils/imageUtils';

const LandingPage = () => {
  const theme = useTheme();
  const { user, signIn, signUp } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoverFeature, setHoverFeature] = useState(null);
  const [activeStep, setActiveStep] = useState(null);
  const canvasRef = useRef(null);
  const backgroundAnimationRef = useRef(null);
  const logoAnimation = useAnimation();
  const animationPlayedRef = useRef(false);
  
  // Slideshow images and state
  const [slideshowImages] = useState([
    '/images/patient-journey/Screenshot%202025-03-14%20170849.png',
    '/images/patient-journey/Screenshot%202025-03-14%20170918.png',
    '/images/patient-journey/Screenshot%202025-03-14%20170935.png',
    '/images/patient-journey/Screenshot%202025-03-14%20170947.png',
    '/images/patient-journey/Screenshot%202025-03-14%20171009.png',
    '/images/patient-journey/Screenshot%202025-03-14%20171025.png',
  ]);
  
  // Slideshow controls
  const [activeSlide, setActiveSlide] = useState(0);
  const slideshowTimerRef = useRef(null);

  // Auto-advance the slideshow
  useEffect(() => {
    // Clear any existing timer
    if (slideshowTimerRef.current) {
      clearInterval(slideshowTimerRef.current);
    }
    
    // Set a new timer
    slideshowTimerRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slideshowImages.length);
    }, 4000);
    
    // Cleanup on unmount
    return () => {
      if (slideshowTimerRef.current) {
        clearInterval(slideshowTimerRef.current);
      }
    };
  }, [slideshowImages.length]);

  // Slideshow navigation
  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slideshowImages.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? slideshowImages.length - 1 : prev - 1));
  };

  // Handle dot navigation
  const handleDotClick = (index) => {
    setActiveSlide(index);
  };
  
  // Login modal state
  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  
  // Form validation
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  
  // Handle login modal open/close
  const handleOpenLoginModal = () => {
    setOpenLoginModal(true);
  };
  
  const handleCloseLoginModal = () => {
    setOpenLoginModal(false);
    // Reset form states
    setLoginEmail('');
    setLoginPassword('');
    setSignupEmail('');
    setSignupUsername('');
    setSignupPassword('');
    setSignupConfirmPassword('');
    setLoginError('');
    setSignupError('');
  };
  
  // Handle tab change between login and signup
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Reset errors when switching tabs
    setLoginError('');
    setSignupError('');
  };
  
  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Function to properly encode image paths for GitHub Pages
  const getImageUrl = (path) => {
    // For GitHub Pages, we need to ensure paths are properly formed
    // If the app is running on GitHub Pages, prepend the repo name to the path
    const isGitHubPages = window.location.hostname === 'jasonjoplin.github.io';
    const repoName = 'MindFlex';
    
    if (isGitHubPages) {
      // Make sure path starts with slash
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      return `/${repoName}${normalizedPath}`;
    }
    
    return path;
  };
  
  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Reset previous errors
    setLoginError('');
    
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email and password');
      return;
    }
    
    // Development mode fallback function
    const applyDevFallback = () => {
      console.log('Using fallback login method for development');
      
      // Basic validation for development mode
      if (loginEmail.includes('@') && loginPassword.length >= 6) {
        // Simulate successful login
        setTimeout(() => {
          handleCloseLoginModal();
          alert(`Development mode: Successfully logged in as ${loginEmail}`);
        }, 500);
      } else {
        setLoginError('Invalid email or password. Please try again.');
      }
    };
    
    // Function to handle resending confirmation email
    const handleResendConfirmation = async () => {
      try {
        console.log('Attempting to resend confirmation email to:', loginEmail);
        
        const { error } = await signIn(loginEmail, loginPassword);
        
        if (error) {
          console.error('Error resending confirmation email:', error);
          setLoginError(`Failed to resend confirmation email: ${error.message}`);
        } else {
          setLoginError('Confirmation email has been resent. Please check your inbox and spam folder.');
        }
      } catch (err) {
        console.error('Exception resending confirmation email:', err);
        setLoginError('An error occurred while resending the confirmation email.');
      }
    };
    
    try {
      console.log('Attempting login');
      
      // TEMPORARY: Use development fallback for now - REMOVE THIS FOR PRODUCTION
      // This line is added to ensure users can login during development
      if (false) { // Changed from true to false to let real authentication work
        applyDevFallback();
        return;
      }
      
      try {
        const result = await signIn(loginEmail, loginPassword);
        console.log('Sign in result:', result);
        
        // Check if we got a proper result
        if (!result) {
          console.error('No result returned from signIn function');
          applyDevFallback();
          return;
        }

        // Check for error
        if (result.error) {
          console.warn('Auth error:', result.error);
          
          // Get the error message safely
          const errorMessage = result.error.message || 'Unknown authentication error';
          
          // Handle email not confirmed error specifically
          if (typeof errorMessage === 'string' && errorMessage.includes('Email not confirmed')) {
            setLoginError(
              <>
                <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                  Your email has not been confirmed. Please check your inbox and spam folder.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={handleResendConfirmation}
                    sx={{ fontSize: '0.8rem' }}
                  >
                    Resend Confirmation Email
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="secondary"
                    onClick={applyDevFallback}
                    sx={{ fontSize: '0.8rem' }}
                  >
                    Use Development Login
                  </Button>
                </Box>
              </>
            );
            return;
          }
          
          // Handle invalid credentials specifically
          if (typeof errorMessage === 'string' && errorMessage.includes('Invalid login credentials')) {
            setLoginError('Invalid email or password. Please try again.');
            return;
          }
          
          // For other errors, use development fallback
          applyDevFallback();
          return;
        }
        
        // Success path - we have data and no error
        if (result.data) {
          console.log('Login successful');
          handleCloseLoginModal();
          return;
        } else {
          // No data returned
          console.warn('No data returned from signIn function');
          applyDevFallback();
        }
      } catch (authError) {
        // Handle any exceptions from the signIn function
        console.error('Exception during login:', authError);
        applyDevFallback();
      }
    } catch (error) {
      // Catch any other unexpected errors
      console.error('Unexpected error during login:', error);
      setLoginError('An unexpected error occurred. Please try again.');
    }
  };
  
  // Handle signup submission
  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Reset previous errors
    setSignupError('');
    
    // Validate form inputs
    if (!signupEmail || !signupUsername || !signupPassword) {
      setSignupError('Please fill out all fields');
      return;
    }
    
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }
    
    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters');
      return;
    }
    
    try {
      // Show a loading state - could add a loading state variable here
      
      let useDevFallback = false;
      
      // Try the actual signup
      try {
        const result = await signUp(signupEmail, signupPassword, {
          username: signupUsername,
        });
        
        // Safe access to data and user with null checking
        const userData = result?.data;
        const user = userData?.user;
        
        if (result.error || !user) {
          console.warn('Signup issue:', result.error?.message || 'No user returned');
          useDevFallback = true;
        } else {
          console.log('User created successfully:', user);
          
          // Close the modal and show success message
          handleCloseLoginModal();
          
          // Show success message
          alert('Account created successfully! Please check your email to confirm your account.');
          return;
        }
      } catch (authError) {
        console.error('Signup error:', authError);
        useDevFallback = true;
      }
      
      // Fallback for development/testing only
      if (useDevFallback) {
        console.log('Using fallback signup method for development');
        
        // Simulate successful signup
        setTimeout(() => {
          // Close the modal
          handleCloseLoginModal();
          
          // Show success message
          alert(`Development mode: Account created successfully for ${signupEmail}! In a real environment, you would receive a confirmation email.`);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to sign up:', error);
      setSignupError(error.message || 'Failed to create account. Please try again.');
    }
  };
  
  // Handle mouse movement for interactive elements
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Animate the logo on mount - single animation, not tied to mouse
  useEffect(() => {
    logoAnimation.start({
      scale: [0.8, 1.1, 1],
      rotate: [0, 10, 0],
      transition: { duration: 1.5, ease: "easeInOut" }
    });
  }, [logoAnimation]);
  
  // Animated background with Three.js
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Create animated particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);
    
    // Set random positions and colors for particles
    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Positions
      posArray[i] = (Math.random() - 0.5) * 5;
      posArray[i + 1] = (Math.random() - 0.5) * 5;
      posArray[i + 2] = (Math.random() - 0.5) * 5;
      
      // Colors - create a gradient from blue to purple to red
      const t = i / (particlesCount * 3);
      colorsArray[i] = 0.3 + 0.7 * t; // R
      colorsArray[i + 1] = 0.2 + (t < 0.5 ? t : 1 - t) * 0.6; // G
      colorsArray[i + 2] = 0.8 - 0.6 * t; // B
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    camera.position.z = 3;
    
    // Animation loop
    const animate = () => {
      backgroundAnimationRef.current = requestAnimationFrame(animate);
      
      // Constant slow rotation
      particlesMesh.rotation.x += 0.0005;
      particlesMesh.rotation.y += 0.0005;
      
      // Interactive movement based on mouse position
      if (mousePosition.x && mousePosition.y) {
        particlesMesh.rotation.x += (mousePosition.y * 0.01 - particlesMesh.rotation.x) * 0.05;
        particlesMesh.rotation.y += (mousePosition.x * 0.01 - particlesMesh.rotation.y) * 0.05;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up on component unmount
    return () => {
      cancelAnimationFrame(backgroundAnimationRef.current);
      window.removeEventListener('resize', handleResize);
      
      // Dispose of resources
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, [mousePosition.x, mousePosition.y]);
  
  // Brain pulse animation for the logo
  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1.5, // Faster pulse
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  };

  // Neural path animation for "thoughts" traveling through neurons
  const neuralPathVariants = {
    animate: {
      pathLength: [0, 1],
      opacity: [0.2, 1, 0.2],
      transition: {
        duration: 2,
        repeat: Infinity,
      }
    }
  };
  
  // MindFlex text animation - completely separate from other animations
  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05, // Faster animation
        duration: 0.3, // Faster animation
      }
    })
  };
  
  // Create letter-by-letter animation for the MindFlex title that only animates once
  const MindFlexText = ({ text }) => {
    // We'll use a simpler approach without animation controls
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        {Array.from(text).map((letter, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: i * 0.05,
              duration: 0.3
            }}
            style={{ 
              display: 'inline-block',
              marginRight: letter === ' ' ? '0.3em' : '0.01em'
            }}
          >
            <Typography
              component="span"
              variant="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                fontFamily: '"Poppins", sans-serif',
                WebkitTextFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                backgroundImage: letter === 'M' || letter === 'F' 
                  ? 'linear-gradient(45deg, #FF4081 30%, #651FFF 90%)'
                  : 'linear-gradient(45deg, #651FFF 30%, #00BCD4 90%)',
              }}
            >
              {letter}
            </Typography>
          </motion.div>
        ))}
      </Box>
    );
  };
  
  // Enhanced neural node component with glowing effect and pulse animation
  const NeuralNode = ({ x, y, size, color, pulseDelay, pulseSpeed }) => {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{ 
          duration: pulseSpeed || 2,
          delay: pulseDelay || 0,
          repeat: Infinity,
          repeatType: 'reverse'
        }}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 ${size/2}px ${color}`,
          zIndex: 3,
        }}
      />
    );
  };
  
  // Interactive "thought" particle that travels along neural pathways
  const ThoughtParticle = ({ delay, duration, color }) => {
    const getRandomPoint = () => {
      // Generate random points for the particle to travel through
      return {
        x: 50 + (Math.random() - 0.5) * 80, // 10% to 90% of container width
        y: 50 + (Math.random() - 0.5) * 80, // 10% to 90% of container height
      };
    };
    
    const points = Array(4).fill().map(getRandomPoint);
    
    return (
      <motion.div
        initial={{ 
          left: points[0].x + '%', 
          top: points[0].y + '%',
          scale: 0
        }}
        animate={{ 
          left: [
            points[0].x + '%',
            points[1].x + '%',
            points[2].x + '%',
            points[3].x + '%'
          ],
          top: [
            points[0].y + '%',
            points[1].y + '%',
            points[2].y + '%',
            points[3].y + '%'
          ],
          scale: [0, 1, 1, 0],
          opacity: [0, 1, 1, 0]
        }}
        transition={{
          duration: duration,
          delay: delay,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          width: 6,
          height: 6,
          backgroundColor: color,
          borderRadius: '50%',
          filter: `blur(2px) drop-shadow(0 0 4px ${color})`,
          zIndex: 4
        }}
      />
    );
  };
  
  // Synapse connection effect with animated electric pulse
  const SynapseConnection = ({ x1, y1, x2, y2, color, delay }) => {
    return (
      <motion.div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2 }}>
        <svg width="100%" height="100%" style={{ position: 'absolute' }}>
          <motion.line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ 
              pathLength: [0, 1],
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{ 
              duration: 2,
              delay: delay || 0,
              repeat: Infinity,
              repeatType: 'loop'
            }}
          />
        </svg>
        <motion.div
          initial={{ left: x1, top: y1, opacity: 0 }}
          animate={{
            left: [x1, x2],
            top: [y1, y2],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1.5,
            delay: delay || 0,
            repeat: Infinity,
            repeatType: 'loop'
          }}
          style={{
            position: 'absolute',
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: 'white',
            boxShadow: `0 0 6px ${color}`,
            zIndex: 3
          }}
        />
      </motion.div>
    );
  };

  // Brain Activity Spark Effect
  const BrainActivitySpark = ({ delay }) => {
    const sparkSize = 2 + Math.random() * 4;
    const sparkX = 100 + (Math.random() - 0.5) * 160;
    const sparkY = 100 + (Math.random() - 0.5) * 160;
    const sparkColor = [
      '#FF4081', '#E040FB', '#7C4DFF', '#448AFF', '#18FFFF', '#64FFDA', '#FFAB40', '#FF6E40'
    ][Math.floor(Math.random() * 8)];
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0, 1, 0],
        }}
        transition={{
          duration: 0.5 + Math.random() * 0.5,
          delay: delay,
          repeat: Infinity,
          repeatDelay: Math.random() * 3
        }}
        style={{
          position: 'absolute',
          left: sparkX,
          top: sparkY,
          width: sparkSize,
          height: sparkSize,
          backgroundColor: 'white',
          borderRadius: '50%',
          boxShadow: `0 0 8px 2px ${sparkColor}`,
          zIndex: 5
        }}
      />
    );
  };
  
  // Feature card hover animation with faster timing
  const handleFeatureHover = (index) => {
    setHoverFeature(index);
  };
  
  const handleFeatureLeave = () => {
    setHoverFeature(null);
  };
  
  // Define page links for feature cards
  const featureLinks = {
    'Cognitive Games': '/games',
    'Progress Tracking': '/dashboard',
    'Achievements': '/achievements',
    'Personalized Experience': '/profile',
    'Daily Challenges': '/games',
    'Secure & Private': '/profile',
  };
  
  const features = [
    {
      title: 'Cognitive Games',
      description: 'Engage with fun, scientifically designed games that target key cognitive functions.',
      icon: <BrainIcon fontSize="large" />,
      color: '#4caf50',
    },
    {
      title: 'Progress Tracking',
      description: 'Monitor your cognitive improvement with detailed performance analytics.',
      icon: <StatsIcon fontSize="large" />,
      color: '#2196f3',
    },
    {
      title: 'Achievements',
      description: 'Earn rewards and achievements as you improve your cognitive abilities.',
      icon: <AchievementsIcon fontSize="large" />,
      color: '#ff9800',
    },
    {
      title: 'Personalized Experience',
      description: 'Get a tailored training plan based on your specific cognitive profile.',
      icon: <PersonIcon fontSize="large" />,
      color: '#9c27b0',
    },
    {
      title: 'Daily Challenges',
      description: 'Take on new challenges every day to keep your mind sharp and engaged.',
      icon: <SpeedIcon fontSize="large" />,
      color: '#f44336',
    },
    {
      title: 'Secure & Private',
      description: 'Your data is protected with industry-standard security and privacy measures.',
      icon: <SecurityIcon fontSize="large" />,
      color: '#607d8b',
    },
  ];
  
  // Handle step hover and leave
  const handleStepHover = (index) => {
    setActiveStep(index);
  };

  const handleStepLeave = () => {
    setActiveStep(null);
  };

  // Define page links for steps
  const stepLinks = {
    'Sign Up': '/register',
    'Complete the Assessment': '/assessment',
    'Get Your Personalized Plan': '/dashboard',
    'Train Consistently': '/games',
    'Track Your Progress': '/progress',
  };

  // Define step items for the "How It Works" section
  const howItWorksSteps = [
    {
      title: 'Sign Up',
      description: 'Create your account in seconds and get started right away.',
      link: '/register'
    },
    {
      title: 'Complete the Assessment',
      description: 'Take our cognitive assessment to establish your baseline abilities.',
      link: '/assessment'
    },
    {
      title: 'Get Your Personalized Plan',
      description: 'Receive a training plan tailored to strengthen your cognitive abilities.',
      link: '/dashboard'
    },
    {
      title: 'Train Consistently',
      description: 'Follow your plan with just 15-20 minutes of training per day.',
      link: '/games'
    },
    {
      title: 'Track Your Progress',
      description: 'Monitor your improvements with detailed analytics and insights.',
      link: '/progress'
    },
  ];
  
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      {/* Login button in upper right corner */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          right: 40,
          zIndex: 10,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenLoginModal}
          sx={{
            background: 'linear-gradient(45deg, #651FFF 30%, #00BCD4 90%)',
            boxShadow: '0 3px 5px 2px rgba(101, 31, 255, .3)',
            borderRadius: '20px',
            padding: '8px 16px',
            fontWeight: 'bold',
          }}
        >
          Login / Sign Up
        </Button>
      </Box>

      {/* Login/Signup Modal */}
      <Dialog
        open={openLoginModal}
        onClose={handleCloseLoginModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight="bold">
              Welcome to MindFlex
            </Typography>
            <IconButton 
              edge="end" 
              color="inherit" 
              onClick={handleCloseLoginModal}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ mt: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Login" sx={{ fontWeight: 'bold' }} />
            <Tab label="Sign Up" sx={{ fontWeight: 'bold' }} />
          </Tabs>
        </DialogTitle>

        <DialogContent>
          {activeTab === 0 ? (
            // Login Form
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              {loginError && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {loginError}
                </Typography>
              )}
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 3, 
                  mb: 2, 
                  py: 1.2,
                  background: 'linear-gradient(45deg, #651FFF 30%, #00BCD4 90%)',
                  fontWeight: 'bold',
                }}
              >
                Sign In
              </Button>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Typography
                    component="span"
                    variant="body2"
                    color="primary"
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => setActiveTab(1)}
                  >
                    Sign Up
                  </Typography>
                </Typography>
              </Box>
            </Box>
          ) : (
            // Sign Up Form
            <Box component="form" onSubmit={handleSignup} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="signup-email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="signup-username"
                label="Username"
                name="username"
                autoComplete="username"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircleIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="signup-password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="signup-password"
                autoComplete="new-password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText="Password must be at least 6 characters long"
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirm-password"
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                id="confirm-password"
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              
              {signupError && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {signupError}
                </Typography>
              )}
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ 
                  mt: 3, 
                  mb: 2, 
                  py: 1.2,
                  background: 'linear-gradient(45deg, #651FFF 30%, #00BCD4 90%)',
                  fontWeight: 'bold',
                }}
              >
                Create Account
              </Button>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Typography
                    component="span"
                    variant="body2"
                    color="primary"
                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => setActiveTab(0)}
                  >
                    Log In
                  </Typography>
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Animated background canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
      
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          pt: 12,
          pb: 15,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box mb={4}>
                <MindFlexText text="MindFlex" />
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }} // Faster animation
                >
                  <Typography
                    variant="h5"
                    sx={{ 
                      mb: 4,
                      maxWidth: 500,
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(45deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))'
                        : 'linear-gradient(45deg, rgba(0,0,0,0.8), rgba(0,0,0,0.6))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 500,
                    }}
                  >
                    Enhance your cognitive abilities with scientifically designed brain games and personalized training.
                  </Typography>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.0 }} // Faster animation
                >
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {user ? (
                      <Button
                        component={RouterLink}
                        to="/dashboard"
                        variant="contained"
                        color="primary"
                        size="large"
                        endIcon={<ArrowIcon />}
                        sx={{ 
                          px: 4, 
                          py: 1.5,
                          background: 'linear-gradient(45deg, #651FFF 30%, #00BCD4 90%)',
                          transition: 'transform 0.2s ease', // Faster transition
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: '0 8px 15px rgba(0,0,0,0.2)',
                          }
                        }}
                      >
                        Go to Dashboard
                      </Button>
                    ) : (
                      <>
                        <Button
                          component={RouterLink}
                          to="/register"
                          variant="contained"
                          size="large"
                          sx={{ 
                            px: 6, 
                            py: 1.5,
                            background: 'linear-gradient(45deg, #651FFF 30%, #00BCD4 90%)',
                            transition: 'transform 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-3px)',
                              boxShadow: '0 8px 15px rgba(0,0,0,0.2)',
                            }
                          }}
                        >
                          Sign Up Free
                        </Button>
                        <Button
                          component={RouterLink}
                          to="/login"
                          variant="outlined"
                          color="primary"
                          size="large"
                          sx={{ 
                            px: 6, 
                            py: 1.5,
                            borderWidth: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderWidth: 2,
                              transform: 'translateY(-3px)',
                              boxShadow: '0 5px 10px rgba(0,0,0,0.1)',
                            }
                          }}
                        >
                          Log In
                        </Button>
                      </>
                    )}
                  </Box>
                </motion.div>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  height: 500,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {/* Enhanced Neural Network Brain Visualization */}
                <motion.div
                  animate={logoAnimation}
                  variants={pulseVariants}
                  initial="pulse"
                  style={{
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: 320,
                      height: 320,
                      borderRadius: '50%',
                      background: theme.palette.mode === 'dark'
                        ? 'radial-gradient(circle, rgba(101,31,255,0.15) 0%, rgba(0,188,212,0.15) 100%)'
                        : 'radial-gradient(circle, rgba(101,31,255,0.1) 0%, rgba(0,188,212,0.1) 100%)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 0 80px rgba(124,77,255,0.3)'
                        : '0 0 80px rgba(124,77,255,0.15)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Colorful brain background glow */}
                    <Box 
                      sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,64,129,0.2) 0%, rgba(101,31,255,0.2) 50%, rgba(0,188,212,0.2) 100%)',
                        filter: 'blur(20px)',
                        opacity: 0.8,
                      }}
                    />
                    
                    {/* Brain shape with gradient fill */}
                    <motion.div
                      animate={{ 
                        scale: [0.95, 1.02, 0.95],
                        rotate: [0, 2, 0],
                      }}
                      transition={{ 
                        duration: 8, 
                        repeat: Infinity,
                        repeatType: 'reverse',
                      }}
                      style={{
                        position: 'relative',
                        width: 200,
                        height: 200,
                        zIndex: 2,
                      }}
                    >
                      <svg 
                        viewBox="0 0 24 24" 
                        width="100%" 
                        height="100%"
                        style={{ filter: 'drop-shadow(0 0 15px rgba(101,31,255,0.5))' }}
                      >
                        <defs>
                          <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FF4081" />
                            <stop offset="50%" stopColor="#651FFF" />
                            <stop offset="100%" stopColor="#00BCD4" />
                          </linearGradient>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        
                        {/* Brain icon path with gradient fill */}
                        <path 
                          d="M21.05,17.58C20.71,17.53 20.4,17.36 20.16,17.11C19.92,16.86 19.75,16.55 19.69,16.21C20.2,15.78 20.56,15.19 20.7,14.53C20.84,13.87 20.76,13.19 20.46,12.59C20.17,11.99 19.68,11.5 19.08,11.21C18.48,10.91 17.8,10.83 17.14,10.97C17,10.41 16.65,9.92 16.17,9.58C15.69,9.24 15.11,9.07 14.53,9.1C14.55,6.6 12.53,4.58 10.03,4.59C9.57,4.5 9.09,4.5 8.63,4.59C6.52,4.88 4.91,6.5 4.64,8.61C4.27,8.87 3.96,9.21 3.73,9.6C3.51,9.99 3.38,10.42 3.34,10.88C2.35,11.18 1.5,11.86 1,12.79C0.5,13.71 0.38,14.8 0.67,15.82C0.96,16.84 1.64,17.69 2.56,18.19C3.48,18.69 4.58,18.8 5.6,18.52L5.69,18.5C6.34,19.64 7.47,20.39 8.75,20.5C9.95,20.5 11.09,20 11.91,19.09C12.17,19.14 12.44,19.18 12.75,19.18C13.09,19.18 13.34,19.14 13.58,19.09C14.4,20 15.54,20.5 16.75,20.5C18.85,20.35 20.55,18.65 20.69,16.55H21.05C21.91,16.53 22.61,15.83 22.63,14.97V19.2C22.63,20.2 21.83,21 20.83,21H3.25C2.25,21 1.45,20.2 1.45,19.2V5.33C1.45,4.33 2.25,3.53 3.25,3.53H20.83C21.83,3.53 22.63,4.33 22.63,5.33V14.93C22.63,16.03 21.83,16.83 20.83,16.83L21.05,17.58ZM10.03,14.73C9.09,14.73 8.33,13.97 8.33,13.03C8.33,12.09 9.09,11.33 10.03,11.33C10.97,11.33 11.73,12.09 11.73,13.03C11.73,13.96 10.97,14.72 10.04,14.73H10.03ZM18.03,14.73C17.09,14.73 16.33,13.97 16.33,13.03C16.33,12.09 17.09,11.33 18.03,11.33C18.97,11.33 19.73,12.09 19.73,13.03C19.73,13.97 18.97,14.73 18.03,14.73Z"
                          fill="url(#brainGradient)"
                          filter="url(#glow)"
                        />
                      </svg>
                    </motion.div>
                    
                    {/* Neural nodes */}
                    <NeuralNode x={35} y={35} size={12} color="#FF4081" pulseDelay={0} pulseSpeed={2.5} />
                    <NeuralNode x={65} y={35} size={14} color="#9C27B0" pulseDelay={0.5} pulseSpeed={3} />
                    <NeuralNode x={30} y={60} size={10} color="#651FFF" pulseDelay={1} pulseSpeed={2.7} />
                    <NeuralNode x={70} y={60} size={12} color="#3F51B5" pulseDelay={1.5} pulseSpeed={2.2} />
                    <NeuralNode x={40} y={75} size={8} color="#2196F3" pulseDelay={0.7} pulseSpeed={3.2} />
                    <NeuralNode x={60} y={75} size={10} color="#00BCD4" pulseDelay={1.2} pulseSpeed={2.8} />
                    
                    {/* "Thought" particles traveling through neural connections */}
                    <ThoughtParticle delay={0} duration={3} color="#FF4081" />
                    <ThoughtParticle delay={1} duration={4} color="#9C27B0" />
                    <ThoughtParticle delay={2} duration={3.5} color="#651FFF" />
                    <ThoughtParticle delay={1.5} duration={4.5} color="#3F51B5" />
                    <ThoughtParticle delay={0.5} duration={3.2} color="#2196F3" />
                    <ThoughtParticle delay={2.5} duration={4.2} color="#00BCD4" />
                    
                    {/* Neural connections/paths as SVG */}
                    <svg 
                      width="100%" 
                      height="100%" 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1,
                      }}
                    >
                      <motion.path 
                        d="M112,112 C150,80 200,140 230,112" 
                        stroke="#FF4081"
                        strokeWidth="1.5"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ 
                          pathLength: [0, 1],
                          opacity: [0.4, 0.8, 0.4]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity,
                          repeatType: 'loop',
                          ease: "easeInOut",
                          delay: 0.2
                        }}
                      />
                      <motion.path 
                        d="M208,112 C170,180 120,150 112,208" 
                        stroke="#651FFF"
                        strokeWidth="1.5"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ 
                          pathLength: [0, 1],
                          opacity: [0.4, 0.8, 0.4]
                        }}
                        transition={{ 
                          duration: 3.5, 
                          repeat: Infinity,
                          repeatType: 'loop',
                          ease: "easeInOut",
                          delay: 0.5
                        }}
                      />
                      <motion.path 
                        d="M112,112 C80,150 200,180 208,208" 
                        stroke="#00BCD4"
                        strokeWidth="1.5"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ 
                          pathLength: [0, 1],
                          opacity: [0.4, 0.8, 0.4]
                        }}
                        transition={{ 
                          duration: 4, 
                          repeat: Infinity,
                          repeatType: 'loop',
                          ease: "easeInOut",
                          delay: 1
                        }}
                      />
                      <motion.path 
                        d="M96,192 C140,140 240,170 224,96" 
                        stroke="#9C27B0"
                        strokeWidth="1.5"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ 
                          pathLength: [0, 1],
                          opacity: [0.4, 0.8, 0.4]
                        }}
                        transition={{ 
                          duration: 4.5, 
                          repeat: Infinity,
                          repeatType: 'loop',
                          ease: "easeInOut",
                          delay: 1.5
                        }}
                      />
                    </svg>
                    
                    {/* Add brain activity sparks - key for vibrant visualization */}
                    <BrainActivitySpark delay={0} />
                    <BrainActivitySpark delay={0.3} />
                    <BrainActivitySpark delay={0.6} />
                    <BrainActivitySpark delay={0.9} />
                    <BrainActivitySpark delay={1.2} />
                    <BrainActivitySpark delay={1.5} />
                    <BrainActivitySpark delay={1.8} />
                    <BrainActivitySpark delay={2.1} />
                    <BrainActivitySpark delay={2.4} />
                    <BrainActivitySpark delay={2.7} />
                    
                    {/* Add synapse connections */}
                    <SynapseConnection x1="35%" y1="35%" x2="65%" y2="35%" color="#FF4081" delay={0.2} />
                    <SynapseConnection x1="30%" y1="60%" x2="70%" y2="60%" color="#651FFF" delay={0.5} />
                    <SynapseConnection x1="40%" y1="75%" x2="60%" y2="75%" color="#00BCD4" delay={0.8} />
                    <SynapseConnection x1="35%" y1="35%" x2="30%" y2="60%" color="#9C27B0" delay={1.1} />
                    <SynapseConnection x1="65%" y1="35%" x2="70%" y2="60%" color="#3F51B5" delay={1.4} />
                  </Box>
                </motion.div>
                
                {/* Orbital rings with animated glow */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0.6,
                    pointerEvents: 'none',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0.2, 0.4, 0.2],
                        scale: 1,
                        rotate: i % 2 === 0 ? [0, 360] : [0, -360],
                      }}
                      transition={{ 
                        duration: 20 + i * 5,
                        delay: i * 0.3,
                        repeat: Infinity,
                        repeatType: 'loop',
                        ease: "linear"
                      }}
                      style={{
                        position: 'absolute',
                        width: 260 + i * 25,
                        height: 260 + i * 25,
                        borderRadius: '50%',
                        border: `1px solid rgba(${i % 3 === 0 ? '255,64,129' : i % 3 === 1 ? '101,31,255' : '0,188,212'},${0.2 - i * 0.02})`,
                        boxShadow: `0 0 10px rgba(${i % 3 === 0 ? '255,64,129' : i % 3 === 1 ? '101,31,255' : '0,188,212'},${0.1 - i * 0.01})`,
                      }}
                    />
                  ))}
                </Box>
                
                {/* Interactive floating thought bubbles that respond to mouse */}
                {[...Array(8)].map((_, i) => {
                  const size = 6 + Math.random() * 15;
                  const xOffset = (mousePosition.x - 0.5) * 50;
                  const yOffset = (mousePosition.y - 0.5) * 50;
                  
                  const colorOptions = ['#FF4081', '#9C27B0', '#651FFF', '#3F51B5', '#2196F3', '#00BCD4'];
                  const color = colorOptions[i % colorOptions.length];
                  
                  return (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{
                        x: xOffset * (1 + i % 3) * 0.3,
                        y: yOffset * (1 + i % 4) * 0.3,
                        scale: [0.8, 1.2, 0.8],
                        opacity: [0.4, 0.7, 0.4]
                      }}
                      transition={{
                        duration: 3 + i,
                        repeat: Infinity,
                        repeatType: 'reverse'
                      }}
                      style={{
                        position: 'absolute',
                        top: `${30 + (i % 4) * 10}%`,
                        left: `${30 + (i % 3) * 15}%`,
                        width: size,
                        height: size,
                        borderRadius: '50%',
                        backgroundColor: color,
                        filter: `blur(${size/4}px)`,
                        boxShadow: `0 0 ${size/2}px ${color}`,
                        zIndex: 3
                      }}
                    />
                  );
                })}
              </Box>
            </Grid>
          </Grid>
        </Container>
        
        {/* Wave shape at bottom */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -2,
            left: 0,
            width: '100%',
            overflow: 'hidden',
            lineHeight: 0,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            style={{
              position: 'relative',
              display: 'block',
              width: 'calc(100% + 1.3px)',
              height: 70,
              transform: 'rotateY(180deg)',
            }}
            fill={theme.palette.background.default}
          >
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
          </svg>
        </Box>
      </Box>
      
      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #651FFF 30%, #00BCD4 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Features
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" sx={{ maxWidth: 700, mx: 'auto' }}>
              MindFlex offers a comprehensive suite of tools and activities designed to enhance cognitive function and track progress.
            </Typography>
          </motion.div>
        </Box>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }} // Faster animation
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ scale: 1.03 }}
                onHoverStart={() => handleFeatureHover(index)}
                onHoverEnd={handleFeatureLeave}
              >
                <Paper
                  component={RouterLink}
                  to={featureLinks[feature.title]}
                  elevation={2}
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    backgroundColor: theme => theme.palette.mode === 'dark'
                      ? 'rgba(19, 47, 76, 0.4)'
                      : 'rgba(255, 255, 255, 0.8)',
                    borderTop: `4px solid ${feature.color}`,
                    borderRadius: 2,
                    transition: 'all 0.2s ease', // Faster transition
                    position: 'relative',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(135deg, ${feature.color}10, ${feature.color}00)`,
                      opacity: 0,
                      transition: 'opacity 0.2s ease', // Faster transition
                    },
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 4,
                      '&::before': {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <motion.div
                    animate={hoverFeature === index ? { 
                      scale: [1, 1.2, 1.1],
                      rotate: [0, 10, 0],
                      y: [0, -5, 0],
                    } : {}}
                    transition={{ duration: 0.3 }} // Faster animation
                  >
                    <Box
                      sx={{
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        bgcolor: `${feature.color}20`,
                        color: feature.color,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: `${feature.color}30`,
                        },
                      }}
                    >
                      {feature.icon}
                    </Box>
                  </motion.div>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      color: hoverFeature === index ? feature.color : 'inherit',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
      
      {/* How It Works Section */}
      <Box
        sx={{
          bgcolor: theme => theme.palette.mode === 'dark'
            ? 'rgba(19, 47, 76, 0.6)'
            : 'rgba(232, 244, 253, 0.6)',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" component="h2" gutterBottom>
              How It Works
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" sx={{ maxWidth: 700, mx: 'auto' }}>
              Get started with MindFlex in just a few simple steps
            </Typography>
          </Box>
          
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Box sx={{ px: { xs: 0, md: 4 } }}>
                  <List>
                    {howItWorksSteps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.02 }}
                        onHoverStart={() => handleStepHover(index)}
                        onHoverEnd={handleStepLeave}
                      >
                        <ListItem
                          component={RouterLink}
                          to={step.link}
                          sx={{
                            mb: 2,
                            p: 2,
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            boxShadow: 1,
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            textDecoration: 'none',
                            color: 'inherit',
                            '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: 3,
                              bgcolor: activeStep === index 
                                ? theme.palette.mode === 'dark' 
                                  ? 'rgba(83, 109, 254, 0.15)'
                                  : 'rgba(83, 109, 254, 0.05)'
                                : 'background.paper',
                            },
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              width: '100%',
                              height: '3px',
                              background: 'linear-gradient(90deg, #651FFF 0%, #00BCD4 100%)',
                              opacity: activeStep === index ? 1 : 0,
                              transition: 'opacity 0.3s ease',
                            }
                          }}
                        >
                          <ListItemIcon>
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                bgcolor: activeStep === index 
                                  ? 'primary.main'
                                  : theme.palette.mode === 'dark'
                                    ? 'rgba(83, 109, 254, 0.7)'
                                    : 'rgba(83, 109, 254, 0.9)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                              }}
                            >
                              {index + 1}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={step.title}
                            secondary={step.description}
                            primaryTypographyProps={{ 
                              fontWeight: 'bold',
                              color: activeStep === index ? 'primary.main' : 'inherit'
                            }}
                          />
                          <motion.div
                            animate={activeStep === index ? { x: [0, 5, 0] } : {}}
                            transition={{ repeat: Infinity, duration: 1 }}
                          >
                            <ArrowIcon 
                              sx={{ 
                                opacity: activeStep === index ? 1 : 0.3,
                                transition: 'opacity 0.3s ease'
                              }} 
                            />
                          </motion.div>
                        </ListItem>
                      </motion.div>
                    ))}
                  </List>
                  
                  {!user && (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                      <Button
                        component={RouterLink}
                        to="/register"
                        variant="contained"
                        color="primary"
                        size="large"
                        endIcon={<ArrowIcon />}
                        sx={{ px: 4, py: 1.5 }}
                      >
                        Get Started Now
                      </Button>
                    </Box>
                  )}
                </Box>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Box
                  sx={{
                    display: { xs: 'none', md: 'block' },
                    position: 'relative',
                    height: 500,
                  }}
                >
                  {/* Patient Journey Screenshots Slideshow - MUI Version */}
                  <Paper
                    elevation={3}
                    sx={{
                      position: 'absolute',
                      top: '10%',
                      left: '10%',
                      width: '80%',
                      height: '80%',
                      borderRadius: 2,
                      overflow: 'hidden',
                      background: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
                    }}
                  >
                    {slideshowImages.length > 0 ? (
                      <Box 
                        sx={{ 
                          position: 'relative', 
                          width: '100%', 
                          height: '100%',
                          '&:hover .slideshow-nav': {
                            opacity: 1,
                          }
                        }}
                      >
                        {/* Slide images */}
                        {slideshowImages.map((image, index) => (
                          <Box
                            key={index}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              opacity: activeSlide === index ? 1 : 0,
                              transition: 'opacity 0.5s ease-in-out',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {/* Fallback content */}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundImage: 'linear-gradient(135deg, #6B8DFF 0%, #FF6B6B 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 0,
                              }}
                            >
                              <Typography variant="h5" color="white" align="center">
                                {index === 0 ? "Initial Assessment" :
                                 index === 1 ? "Cognitive Profile" :
                                 index === 2 ? "Personalized Plan" :
                                 index === 3 ? "Daily Training" :
                                 index === 4 ? "Progress Analytics" :
                                 index === 5 ? "Achievement Tracking" :
                                 `Patient Journey ${index + 1}`}
                              </Typography>
                            </Box>
                            
                            {/* Actual image */}
                            <img
                              src={getImageUrl(image)}
                              alt={`Patient Journey Step ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                position: 'relative',
                                zIndex: 1,
                              }}
                              onError={(e) => {
                                console.log(`Error loading image: ${image}`);
                                e.target.style.display = 'none';
                              }}
                              loading="eager"
                            />
                          </Box>
                        ))}
                        
                        {/* Navigation buttons */}
                        <IconButton
                          onClick={handlePrevSlide}
                          className="slideshow-nav"
                          sx={{
                            position: 'absolute',
                            left: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 10,
                            bgcolor: 'rgba(255, 255, 255, 0.7)',
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                            },
                          }}
                        >
                          <ChevronLeftIcon />
                        </IconButton>
                        
                        <IconButton
                          onClick={handleNextSlide}
                          className="slideshow-nav"
                          sx={{
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 10,
                            bgcolor: 'rgba(255, 255, 255, 0.7)',
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                            },
                          }}
                        >
                          <ChevronRightIcon />
                        </IconButton>
                        
                        {/* Dots indicator */}
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 16,
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            zIndex: 10,
                          }}
                        >
                          {slideshowImages.map((_, index) => (
                            <Box
                              key={index}
                              onClick={() => handleDotClick(index)}
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                mx: 0.5,
                                bgcolor: activeSlide === index ? 'primary.main' : 'rgba(255, 255, 255, 0.5)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'scale(1.2)',
                                },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    ) : (
                      // Fallback if no images are available
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          backgroundImage: 'linear-gradient(135deg, #6B8DFF 0%, #FF6B6B 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="h5" color="white" align="center">
                          Patient Journey Screenshots<br />Coming Soon
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                  
                  {/* Progress Overview Card - Redesigned to be better positioned */}
                  <Box
                    component={motion.div}
                    whileHover={{ 
                      scale: 1.03,
                      y: -5,
                    }}
                    transition={{ duration: 0.3 }}
                    sx={{
                      position: 'absolute',
                      bottom: '5%',
                      right: '5%',
                      width: '35%',
                      zIndex: 5,
                    }}
                  >
                    <Paper
                      elevation={4}
                      sx={{
                        height: '100%',
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        p: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: 8,
                        },
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Progress Overview
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Memory</span>
                          <span>78%</span>
                        </Typography>
                        <LinearProgress variant="determinate" value={78} sx={{ mb: 1, height: 8, borderRadius: 4 }} />
                        <Typography variant="caption" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Attention</span>
                          <span>65%</span>
                        </Typography>
                        <LinearProgress variant="determinate" value={65} sx={{ mb: 1, height: 8, borderRadius: 4 }} />
                        <Typography variant="caption" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Processing Speed</span>
                          <span>82%</span>
                        </Typography>
                        <LinearProgress variant="determinate" value={82} sx={{ height: 8, borderRadius: 4 }} />
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* Call to Action */}
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          background: theme => theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #424242 0%, #212121 100%)'
            : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" gutterBottom>
            Ready to Train Your Brain?
          </Typography>
          <Typography variant="h6" color="textSecondary" paragraph sx={{ mb: 4 }}>
            Join thousands of users who are already improving their cognitive abilities with MindFlex.
          </Typography>
          
          {user ? (
            <Button
              component={RouterLink}
              to="/games"
              variant="contained"
              color="primary"
              size="large"
              sx={{ px: 6, py: 1.5, fontSize: '1.1rem' }}
            >
              Start Playing
            </Button>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                color="primary"
                size="large"
                sx={{ px: 6, py: 1.5, fontSize: '1.1rem' }}
              >
                Sign Up Free
              </Button>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                color="primary"
                size="large"
                sx={{ px: 6, py: 1.5, fontSize: '1.1rem' }}
              >
                Log In
              </Button>
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage; 