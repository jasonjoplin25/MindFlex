import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Card, 
  CardContent, 
  Grid,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  Lightbulb as HintIcon,
  Check as CheckIcon,
  EmojiEvents as TrophyIcon 
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const SudokuGame = ({ difficulty = 'medium', onGameComplete }) => {
  const [board, setBoard] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [initialBoard, setInitialBoard] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [solution, setSolution] = useState(Array(9).fill().map(() => Array(9).fill(0)));
  const [selectedCell, setSelectedCell] = useState(null);
  const [errors, setErrors] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [hints, setHints] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const timerRef = useRef();

  const difficultySettings = {
    easy: { filled: 45, hintCount: 5, baseScore: 1000 },
    medium: { filled: 35, hintCount: 3, baseScore: 2000 },
    hard: { filled: 25, hintCount: 1, baseScore: 3000 }
  };

  useEffect(() => {
    generatePuzzle();
  }, [difficulty]);

  useEffect(() => {
    if (gameStarted && !isComplete) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [gameStarted, isComplete]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!selectedCell || !gameStarted || isComplete) return;

      const key = event.key;
      
      // Handle number keys 1-9
      if (key >= '1' && key <= '9') {
        event.preventDefault();
        const number = parseInt(key);
        handleNumberInput(number);
      }
      // Handle delete/backspace to clear cell
      else if (key === 'Delete' || key === 'Backspace') {
        event.preventDefault();
        handleNumberInput(0);
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [selectedCell, gameStarted, isComplete]);

  const generatePuzzle = () => {
    const solutionGrid = generateSudokuSolution();
    const puzzle = createPuzzle(solutionGrid, difficultySettings[difficulty].filled);
    setBoard([...puzzle]);
    setInitialBoard([...puzzle]);
    setSolution([...solutionGrid]);
    setSelectedCell(null);
    setErrors([]);
    setIsComplete(false);
    setTimeElapsed(0);
    setHints(difficultySettings[difficulty].hintCount);
    setGameStarted(false);
    setScore(0);
  };

  const generateSudokuSolution = () => {
    const grid = Array(9).fill().map(() => Array(9).fill(0));
    
    // Fill the grid using backtracking with proper constraint checking
    const isValidPlacement = (grid, row, col, num) => {
      // Check row
      for (let x = 0; x < 9; x++) {
        if (grid[row][x] === num) return false;
      }
      
      // Check column
      for (let x = 0; x < 9; x++) {
        if (grid[x][col] === num) return false;
      }
      
      // Check 3x3 box
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let i = boxRow; i < boxRow + 3; i++) {
        for (let j = boxCol; j < boxCol + 3; j++) {
          if (grid[i][j] === num) return false;
        }
      }
      return true;
    };

    const fillGrid = (grid) => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0) {
            // Try numbers 1-9 in random order
            const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
            for (let num of numbers) {
              if (isValidPlacement(grid, row, col, num)) {
                grid[row][col] = num;
                if (fillGrid(grid)) {
                  return true;
                }
                grid[row][col] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    };

    fillGrid(grid);
    return grid;
  };

  const createPuzzle = (solution, cellsToFill) => {
    const puzzle = solution.map(row => [...row]);
    const cellsToRemove = 81 - cellsToFill;
    let removed = 0;
    
    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      if (puzzle[row][col] !== 0) {
        puzzle[row][col] = 0;
        removed++;
      }
    }
    
    return puzzle;
  };

  const handleCellClick = (row, col) => {
    if (initialBoard[row][col] !== 0) return;
    setSelectedCell({ row, col });
    if (!gameStarted) setGameStarted(true);
  };

  const handleNumberInput = (number) => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    const newBoard = [...board];
    newBoard[row][col] = number;
    
    setBoard(newBoard);
    
    const newErrors = [...errors];
    const errorIndex = newErrors.findIndex(e => e.row === row && e.col === col);
    
    if (isValidMove(newBoard, row, col, number)) {
      if (errorIndex !== -1) {
        newErrors.splice(errorIndex, 1);
        setErrors(newErrors);
      }
    } else {
      if (errorIndex === -1) {
        newErrors.push({ row, col });
        setErrors(newErrors);
      }
    }

    checkCompletion(newBoard);
  };

  const isValidMove = (board, row, col, num) => {
    if (num === 0) return true;
    
    // Check row (excluding the current cell)
    for (let x = 0; x < 9; x++) {
      if (x !== col && board[row][x] === num) {
        return false;
      }
    }
    
    // Check column (excluding the current cell)
    for (let x = 0; x < 9; x++) {
      if (x !== row && board[x][col] === num) {
        return false;
      }
    }
    
    // Check 3x3 box (excluding the current cell) - use same logic as generation
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = boxRow; i < boxRow + 3; i++) {
      for (let j = boxCol; j < boxCol + 3; j++) {
        if (!(i === row && j === col) && board[i][j] === num) {
          return false;
        }
      }
    }
    return true;
  };

  const checkCompletion = (currentBoard) => {
    const isCompleted = currentBoard.every((row, rowIndex) => 
      row.every((cell, colIndex) => 
        cell !== 0 && isValidMove(currentBoard, rowIndex, colIndex, cell)
      )
    );
    
    if (isCompleted) {
      setIsComplete(true);
      const timeBonus = Math.max(0, 1000 - timeElapsed);
      const errorPenalty = errors.length * 50;
      const hintPenalty = (difficultySettings[difficulty].hintCount - hints) * 100;
      const finalScore = Math.max(0, difficultySettings[difficulty].baseScore + timeBonus - errorPenalty - hintPenalty);
      setScore(finalScore);
      setShowCompletionDialog(true);
      
      if (onGameComplete) {
        onGameComplete({
          score: finalScore,
          time: timeElapsed,
          difficulty,
          errors: errors.length,
          hintsUsed: difficultySettings[difficulty].hintCount - hints
        });
      }
    }
  };

  const useHint = () => {
    console.log('Hint button clicked!');
    console.log('Hints remaining:', hints);
    console.log('Selected cell:', selectedCell);
    
    if (hints <= 0) {
      console.log('No hints remaining');
      return;
    }
    
    if (!selectedCell) {
      console.log('No cell selected');
      return;
    }
    
    const { row, col } = selectedCell;
    
    if (initialBoard[row][col] !== 0) {
      console.log('Cell is pre-filled, cannot use hint');
      return;
    }
    
    // Get the correct number from the stored solution
    const correctNumber = solution[row][col];
    console.log('Solution for cell [' + row + ',' + col + ']:', correctNumber);
    
    if (correctNumber && correctNumber >= 1 && correctNumber <= 9) {
      const newBoard = board.map(row => [...row]);
      newBoard[row][col] = correctNumber;
      setBoard(newBoard);
      setHints(hints - 1);
      setSelectedCell(null);
      
      // Remove any errors for this cell
      const newErrors = errors.filter(e => !(e.row === row && e.col === col));
      setErrors(newErrors);
      
      console.log('Hint applied successfully');
      
      // Check if game is complete
      checkCompletion(newBoard);
    } else {
      console.log('Invalid solution number:', correctNumber);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCellStyle = (row, col) => {
    const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;
    const isError = errors.some(e => e.row === row && e.col === col);
    const isInitial = initialBoard[row][col] !== 0;
    const isInSelectedRegion = selectedCell && (
      selectedCell.row === row || 
      selectedCell.col === col ||
      (Math.floor(selectedCell.row / 3) === Math.floor(row / 3) && 
       Math.floor(selectedCell.col / 3) === Math.floor(col / 3))
    );

    // Calculate thick borders for 3x3 grid separation
    const topBorder = row % 3 === 0 && row !== 0;
    const leftBorder = col % 3 === 0 && col !== 0;
    const rightBorder = col % 3 === 2 && col !== 8;
    const bottomBorder = row % 3 === 2 && row !== 8;

    return {
      width: 40,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isInitial ? 'default' : 'pointer',
      fontSize: '18px',
      fontWeight: isInitial ? 'bold' : 'normal',
      color: isInitial ? '#00f5ff' : isError ? '#ff1744' : '#ffffff',
      backgroundColor: isError ? 'rgba(255, 23, 68, 0.2)' :
                      isSelected ? 'rgba(0, 245, 255, 0.3)' : 
                      isInSelectedRegion ? 'rgba(0, 245, 255, 0.1)' : 
                      'rgba(255, 255, 255, 0.1)',
      borderTop: topBorder ? '2px solid #00f5ff' : '1px solid rgba(0, 245, 255, 0.3)',
      borderLeft: leftBorder ? '2px solid #00f5ff' : '1px solid rgba(0, 245, 255, 0.3)',
      borderRight: rightBorder ? '2px solid #00f5ff' : '1px solid rgba(0, 245, 255, 0.3)',
      borderBottom: bottomBorder ? '2px solid #00f5ff' : '1px solid rgba(0, 245, 255, 0.3)',
      borderRadius: '2px',
      transition: 'all 0.2s ease',
      backdropFilter: 'blur(10px)',
      boxShadow: isSelected ? '0 0 15px rgba(0, 245, 255, 0.5)' : isError ? '0 0 10px rgba(255, 23, 68, 0.5)' : 'none',
      '&:hover': !isInitial ? {
        backgroundColor: 'rgba(0, 245, 255, 0.2)',
        transform: 'scale(1.05)'
      } : {}
    };
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d1421 0%, #1a2332 50%, #2d3748 100%)',
      padding: 2,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Card sx={{
          maxWidth: 600,
          margin: '0 auto',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 245, 255, 0.3)',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}>
          <CardContent sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #00f5ff, #7c4dff)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent'
              }}>
                SUDOKU
              </Typography>
              <Chip 
                label={difficulty.toUpperCase()} 
                sx={{
                  backgroundColor: 'rgba(0, 245, 255, 0.2)',
                  color: '#00f5ff',
                  fontWeight: 'bold'
                }}
              />
            </Box>

            {/* Game Stats */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography sx={{ color: '#ffffff', fontSize: '18px' }}>
                Time: {formatTime(timeElapsed)}
              </Typography>
              <Typography sx={{ color: '#ffffff', fontSize: '18px' }}>
                Hints: {hints}
              </Typography>
              <Typography sx={{ color: '#ffffff', fontSize: '18px' }}>
                Errors: {errors.length}
              </Typography>
            </Box>

            {/* Sudoku Grid */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(9, 1fr)',
              gap: '1px',
              backgroundColor: 'rgba(13, 20, 33, 0.8)',
              padding: 3,
              borderRadius: '12px',
              mb: 3,
              border: '2px solid rgba(0, 245, 255, 0.5)',
              boxShadow: '0 0 20px rgba(0, 245, 255, 0.2)'
            }}>
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <motion.div
                    key={`${rowIndex}-${colIndex}`}
                    whileHover={{ scale: initialBoard[rowIndex][colIndex] === 0 ? 1.05 : 1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Box
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      sx={getCellStyle(rowIndex, colIndex)}
                    >
                      {cell !== 0 && cell}
                    </Box>
                  </motion.div>
                ))
              )}
            </Box>

            {/* Number Input */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                <Button
                  key={num}
                  variant="outlined"
                  onClick={() => handleNumberInput(num)}
                  disabled={!selectedCell}
                  sx={{
                    minWidth: 40,
                    height: 40,
                    color: '#00f5ff',
                    borderColor: 'rgba(0, 245, 255, 0.5)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 245, 255, 0.2)',
                      borderColor: '#00f5ff'
                    },
                    '&:disabled': {
                      color: 'rgba(255, 255, 255, 0.3)',
                      borderColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  {num === 0 ? '✕' : num}
                </Button>
              ))}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={useHint}
                disabled={hints <= 0 || !selectedCell || (selectedCell && initialBoard[selectedCell.row][selectedCell.col] !== 0)}
                startIcon={<HintIcon />}
                sx={{
                  color: hints <= 0 || !selectedCell ? 'rgba(255, 235, 59, 0.3)' : '#ffeb3b',
                  borderColor: hints <= 0 || !selectedCell ? 'rgba(255, 235, 59, 0.2)' : 'rgba(255, 235, 59, 0.5)',
                  '&:hover': !hints <= 0 && selectedCell ? {
                    backgroundColor: 'rgba(255, 235, 59, 0.2)',
                    borderColor: '#ffeb3b'
                  } : {},
                  '&:disabled': {
                    color: 'rgba(255, 235, 59, 0.3)',
                    borderColor: 'rgba(255, 235, 59, 0.2)'
                  }
                }}
              >
                Hint ({hints})
              </Button>
              
              <Button
                variant="outlined"
                onClick={generatePuzzle}
                startIcon={<RefreshIcon />}
                sx={{
                  color: '#ff9100',
                  borderColor: 'rgba(255, 145, 0, 0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 145, 0, 0.2)',
                    borderColor: '#ff9100'
                  }
                }}
              >
                New Game
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Completion Dialog */}
      <Dialog 
        open={showCompletionDialog} 
        onClose={() => setShowCompletionDialog(false)}
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'rgba(13, 20, 33, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 245, 255, 0.3)',
            borderRadius: '20px'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center',
          color: '#00f5ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1
        }}>
          <TrophyIcon /> Puzzle Complete!
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#ffffff', textAlign: 'center', mb: 2 }}>
            Congratulations! You've solved the {difficulty} puzzle!
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ color: '#00f5ff', fontSize: '24px', fontWeight: 'bold' }}>
              Final Score: {score}
            </Typography>
            <Typography sx={{ color: '#ffffff', mt: 1 }}>
              Time: {formatTime(timeElapsed)} | Errors: {errors.length} | Hints Used: {difficultySettings[difficulty].hintCount - hints}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            onClick={() => setShowCompletionDialog(false)}
            sx={{ 
              color: '#00f5ff',
              borderColor: 'rgba(0, 245, 255, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0, 245, 255, 0.2)'
              }
            }}
            variant="outlined"
          >
            Continue
          </Button>
          <Button 
            onClick={() => {
              setShowCompletionDialog(false);
              generatePuzzle();
            }}
            sx={{ 
              color: '#00f5ff',
              backgroundColor: 'rgba(0, 245, 255, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(0, 245, 255, 0.3)'
              }
            }}
            variant="contained"
          >
            New Game
          </Button>
        </DialogActions>
      </Dialog>

      {/* Animated Background Elements */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: -1
      }}>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
              backgroundColor: '#00f5ff',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.1
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: Math.random() * 4 + 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default SudokuGame;