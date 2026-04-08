import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Refresh,
  Settings,
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ArrowForward,
  Stop,
  Speed,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { gameService, GameSessionManager } from '../../../services/gameService';
import customMissionService from '../../../services/customMissionService';
import ScoreSubmission from '../ScoreSubmission';
import { useAuth } from '../../../contexts/AuthContext';
import MissionBuilder from '../mission/MissionBuilder';
import missionProgressService from '../../../services/missionProgressService';

// Custom useInterval hook (Dan Abramov's implementation)
function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (typeof savedCallback?.current !== 'undefined') {
        savedCallback.current();
      }
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

const getGridSize = (difficulty) => {
  switch (difficulty) {
    case 'easy': return 20;
    case 'medium': return 30;
    case 'hard': return 40;
    default: return 20;
  }
};

const getInitialSpeed = (difficulty) => {
  switch (difficulty) {
    case 'easy': return 200;
    case 'medium': return 150;
    case 'hard': return 100;
    default: return 200;
  }
};

const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const POWERUPS = {
  SPEED_BOOST: { color: '#FFD700', effect: 'speed', duration: 3000 },
  SLOW_DOWN: { color: '#00CED1', effect: 'slow', duration: 3000 },
  SCORE_MULTIPLIER: { color: '#FF6347', effect: 'multiplier', duration: 10000 },
  INVINCIBILITY: { color: '#9370DB', effect: 'invincible', duration: 3000 },
};

