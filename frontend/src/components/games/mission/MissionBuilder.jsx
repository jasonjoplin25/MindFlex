import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Paper,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Delete,
  FolderOpen,
  Build,
  Clear
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import customMissionService from '../../../services/customMissionService';
import { useAuth } from '../../../contexts/AuthContext';

// Tool types for mission building
const TOOLS = {
  WALL: 'wall',
  SNAKE_START: 'snake_start',
  TURTLE: 'turtle',
  TARGET: 'target',
  LADYBUG: 'ladybug',
  SPIDER: 'spider', 
  BUTTERFLY: 'butterfly',
  BEE: 'bee',
  FEATHER: 'feather',
  PENGUIN: 'penguin',
  FLAMINGO: 'flamingo',
  OWL: 'owl',
  PARROT: 'parrot',
  SWAN: 'swan',
  LOBSTER: 'lobster',
  LIZARD: 'lizard',
  SQUIRREL: 'squirrel',
  RABBIT: 'rabbit',
  HEDGEHOG: 'hedgehog',
  MOUSE: 'mouse',
  SKUNK: 'skunk',
  CAT: 'cat',
  MONKEY: 'monkey',
  POODLE: 'poodle',
  ERASER: 'eraser'
};

// Cell types in the grid
const CELL_TYPES = {
  EMPTY: 'empty',
  WALL: 'wall',
  SNAKE_START: 'snake_start',
  TURTLE: 'turtle',
  TARGET: 'target',
  LADYBUG: 'ladybug',
  SPIDER: 'spider',
  BUTTERFLY: 'butterfly',
  BEE: 'bee',
  FEATHER: 'feather',
  PENGUIN: 'penguin',
  FLAMINGO: 'flamingo',
  OWL: 'owl',
  PARROT: 'parrot',
  SWAN: 'swan',
  LOBSTER: 'lobster',
  LIZARD: 'lizard',
  SQUIRREL: 'squirrel',
  RABBIT: 'rabbit',
  HEDGEHOG: 'hedgehog',
  MOUSE: 'mouse',
  SKUNK: 'skunk',
  CAT: 'cat',
  MONKEY: 'monkey',
  POODLE: 'poodle'
};