const SnakeGame = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Game state
  const [game, setGame] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [sessionManager, setSessionManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState('easy');
  
  // Snake game state
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState([{ x: 15, y: 15 }]); // Changed to array for multiple apples
  const [direction, setDirection] = useState(DIRECTIONS.RIGHT);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [speed, setSpeed] = useState(getInitialSpeed('easy'));
  const [gameArea, setGameArea] = useState(null);
  
  // Advanced features
  const [powerups, setPowerups] = useState([]);
  const [activePowerups, setActivePowerups] = useState([]);
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  const [obstacles, setObstacles] = useState([]);
  const [showObstacles, setShowObstacles] = useState(false);
  
  // Mission system
  const [customMission, setCustomMission] = useState(null);
  const [missionProgress, setMissionProgress] = useState(null);
  const [missionStats, setMissionStats] = useState({
    foodEaten: 0,
    powerupsCollected: 0,
    timeAlive: 0,
    maxLength: 1,
  });
  
  // UI state
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [gameMode, setGameMode] = useState('classic'); // classic, mission, endless
  const [showMissionBuilder, setShowMissionBuilder] = useState(false);
  const [snakeColor, setSnakeColor] = useState('#4CAF50');
  const [gameSpeed, setGameSpeed] = useState(5); // 1-10 scale
  
  // Stats tracking
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    totalScore: 0,
    bestTime: 0,
    longestSnake: 0,
    powerupsUsed: 0,
  });

  const gridSize = useMemo(() => getGridSize(difficulty), [difficulty]);

  // Initialize game
  useEffect(() => {
    if (!user?.id) {
      console.log('User not yet loaded, waiting...');
      return;
    }
    
    const fetchGame = async () => {
      try {
        const { data, error } = await gameService.getGameById(gameId);
        if (error) {
          console.error('Error fetching game:', error);
          return;
        }
        
        setGame(data);
        
        // Initialize session manager
        const manager = new GameSessionManager();
        setSessionManager(manager);
        
        // Load user's high score and stats
        const userStats = await gameService.getUserStats('snake');
        if (userStats.data) {
          setHighScore(userStats.data.best_score || 0);
          setStats(userStats.data.stats || stats);
        }
        
      } catch (error) {
        console.error('Error in game setup:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [user?.id, gameId, stats]);

  // Initialize game area
  useEffect(() => {
    const newGameArea = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
    setGameArea(newGameArea);
    resetGame();
  }, [gridSize]);

  // Game loop
  useInterval(() => {
    if (gameRunning && !gameOver) {
      moveSnake();
      updateTimer();
    }
  }, speed);

  // Powerup effects timer
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePowerups(prev => prev.filter(powerup => {
        if (Date.now() - powerup.startTime > powerup.duration) {
          // Remove powerup effect
          if (powerup.type === 'speed') {
            setSpeed(getInitialSpeed(difficulty));
          } else if (powerup.type === 'multiplier') {
            setScoreMultiplier(1);
          }
          return false;
        }
        return true;
      }));
    }, 100);

    return () => clearInterval(timer);
  }, [difficulty]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Prevent default for arrow keys and space to stop page scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (!gameRunning || gameOver) return;

      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          if (direction !== DIRECTIONS.DOWN) setDirection(DIRECTIONS.UP);
          break;
        case 'arrowdown':
        case 's':
          if (direction !== DIRECTIONS.UP) setDirection(DIRECTIONS.DOWN);
          break;
        case 'arrowleft':
        case 'a':
          if (direction !== DIRECTIONS.RIGHT) setDirection(DIRECTIONS.LEFT);
          break;
        case 'arrowright':
        case 'd':
          if (direction !== DIRECTIONS.LEFT) setDirection(DIRECTIONS.RIGHT);
          break;
        case ' ':
          pauseGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameRunning, gameOver]);

  const generateFood = useCallback((count = 1) => {
    const newFoodItems = [];
    for (let i = 0; i < count; i++) {
      let newFood;
      let attempts = 0;
      do {
        newFood = {
          x: Math.floor(Math.random() * gridSize),
          y: Math.floor(Math.random() * gridSize),
        };
        attempts++;
      } while (
        attempts < 100 && (
          snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
          obstacles.some(obs => obs.x === newFood.x && obs.y === newFood.y) ||
          food.some(f => f.x === newFood.x && f.y === newFood.y) ||
          newFoodItems.some(f => f.x === newFood.x && f.y === newFood.y) ||
          powerups.some(p => p.x === newFood.x && p.y === newFood.y)
        )
      );
      if (attempts < 100) {
        newFoodItems.push(newFood);
      }
    }
    return newFoodItems;
  }, [snake, obstacles, gridSize, food, powerups]);

  const addFood = useCallback(() => {
    const newFoodItems = generateFood(1);
    if (newFoodItems.length > 0) {
      setFood(prev => [...prev, ...newFoodItems]);
    }
  }, [generateFood]);

  const initializeFood = useCallback(() => {
    const initialFood = generateFood(1);
    setFood(initialFood);
  }, [generateFood]);

  const resetGame = useCallback(() => {
    const centerX = Math.floor(gridSize / 2);
    const centerY = Math.floor(gridSize / 2);
    
    setSnake([{ x: centerX, y: centerY }]);
    setDirection(DIRECTIONS.RIGHT);
    setGameRunning(false);
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    const newSpeed = 300 - (gameSpeed * 25);
    setSpeed(Math.max(50, newSpeed));
    setPowerups([]);
    setActivePowerups([]);
    setScoreMultiplier(1);
    setMissionStats({
      foodEaten: 0,
      powerupsCollected: 0,
      timeAlive: 0,
      maxLength: 1,
    });
    
    initializeFood();
    generateObstacles();
    if (Math.random() < 0.3) generatePowerup();
  }, [gridSize, difficulty, gameSpeed, initializeFood]);

  const generatePowerup = useCallback(() => {
    if (powerups.length >= 2) return; // Max 2 powerups at once

    const powerupTypes = Object.keys(POWERUPS);
    const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    
    let position;
    do {
      position = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
      };
    } while (
      snake.some(segment => segment.x === position.x && segment.y === position.y) ||
      (food.x === position.x && food.y === position.y) ||
      obstacles.some(obs => obs.x === position.x && obs.y === position.y) ||
      powerups.some(p => p.x === position.x && p.y === position.y)
    );

    setPowerups(prev => [...prev, { ...position, type, ...POWERUPS[type] }]);
  }, [snake, food, obstacles, powerups, gridSize]);

  const generateObstacles = useCallback(() => {
    if (!showObstacles) {
      setObstacles([]);
      return;
    }

    const numObstacles = Math.floor(gridSize * 0.05); // 5% of grid
    const newObstacles = [];

    for (let i = 0; i < numObstacles; i++) {
      let obstacle;
      do {
        obstacle = {
          x: Math.floor(Math.random() * gridSize),
          y: Math.floor(Math.random() * gridSize),
        };
      } while (
        Math.abs(obstacle.x - Math.floor(gridSize / 2)) < 3 &&
        Math.abs(obstacle.y - Math.floor(gridSize / 2)) < 3
      );
      newObstacles.push(obstacle);
    }
    
    setObstacles(newObstacles);
  }, [gridSize, showObstacles]);

  const startGame = async () => {
    if (!sessionManager) return;

    try {
      // Start game session
      const { data: session, error } = await sessionManager.startSession(gameId, difficulty);
      if (error) {
        console.error('Failed to start game session:', error);
        return;
      }
      
      setGameSession(session);
      setGameStarted(true);
      setGameRunning(true);
      setStartTime(Date.now());
      
      // Check for custom mission
      if (customMission) {
        const progress = await missionProgressService.startMission(customMission.id);
        setMissionProgress(progress.data);
      }
      
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const pauseGame = () => {
    setGameRunning(!gameRunning);
  };

  const endGame = async () => {
    if (!sessionManager || !gameSession) return;

    setGameOver(true);
    setGameRunning(false);
    
    const endTime = Date.now();
    const duration = startTime ? Math.floor((endTime - startTime) / 1000) : 0;
    
    // Update mission progress if applicable
    if (customMission && missionProgress) {
      await missionProgressService.updateProgress(missionProgress.id, {
        ...missionStats,
        timeAlive: duration,
        completed: checkMissionCompletion(),
      });
    }

    // Complete game session
    const sessionData = {
      level_reached: level,
      food_eaten: missionStats.foodEaten,
      powerups_collected: missionStats.powerupsCollected,
      max_length: missionStats.maxLength,
      obstacles_hit: 0,
      game_mode: gameMode,
    };

    const { data: completedSession, error } = await sessionManager.completeSession(score, sessionData);
    
    if (!error && completedSession) {
      // Update high score
      if (score > highScore) {
        setHighScore(score);
      }
      
      // Update stats
      setStats(prev => ({
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        totalScore: prev.totalScore + score,
        bestTime: Math.max(prev.bestTime, duration),
        longestSnake: Math.max(prev.longestSnake, snake.length),
        powerupsUsed: prev.powerupsUsed + missionStats.powerupsCollected,
      }));
      
      setShowScoreDialog(true);
    }
  };

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };
      
      head.x += direction.x;
      head.y += direction.y;
      
      // Check wall collision
      if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
        if (!activePowerups.some(p => p.type === 'invincible')) {
          endGame();
          return prevSnake;
        } else {
          // Wrap around with invincibility
          head.x = (head.x + gridSize) % gridSize;
          head.y = (head.y + gridSize) % gridSize;
        }
      }
      
      // Check self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        if (!activePowerups.some(p => p.type === 'invincible')) {
          endGame();
          return prevSnake;
        }
      }
      
      // Check obstacle collision
      if (obstacles.some(obs => obs.x === head.x && obs.y === head.y)) {
        if (!activePowerups.some(p => p.type === 'invincible')) {
          endGame();
          return prevSnake;
        }
      }
      
      newSnake.unshift(head);
      
      // Check food collision
      const eatenFoodIndex = food.findIndex(f => f.x === head.x && f.y === head.y);
      if (eatenFoodIndex !== -1) {
        const baseScore = 10 * level;
        const earnedScore = Math.floor(baseScore * scoreMultiplier);
        setScore(prev => prev + earnedScore);
        
        // Remove eaten food
        setFood(prev => prev.filter((_, index) => index !== eatenFoodIndex));
        
        // Update mission stats
        setMissionStats(prev => ({
          ...prev,
          foodEaten: prev.foodEaten + 1,
          maxLength: Math.max(prev.maxLength, newSnake.length),
        }));
        
        // Progressive apple spawning logic
        const totalFoodEaten = missionStats.foodEaten + 1;
        const maxApples = Math.min(5, Math.floor(totalFoodEaten / 3) + 1); // Max 5 apples, increase every 3 eaten
        
        // Add new food to maintain proper count
        if (food.length <= maxApples) {
          const newFoodCount = Math.min(2, maxApples - food.length + 1);
          const newFoodItems = generateFood(newFoodCount);
          if (newFoodItems.length > 0) {
            setFood(prev => [...prev.filter((_, index) => index !== eatenFoodIndex), ...newFoodItems]);
          }
        }
        
        // Increase level and speed
        if (totalFoodEaten % 5 === 0) {
          setLevel(prev => prev + 1);
          setSpeed(prev => Math.max(50, prev - 10));
        }
        
        // Random powerup generation
        if (Math.random() < 0.2) {
          generatePowerup();
        }
      } else {
        newSnake.pop();
      }
      
      // Check powerup collision
      powerups.forEach(powerup => {
        if (head.x === powerup.x && head.y === powerup.y) {
          activatePowerup(powerup);
          setPowerups(prev => prev.filter(p => p !== powerup));
          setMissionStats(prev => ({
            ...prev,
            powerupsCollected: prev.powerupsCollected + 1,
          }));
        }
      });
      
      return newSnake;
    });
  }, [direction, gridSize, food, obstacles, powerups, activePowerups, level, scoreMultiplier, missionStats]);

  const activatePowerup = (powerup) => {
    const powerupEffect = {
      type: powerup.effect,
      startTime: Date.now(),
      duration: powerup.duration,
    };
    
    setActivePowerups(prev => [...prev, powerupEffect]);
    
    switch (powerup.effect) {
      case 'speed':
        setSpeed(prev => Math.max(50, prev / 2));
        break;
      case 'slow':
        setSpeed(prev => prev * 2);
        break;
      case 'multiplier':
        setScoreMultiplier(3);
        break;
      case 'invincible':
        // Visual indication handled in render
        break;
    }
  };

  const updateTimer = () => {
    if (startTime) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setCurrentTime(elapsed);
      setMissionStats(prev => ({ ...prev, timeAlive: elapsed }));
    }
  };

  const checkMissionCompletion = () => {
    if (!customMission) return false;
    
    const objectives = customMission.objectives || {};
    return (
      (!objectives.score || score >= objectives.score) &&
      (!objectives.food_eaten || missionStats.foodEaten >= objectives.food_eaten) &&
      (!objectives.time_alive || missionStats.timeAlive >= objectives.time_alive) &&
      (!objectives.max_length || missionStats.maxLength >= objectives.max_length)
    );
  };

  const renderGameBoard = () => {
    if (!gameArea) return null;

    const cellSize = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 16 : 12;
    const boardSize = gridSize * cellSize + (gridSize - 1); // Add space for borders

    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
          gap: '1px',
          backgroundColor: '#333',
          border: '3px solid #333',
          borderRadius: 2,
          p: 1,
          width: `${boardSize + 16}px`,
          height: `${boardSize + 16}px`,
          margin: '0 auto',
        }}
      >
        {gameArea.map((row, y) =>
          row.map((_, x) => {
            const isSnake = snake.some(segment => segment.x === x && segment.y === y);
            const isFood = food.some(f => f.x === x && f.y === y);
            const isPowerup = powerups.find(p => p.x === x && p.y === y);
            const isObstacle = obstacles.some(obs => obs.x === x && obs.y === y);
            const isHead = snake[0] && snake[0].x === x && snake[0].y === y;
            
            let backgroundColor = '#1a1a1a';
            let content = '';
            let fontSize = cellSize * 0.6;
            
            if (isSnake) {
              const headColor = snakeColor;
              const bodyColor = snakeColor + 'CC';
              backgroundColor = isHead ? headColor : bodyColor;
              if (activePowerups.some(p => p.type === 'invincible')) {
                backgroundColor = isHead ? '#9C27B0' : '#BA68C8';
              }
            } else if (isFood) {
              backgroundColor = '#1a1a1a';
              content = '🍎';
              fontSize = cellSize * 0.8;
            } else if (isPowerup) {
              backgroundColor = isPowerup.color;
              content = getPowerupIcon(isPowerup.type);
              fontSize = cellSize * 0.7;
            } else if (isObstacle) {
              backgroundColor = '#795548';
              content = '🧱';
              fontSize = cellSize * 0.6;
            }
            
            return (
              <Box
                key={`${x}-${y}`}
                sx={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  backgroundColor,
                  borderRadius: isSnake ? '2px' : '1px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${fontSize}px`,
                  lineHeight: 1,
                  transition: 'all 0.1s ease',
                  border: isSnake && isHead ? `2px solid ${snakeColor}` : 'none',
                  boxShadow: isHead ? `0 0 6px ${snakeColor}` : 'none',
                }}
              >
                {content}
              </Box>
            );
          })
        )}
      </Box>
    );
  };

  const getPowerupIcon = (type) => {
    switch (type) {
      case 'SPEED_BOOST': return '⚡';
      case 'SLOW_DOWN': return '🐌';
      case 'SCORE_MULTIPLIER': return '💎';
      case 'INVINCIBILITY': return '🛡️';
      default: return '?';
    }
  };

  const renderControls = () => (
    <Grid container spacing={1} sx={{ mt: 2, maxWidth: '600px', margin: '16px auto 0' }}>
      <Grid item xs={3}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => setDirection(DIRECTIONS.UP)}
          disabled={!gameRunning || direction === DIRECTIONS.DOWN}
          startIcon={<ArrowUpward />}
        >
          Up
        </Button>
      </Grid>
      <Grid item xs={3}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => setDirection(DIRECTIONS.DOWN)}
          disabled={!gameRunning || direction === DIRECTIONS.UP}
          startIcon={<ArrowDownward />}
        >
          Down
        </Button>
      </Grid>
      <Grid item xs={3}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => setDirection(DIRECTIONS.LEFT)}
          disabled={!gameRunning || direction === DIRECTIONS.RIGHT}
          startIcon={<ArrowBack />}
        >
          Left
        </Button>
      </Grid>
      <Grid item xs={3}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => setDirection(DIRECTIONS.RIGHT)}
          disabled={!gameRunning || direction === DIRECTIONS.LEFT}
          startIcon={<ArrowForward />}
        >
          Right
        </Button>
      </Grid>
    </Grid>
  );

  const renderGameInfo = () => (
    <Grid container spacing={2} sx={{ mt: 2 }}>
      <Grid item xs={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="h6">{score}</Typography>
            <Typography variant="caption">Score</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="h6">{highScore}</Typography>
            <Typography variant="caption">High Score</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="h6">{level}</Typography>
            <Typography variant="caption">Level</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="h6">{snake.length}</Typography>
            <Typography variant="caption">Length</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderActivePowerups = () => {
    if (activePowerups.length === 0) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Active Powerups:</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {activePowerups.map((powerup, index) => {
            const timeLeft = Math.ceil((powerup.duration - (Date.now() - powerup.startTime)) / 1000);
            return (
              <Chip
                key={index}
                label={`${powerup.type.toUpperCase()} (${timeLeft}s)`}
                color="primary"
                size="small"
                icon={<Speed />}
              />
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderSettings = () => (
    <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Game Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                const newSpeed = 300 - (gameSpeed * 25);
                setSpeed(Math.max(50, newSpeed));
              }}
              disabled={gameStarted}
            >
              <MenuItem value="easy">Easy (20x20 Grid)</MenuItem>
              <MenuItem value="medium">Medium (30x30 Grid)</MenuItem>
              <MenuItem value="hard">Hard (40x40 Grid)</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Game Mode</InputLabel>
            <Select
              value={gameMode}
              onChange={(e) => setGameMode(e.target.value)}
              disabled={gameStarted}
            >
              <MenuItem value="classic">Classic</MenuItem>
              <MenuItem value="endless">Endless</MenuItem>
              <MenuItem value="mission">Custom Mission</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>Snake Speed: {gameSpeed}</Typography>
            <Slider
              value={gameSpeed}
              onChange={(e, newValue) => {
                setGameSpeed(newValue);
                // Convert 1-10 scale to milliseconds (higher number = faster = lower delay)
                const newSpeed = 300 - (newValue * 25); // Range: 275ms (slow) to 50ms (fast)
                setSpeed(Math.max(50, newSpeed));
              }}
              min={1}
              max={10}
              step={1}
              marks={[
                { value: 1, label: 'Slow' },
                { value: 5, label: 'Normal' },
                { value: 10, label: 'Fast' }
              ]}
              disabled={gameStarted}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>Snake Color</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[
                { name: 'Green', color: '#4CAF50' },
                { name: 'Blue', color: '#2196F3' },
                { name: 'Red', color: '#F44336' },
                { name: 'Purple', color: '#9C27B0' },
                { name: 'Orange', color: '#FF9800' },
                { name: 'Teal', color: '#009688' },
                { name: 'Pink', color: '#E91E63' },
                { name: 'Yellow', color: '#FFEB3B' }
              ].map((colorOption) => (
                <Button
                  key={colorOption.color}
                  variant={snakeColor === colorOption.color ? "contained" : "outlined"}
                  onClick={() => setSnakeColor(colorOption.color)}
                  sx={{
                    minWidth: 'auto',
                    width: 40,
                    height: 40,
                    backgroundColor: colorOption.color,
                    '&:hover': {
                      backgroundColor: colorOption.color,
                      opacity: 0.8
                    }
                  }}
                  disabled={gameStarted}
                >
                  {snakeColor === colorOption.color && '✓'}
                </Button>
              ))}
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>Obstacles</Typography>
            <Button
              variant={showObstacles ? "contained" : "outlined"}
              onClick={() => setShowObstacles(!showObstacles)}
              disabled={gameStarted}
            >
              {showObstacles ? 'Enabled' : 'Disabled'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowSettings(false)}>Close</Button>
        {gameMode === 'mission' && (
          <Button onClick={() => setShowMissionBuilder(true)} variant="contained">
            Create Mission
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Snake Game...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Snake Game
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Guide the snake to eat food and grow longer! Avoid walls and yourself.
            </Typography>
            
            {currentTime > 0 && (
              <Typography variant="h6" sx={{ mt: 1 }}>
                Time: {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}
              </Typography>
            )}
          </Box>

          {/* Game Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            {!gameStarted ? (
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                onClick={startGame}
                disabled={!sessionManager}
              >
                Start Game
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  onClick={pauseGame}
                  startIcon={gameRunning ? <Pause /> : <PlayArrow />}
                >
                  {gameRunning ? 'Pause' : 'Resume'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={endGame}
                  startIcon={<Stop />}
                  color="error"
                >
                  End Game
                </Button>
              </>
            )}
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={resetGame}
            >
              Reset
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => setShowSettings(true)}
            >
              Settings
            </Button>
          </Box>

          {/* Game Board */}
          {renderGameBoard()}
          
          {/* Mobile Controls */}
          {renderControls()}

          {/* Game Info */}
          {renderGameInfo()}
          
          {/* Active Powerups */}
          {renderActivePowerups()}

          {/* Mission Progress */}
          {customMission && missionProgress && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Mission: {customMission.name}</Typography>
              <LinearProgress 
                variant="determinate" 
                value={checkMissionCompletion() ? 100 : 50} 
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Progress: {missionStats.foodEaten} food, {missionStats.timeAlive}s alive, max length {missionStats.maxLength}
              </Typography>
            </Box>
          )}

          {/* Game Over Message */}
          {gameOver && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="h5" color="error" gutterBottom>
                Game Over!
              </Typography>
              <Typography variant="body1">
                Final Score: {score} | Final Length: {snake.length}
              </Typography>
              {score > highScore && (
                <Typography variant="h6" color="success.main" sx={{ mt: 1 }}>
                  New High Score! 🎉
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      </motion.div>

      {/* Settings Dialog */}
      {renderSettings()}

      {/* Mission Builder */}
      {showMissionBuilder && (
        <MissionBuilder
          gameType="snake"
          open={showMissionBuilder}
          onClose={() => setShowMissionBuilder(false)}
          onMissionCreated={(mission) => {
            setCustomMission(mission);
            setGameMode('mission');
          }}
        />
      )}

      {/* Score Submission Dialog */}
      {showScoreDialog && gameSession && (
        <ScoreSubmission
          open={showScoreDialog}
          onClose={() => {
            setShowScoreDialog(false);
            navigate('/games');
          }}
          gameSession={gameSession}
          finalScore={score}
          gameStats={{
            level_reached: level,
            food_eaten: missionStats.foodEaten,
            time_survived: missionStats.timeAlive,
            max_length: missionStats.maxLength,
            powerups_collected: missionStats.powerupsCollected,
          }}
        />
      )}
    </Container>
  );
};

export default SnakeGame;