const MissionBuilder = ({ onClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [gridSize, setGridSize] = useState(15);
  const [selectedTool, setSelectedTool] = useState(TOOLS.WALL);
  const [grid, setGrid] = useState([]);
  const [missionName, setMissionName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [savedMissions, setSavedMissions] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [isLoadingGeneratedMission, setIsLoadingGeneratedMission] = useState(false);
  const [hasLoadedMission, setHasLoadedMission] = useState(false);

  // Initialize grid
  useEffect(() => {
    if (!isLoadingGeneratedMission && !hasLoadedMission) {
      initializeGrid();
    }
  }, [gridSize, isLoadingGeneratedMission, hasLoadedMission]);

  // Load saved missions from database and handle migration
  useEffect(() => {
    const loadMissionsAndMigrate = async () => {
      if (!isAuthenticated) {
        console.log('User not authenticated, skipping mission loading');
        return;
      }

      try {
        // First, try to migrate any localStorage missions
        const migrationResult = await customMissionService.migrateFromLocalStorage();
        if (migrationResult.data && migrationResult.data.migrated_count > 0) {
          console.log(`Migrated ${migrationResult.data.migrated_count} missions from localStorage to database`);
        }

        // Load missions from database
        const { data: missions, error } = await customMissionService.getUserMissions();
        if (error) {
          console.error('Error loading missions:', error);
          setValidationError('Failed to load missions');
        } else {
          // Convert from database format to the format expected by the component
          const formattedMissions = missions.map(mission => ({
            name: mission.name,
            gridSize: mission.grid_size,
            grid: mission.grid_data,
            created: mission.created_at,
            id: mission.id,
            animalType: mission.animal_type
          }));
          setSavedMissions(formattedMissions);
        }
      } catch (error) {
        console.error('Error in loadMissionsAndMigrate:', error);
        setValidationError('Failed to load missions');
      }
    };

    loadMissionsAndMigrate();

    // Check if we're editing a generated mission
    const editMission = sessionStorage.getItem('editGeneratedMission');
    if (editMission) {
      console.log('Found editGeneratedMission in sessionStorage:', editMission);
      const missionData = JSON.parse(editMission);
      console.log('Parsed mission data:', missionData);
      // Don't remove it immediately, wait until after loading
      setTimeout(() => {
        loadGeneratedMission(missionData);
        sessionStorage.removeItem('editGeneratedMission');
      }, 50);
    } else {
      console.log('No editGeneratedMission found in sessionStorage');
    }
  }, [isAuthenticated]);

  const loadGeneratedMission = useCallback((missionData) => {
    console.log('loadGeneratedMission called with:', missionData);
    setIsLoadingGeneratedMission(true);
    
    const { gridSize: size, walls, snake, turtle, target } = missionData;
    console.log('Extracted data - size:', size, 'walls:', walls?.length, 'snake:', snake, 'turtle:', turtle, 'target:', target);
    
    // Convert to grid format
    const newGrid = Array(size).fill().map(() => Array(size).fill(CELL_TYPES.EMPTY));
    
    // Place walls
    walls.forEach(wall => {
      if (wall.x >= 0 && wall.x < size && wall.y >= 0 && wall.y < size) {
        newGrid[wall.y][wall.x] = CELL_TYPES.WALL;
      }
    });
    
    // Place snake start (use first snake segment)
    if (snake && snake.length > 0) {
      const snakeStart = snake[0];
      if (snakeStart.x >= 0 && snakeStart.x < size && snakeStart.y >= 0 && snakeStart.y < size) {
        newGrid[snakeStart.y][snakeStart.x] = CELL_TYPES.SNAKE_START;
      }
    }
    
    // Place turtle
    if (turtle && turtle.x >= 0 && turtle.x < size && turtle.y >= 0 && turtle.y < size) {
      newGrid[turtle.y][turtle.x] = CELL_TYPES.TURTLE;
    }
    
    // Place target
    if (target && target.x >= 0 && target.x < size && target.y >= 0 && target.y < size) {
      newGrid[target.y][target.x] = CELL_TYPES.TARGET;
    }
    
    console.log('Setting grid size to:', size);
    console.log('Setting grid:', newGrid);
    
    setGridSize(size);
    setGrid(newGrid);
    setMissionName('Edited Generated Mission');
    setValidationError('');
    setHasLoadedMission(true);
    
    // Allow normal grid initialization again
    setTimeout(() => {
      console.log('Resetting isLoadingGeneratedMission flag');
      setIsLoadingGeneratedMission(false);
    }, 100);
  }, []);

  const initializeGrid = useCallback(() => {
    const newGrid = Array(gridSize).fill().map(() => Array(gridSize).fill(CELL_TYPES.EMPTY));
    setGrid(newGrid);
    setValidationError('');
  }, [gridSize]);

  const handleCellClick = useCallback((row, col) => {
    if (selectedTool === TOOLS.ERASER) {
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid[row][col] = CELL_TYPES.EMPTY;
        return newGrid;
      });
      return;
    }

    // For unique elements (snake start, turtle, target), remove existing ones first
    if ([TOOLS.SNAKE_START, TOOLS.TURTLE, TOOLS.TARGET].includes(selectedTool)) {
      setGrid(prev => {
        const newGrid = prev.map(row => 
          row.map(cell => {
            if (cell === selectedTool) return CELL_TYPES.EMPTY;
            return cell;
          })
        );
        newGrid[row][col] = selectedTool;
        return newGrid;
      });
    } else {
      // For walls, just toggle
      setGrid(prev => {
        const newGrid = [...prev];
        newGrid[row][col] = selectedTool;
        return newGrid;
      });
    }
  }, [selectedTool]);

  const validateMission = useCallback(() => {
    // Find required elements
    let snakeStart = null;
    let animal = null;
    let target = null;

    // Define all animal types (turtle + new emojis)
    const animalTypes = [
      CELL_TYPES.TURTLE, CELL_TYPES.LADYBUG, CELL_TYPES.SPIDER, CELL_TYPES.BUTTERFLY, CELL_TYPES.BEE,
      CELL_TYPES.FEATHER, CELL_TYPES.PENGUIN, CELL_TYPES.FLAMINGO, CELL_TYPES.OWL, CELL_TYPES.PARROT,
      CELL_TYPES.SWAN, CELL_TYPES.LOBSTER, CELL_TYPES.LIZARD, CELL_TYPES.SQUIRREL, CELL_TYPES.RABBIT,
      CELL_TYPES.HEDGEHOG, CELL_TYPES.MOUSE, CELL_TYPES.SKUNK, CELL_TYPES.CAT, CELL_TYPES.MONKEY, CELL_TYPES.POODLE
    ];

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cellType = grid[row][col];
        if (cellType === CELL_TYPES.SNAKE_START) {
          snakeStart = { x: col, y: row };
        } else if (animalTypes.includes(cellType)) {
          animal = { x: col, y: row };
        } else if (cellType === CELL_TYPES.TARGET) {
          target = { x: col, y: row };
        }
      }
    }

    if (!snakeStart) return 'Snake start position is required';
    if (!animal) return 'One animal is required (turtle or any emoji creature)';
    if (!target) return 'Target position is required';

    // Check if animal is reachable from snake start
    if (!isPathAvailable(snakeStart, animal)) {
      return 'Animal must be reachable from snake start position';
    }

    return '';
  }, [grid, gridSize]);

  const isPathAvailable = useCallback((start, end) => {
    // BFS pathfinding to check if end is reachable from start
    const queue = [start];
    const visited = new Set();
    visited.add(`${start.x},${start.y}`);

    const directions = [
      { x: 0, y: -1 }, // up
      { x: 1, y: 0 },  // right
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }  // left
    ];

    while (queue.length > 0) {
      const current = queue.shift();

      if (current.x === end.x && current.y === end.y) {
        return true;
      }

      for (const dir of directions) {
        const next = { x: current.x + dir.x, y: current.y + dir.y };
        const key = `${next.x},${next.y}`;

        if (
          next.x >= 0 && next.x < gridSize &&
          next.y >= 0 && next.y < gridSize &&
          !visited.has(key) &&
          grid[next.y][next.x] !== CELL_TYPES.WALL
        ) {
          visited.add(key);
          queue.push(next);
        }
      }
    }

    return false;
  }, [grid, gridSize]);

  const handleSave = useCallback(async () => {
    if (!isAuthenticated) {
      setValidationError('You must be logged in to save missions');
      return;
    }

    const error = validateMission();
    if (error) {
      setValidationError(error);
      return;
    }

    if (!missionName.trim()) {
      setValidationError('Mission name is required');
      return;
    }

    try {
      // Extract animal type from grid
      const animalType = customMissionService.extractAnimalType(grid);

      const missionData = {
        name: missionName.trim(),
        grid_size: gridSize,
        grid_data: grid,
        animal_type: animalType
      };

      const { data, error: apiError } = await customMissionService.createMission(missionData);
      
      if (apiError) {
        setValidationError(apiError);
        return;
      }

      // Add the new mission to the local state
      const newMission = {
        name: data.mission.name,
        gridSize: data.mission.grid_size,
        grid: data.mission.grid_data,
        created: data.mission.created_at,
        id: data.mission.id,
        animalType: data.mission.animal_type
      };

      setSavedMissions(prev => [...prev, newMission]);
      setShowSaveDialog(false);
      setValidationError('');
      alert('Mission saved successfully!');

    } catch (error) {
      console.error('Error saving mission:', error);
      setValidationError('Failed to save mission. Please try again.');
    }
  }, [missionName, gridSize, grid, validateMission, isAuthenticated]);

  const handleLoad = useCallback((mission) => {
    setGridSize(mission.gridSize);
    setGrid(mission.grid);
    setMissionName(mission.name);
    setShowLoadDialog(false);
    setValidationError('');
  }, []);


  const getCellStyle = useCallback((cellType) => {
    // Responsive cell size based on grid size to fit entire maze without scrolling
    let cellSize = 25;
    let fontSize = '16px';
    
    if (gridSize > 30) {
      cellSize = 16;  // Much smaller cells for 35x35 grid (35*16 = 560px)
      fontSize = '10px';
    } else if (gridSize > 25) {
      cellSize = 19;  // Smaller for 30x30 grid (30*19 = 570px)
      fontSize = '12px';
    } else if (gridSize > 20) {
      cellSize = 22;  // Slightly smaller for 25x25 grid (25*22 = 550px)
      fontSize = '14px';
    }
    
    const baseStyle = {
      width: cellSize,
      height: cellSize,
      border: '1px solid #333',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: fontSize,
      transition: 'all 0.2s'
    };

    switch (cellType) {
      case CELL_TYPES.WALL:
        return { ...baseStyle, backgroundColor: '#333', color: '#fff' };
      case CELL_TYPES.SNAKE_START:
        return { ...baseStyle, backgroundColor: '#4CAF50', color: '#fff' };
      case CELL_TYPES.TURTLE:
        return { ...baseStyle, backgroundColor: '#FF9800', color: '#fff' };
      case CELL_TYPES.TARGET:
        return { ...baseStyle, backgroundColor: '#F44336', color: '#fff' };
      case CELL_TYPES.LADYBUG:
        return { ...baseStyle, backgroundColor: '#e53e3e', color: '#fff' };
      case CELL_TYPES.SPIDER:
        return { ...baseStyle, backgroundColor: '#2d3748', color: '#fff' };
      case CELL_TYPES.BUTTERFLY:
        return { ...baseStyle, backgroundColor: '#9f7aea', color: '#fff' };
      case CELL_TYPES.BEE:
        return { ...baseStyle, backgroundColor: '#f6e05e', color: '#000' };
      case CELL_TYPES.FEATHER:
        return { ...baseStyle, backgroundColor: '#a0aec0', color: '#000' };
      case CELL_TYPES.PENGUIN:
        return { ...baseStyle, backgroundColor: '#1a202c', color: '#fff' };
      case CELL_TYPES.FLAMINGO:
        return { ...baseStyle, backgroundColor: '#ed64a6', color: '#fff' };
      case CELL_TYPES.OWL:
        return { ...baseStyle, backgroundColor: '#8b4513', color: '#fff' };
      case CELL_TYPES.PARROT:
        return { ...baseStyle, backgroundColor: '#38a169', color: '#fff' };
      case CELL_TYPES.SWAN:
        return { ...baseStyle, backgroundColor: '#f7fafc', color: '#000' };
      case CELL_TYPES.LOBSTER:
        return { ...baseStyle, backgroundColor: '#e53e3e', color: '#fff' };
      case CELL_TYPES.LIZARD:
        return { ...baseStyle, backgroundColor: '#38a169', color: '#fff' };
      case CELL_TYPES.SQUIRREL:
        return { ...baseStyle, backgroundColor: '#a0522d', color: '#fff' };
      case CELL_TYPES.RABBIT:
        return { ...baseStyle, backgroundColor: '#e2e8f0', color: '#000' };
      case CELL_TYPES.HEDGEHOG:
        return { ...baseStyle, backgroundColor: '#4a5568', color: '#fff' };
      case CELL_TYPES.MOUSE:
        return { ...baseStyle, backgroundColor: '#718096', color: '#fff' };
      case CELL_TYPES.SKUNK:
        return { ...baseStyle, backgroundColor: '#1a202c', color: '#fff' };
      case CELL_TYPES.CAT:
        return { ...baseStyle, backgroundColor: '#fd7f28', color: '#fff' };
      case CELL_TYPES.MONKEY:
        return { ...baseStyle, backgroundColor: '#8b4513', color: '#fff' };
      case CELL_TYPES.POODLE:
        return { ...baseStyle, backgroundColor: '#f7fafc', color: '#000' };
      default:
        return { ...baseStyle, backgroundColor: '#f0f0f0', '&:hover': { backgroundColor: '#e0e0e0' } };
    }
  }, [gridSize]);

  const getCellContent = useCallback((cellType) => {
    switch (cellType) {
      case CELL_TYPES.WALL: return '█';
      case CELL_TYPES.SNAKE_START: return '🐍';
      case CELL_TYPES.TURTLE: return '🐢';
      case CELL_TYPES.TARGET: return '🎯';
      case CELL_TYPES.LADYBUG: return '🐞';
      case CELL_TYPES.SPIDER: return '🕷️';
      case CELL_TYPES.BUTTERFLY: return '🦋';
      case CELL_TYPES.BEE: return '🐝';
      case CELL_TYPES.FEATHER: return '🪶';
      case CELL_TYPES.PENGUIN: return '🐧';
      case CELL_TYPES.FLAMINGO: return '🦩';
      case CELL_TYPES.OWL: return '🦉';
      case CELL_TYPES.PARROT: return '🦜';
      case CELL_TYPES.SWAN: return '🦢';
      case CELL_TYPES.LOBSTER: return '🦞';
      case CELL_TYPES.LIZARD: return '🦎';
      case CELL_TYPES.SQUIRREL: return '🐿️';
      case CELL_TYPES.RABBIT: return '🐇';
      case CELL_TYPES.HEDGEHOG: return '🦔';
      case CELL_TYPES.MOUSE: return '🐁';
      case CELL_TYPES.SKUNK: return '🦨';
      case CELL_TYPES.CAT: return '🐈';
      case CELL_TYPES.MONKEY: return '🐒';
      case CELL_TYPES.POODLE: return '🐩';
      default: return '';
    }
  }, []);

  const getToolStyle = useCallback((tool) => ({
    minWidth: 120,
    backgroundColor: selectedTool === tool ? '#1976d2' : 'transparent',
    color: selectedTool === tool ? '#fff' : '#1976d2',
    border: '2px solid #1976d2',
    '&:hover': {
      backgroundColor: selectedTool === tool ? '#1565c0' : 'rgba(25, 118, 210, 0.1)'
    }
  }), [selectedTool]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/games/snake/51480fa6-7efc-4cd0-b473-23751097b146')}
            startIcon={<ArrowBack />}
          >
            Back to Snake Game
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            🔧 Mission Builder
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Controls Panel */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Grid Settings
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Grid Size</InputLabel>
                  <Select
                    value={gridSize}
                    label="Grid Size"
                    onChange={(e) => setGridSize(e.target.value)}
                  >
                    <MenuItem value={15}>Small (15x15)</MenuItem>
                    <MenuItem value={20}>Medium (20x20)</MenuItem>
                    <MenuItem value={25}>Large (25x25)</MenuItem>
                    <MenuItem value={30}>Extra Large (30x30)</MenuItem>
                    <MenuItem value={35}>Maximum (35x35)</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={initializeGrid}
                  startIcon={<Clear />}
                >
                  Clear Grid
                </Button>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tools
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedTool(TOOLS.WALL)}
                    sx={getToolStyle(TOOLS.WALL)}
                  >
                    █ Wall
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedTool(TOOLS.SNAKE_START)}
                    sx={getToolStyle(TOOLS.SNAKE_START)}
                  >
                    🐍 Snake Start
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedTool(TOOLS.TURTLE)}
                    sx={getToolStyle(TOOLS.TURTLE)}
                  >
                    🐢 Turtle
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedTool(TOOLS.TARGET)}
                    sx={getToolStyle(TOOLS.TARGET)}
                  >
                    🎯 Target
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedTool(TOOLS.ERASER)}
                    sx={getToolStyle(TOOLS.ERASER)}
                  >
                    🗑️ Eraser
                  </Button>
                  
                  {/* Insects & Small Creatures */}
                  <Typography variant="body2" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
                    🪲 Insects & Small Creatures
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.LADYBUG)} sx={getToolStyle(TOOLS.LADYBUG)}>
                      🐞 Ladybug
                    </Button>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.SPIDER)} sx={getToolStyle(TOOLS.SPIDER)}>
                      🕷️ Spider
                    </Button>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.BUTTERFLY)} sx={getToolStyle(TOOLS.BUTTERFLY)}>
                      🦋 Butterfly
                    </Button>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.BEE)} sx={getToolStyle(TOOLS.BEE)}>
                      🐝 Bee
                    </Button>
                  </Box>

                  {/* Birds */}
                  <Typography variant="body2" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
                    🪶 Birds & Flying
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.FEATHER)} sx={getToolStyle(TOOLS.FEATHER)}>
                      🪶 Feather
                    </Button>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.PENGUIN)} sx={getToolStyle(TOOLS.PENGUIN)}>
                      🐧 Penguin
                    </Button>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.FLAMINGO)} sx={getToolStyle(TOOLS.FLAMINGO)}>
                      🦩 Flamingo
                    </Button>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.OWL)} sx={getToolStyle(TOOLS.OWL)}>
                      🦉 Owl
                    </Button>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.PARROT)} sx={getToolStyle(TOOLS.PARROT)}>
                      🦜 Parrot
                    </Button>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.SWAN)} sx={getToolStyle(TOOLS.SWAN)}>
                      🦢 Swan
                    </Button>
                  </Box>

                  {/* Small Animals */}
                  <Typography variant="body2" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
                    🐾 Small Animals
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.SQUIRREL)} sx={getToolStyle(TOOLS.SQUIRREL)}>
                      🐿️ Squirrel
                    </Button>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.RABBIT)} sx={getToolStyle(TOOLS.RABBIT)}>
                      🐇 Rabbit
                    </Button>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.HEDGEHOG)} sx={getToolStyle(TOOLS.HEDGEHOG)}>
                      🦔 Hedgehog
                    </Button>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.MOUSE)} sx={getToolStyle(TOOLS.MOUSE)}>
                      🐁 Mouse
                    </Button>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.SKUNK)} sx={getToolStyle(TOOLS.SKUNK)}>
                      🦨 Skunk
                    </Button>
                  </Box>

                  {/* Other Creatures */}
                  <Typography variant="body2" sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
                    🦎 Other Creatures
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.LOBSTER)} sx={getToolStyle(TOOLS.LOBSTER)}>
                      🦞 Lobster
                    </Button>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.LIZARD)} sx={getToolStyle(TOOLS.LIZARD)}>
                      🦎 Lizard
                    </Button>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.CAT)} sx={getToolStyle(TOOLS.CAT)}>
                      🐈 Cat
                    </Button>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.MONKEY)} sx={getToolStyle(TOOLS.MONKEY)}>
                      🐒 Monkey
                    </Button>
                    <Button variant="outlined" onClick={() => setSelectedTool(TOOLS.POODLE)} sx={getToolStyle(TOOLS.POODLE)}>
                      🐩 Poodle
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setShowSaveDialog(true)}
                    startIcon={<Save />}
                  >
                    Save Mission
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setShowLoadDialog(true)}
                    startIcon={<FolderOpen />}
                  >
                    Load Mission
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Grid Editor */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom>
                Mission Grid
              </Typography>
              {validationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {validationError}
                </Alert>
              )}
              <Box sx={{ 
                display: 'inline-block',
                border: '2px solid #333',
                backgroundColor: '#fff'
              }}>
                {grid.map((row, rowIndex) => (
                  <Box key={rowIndex} sx={{ display: 'flex' }}>
                    {row.map((cell, colIndex) => (
                      <Box
                        key={`${rowIndex}-${colIndex}`}
                        sx={getCellStyle(cell)}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                      >
                        {getCellContent(cell)}
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                Click on grid cells to place the selected tool. Snake start, turtle, and target can only have one instance each.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
        <DialogTitle>Save Mission</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Mission Name"
            fullWidth
            variant="outlined"
            value={missionName}
            onChange={(e) => setMissionName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onClose={() => setShowLoadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Load Mission</DialogTitle>
        <DialogContent>
          {savedMissions.length === 0 ? (
            <Typography>No saved missions found.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {savedMissions.map((mission, index) => (
                <Card key={index} sx={{ cursor: 'pointer' }} onClick={() => handleLoad(mission)}>
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6">{mission.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {mission.gridSize}x{mission.gridSize} • Created: {new Date(mission.created).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        color="error"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!mission.id) {
                            // Fallback for missions without ID
                            const updated = savedMissions.filter((_, i) => i !== index);
                            setSavedMissions(updated);
                            return;
                          }
                          
                          try {
                            const { error } = await customMissionService.deleteMission(mission.id);
                            if (error) {
                              alert('Failed to delete mission: ' + error);
                              return;
                            }
                            
                            // Remove from local state
                            const updated = savedMissions.filter((_, i) => i !== index);
                            setSavedMissions(updated);
                          } catch (error) {
                            console.error('Error deleting mission:', error);
                            alert('Failed to delete mission');
                          }
                        }}
                      >
                        <Delete />
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLoadDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MissionBuilder;