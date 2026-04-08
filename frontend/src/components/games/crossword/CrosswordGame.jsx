import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Lightbulb as HintIcon,
  EmojiEvents as TrophyIcon,
  List as ClueListIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import CrosswordGenerator from './CrosswordGenerator';

const CrosswordGame = ({ difficulty = 'medium', onGameComplete }) => {
  const [puzzle, setPuzzle] = useState(null);
  const [userGrid, setUserGrid] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [direction, setDirection] = useState('across');
  const [isComplete, setIsComplete] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showCluesDialog, setShowCluesDialog] = useState(false);
  const [hints, setHints] = useState(3);
  const timerRef = useRef();
  const generator = useRef(new CrosswordGenerator());

  const difficultySettings = {
    easy: { baseScore: 800, hintCount: 5 },
    medium: { baseScore: 1500, hintCount: 3 },
    hard: { baseScore: 2500, hintCount: 1 }
  };

  useEffect(() => {
    generateNewPuzzle();
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

  // Keyboard input handler
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!selectedCell || !gameStarted || isComplete) return;

      const key = event.key.toUpperCase();
      
      if (key >= 'A' && key <= 'Z') {
        event.preventDefault();
        handleLetterInput(key);
      } else if (key === 'BACKSPACE' || key === 'DELETE') {
        event.preventDefault();
        handleLetterInput('');
      } else if (key === 'ARROWUP' || key === 'ARROWDOWN' || key === 'ARROWLEFT' || key === 'ARROWRIGHT') {
        event.preventDefault();
        handleArrowKey(key);
      } else if (key === 'TAB') {
        event.preventDefault();
        switchDirection();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [selectedCell, gameStarted, isComplete, direction]);

  const generateNewPuzzle = () => {
    const newPuzzle = generator.current.generatePuzzle(difficulty);
    setPuzzle(newPuzzle);
    setUserGrid(Array(newPuzzle.size).fill().map(() => Array(newPuzzle.size).fill('')));
    setSelectedCell(null);
    setSelectedWord(null);
    setDirection('across');
    setIsComplete(false);
    setTimeElapsed(0);
    setGameStarted(false);
    setScore(0);
    setHints(difficultySettings[difficulty].hintCount);
  };

  const handleCellClick = (row, col) => {
    if (!puzzle.grid[row][col]) return;

    setSelectedCell({ row, col });
    if (!gameStarted) setGameStarted(true);

    // Find word that contains this cell
    const wordsAtCell = puzzle.words.filter(word => 
      word.cells.some(cell => cell.row === row && cell.col === col)
    );

    if (wordsAtCell.length > 0) {
      // If multiple words, prioritize current direction
      let selectedWordObj = wordsAtCell.find(word => word.direction === direction);
      if (!selectedWordObj) {
        selectedWordObj = wordsAtCell[0];
        setDirection(selectedWordObj.direction);
      }
      setSelectedWord(selectedWordObj);
    }
  };

  const handleLetterInput = (letter) => {
    if (!selectedCell || !selectedWord) return;

    const { row, col } = selectedCell;
    const newUserGrid = userGrid.map(r => [...r]);
    newUserGrid[row][col] = letter;
    setUserGrid(newUserGrid);

    // Move to next cell in word
    if (letter && selectedWord) {
      moveToNextCell();
    }

    checkCompletion(newUserGrid);
  };

  const moveToNextCell = () => {
    if (!selectedWord || !selectedCell) return;

    const currentIndex = selectedWord.cells.findIndex(
      cell => cell.row === selectedCell.row && cell.col === selectedCell.col
    );

    if (currentIndex >= 0 && currentIndex < selectedWord.cells.length - 1) {
      const nextCell = selectedWord.cells[currentIndex + 1];
      setSelectedCell({ row: nextCell.row, col: nextCell.col });
    }
  };

  const handleArrowKey = (key) => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    let newRow = row, newCol = col;

    switch (key) {
      case 'ARROWUP': newRow = Math.max(0, row - 1); break;
      case 'ARROWDOWN': newRow = Math.min(puzzle.size - 1, row + 1); break;
      case 'ARROWLEFT': newCol = Math.max(0, col - 1); break;
      case 'ARROWRIGHT': newCol = Math.min(puzzle.size - 1, col + 1); break;
    }

    if (puzzle.grid[newRow][newCol]) {
      handleCellClick(newRow, newCol);
    }
  };

  const switchDirection = () => {
    if (!selectedCell) return;
    
    const newDirection = direction === 'across' ? 'down' : 'across';
    setDirection(newDirection);
    
    // Find word in new direction at current cell
    const wordsAtCell = puzzle.words.filter(word => 
      word.cells.some(cell => cell.row === selectedCell.row && cell.col === selectedCell.col) &&
      word.direction === newDirection
    );
    
    if (wordsAtCell.length > 0) {
      setSelectedWord(wordsAtCell[0]);
    }
  };

  const checkCompletion = (currentUserGrid) => {
    console.log('Checking completion...');
    let allCorrect = true;
    let filledCells = 0;
    let totalCells = 0;

    // Count all letter cells (non-null cells in the puzzle grid)
    for (let row = 0; row < puzzle.size; row++) {
      for (let col = 0; col < puzzle.size; col++) {
        if (puzzle.grid[row][col] !== null) {
          totalCells++;
          const userLetter = currentUserGrid[row][col];
          const correctLetter = puzzle.grid[row][col];
          
          if (userLetter && userLetter.trim() !== '') {
            filledCells++;
            if (userLetter.toUpperCase() !== correctLetter.toUpperCase()) {
              allCorrect = false;
              console.log(`Mismatch at [${row}][${col}]: user="${userLetter}" correct="${correctLetter}"`);
            }
          } else {
            allCorrect = false;
            console.log(`Empty cell at [${row}][${col}], expected "${correctLetter}"`);
          }
        }
      }
    }

    console.log(`Completion check: ${filledCells}/${totalCells} cells filled, allCorrect: ${allCorrect}`);

    if (allCorrect && filledCells === totalCells) {
      console.log('PUZZLE COMPLETED!');
      setIsComplete(true);
      const timeBonus = Math.max(0, 600 - timeElapsed);
      const hintPenalty = (difficultySettings[difficulty].hintCount - hints) * 100;
      const finalScore = Math.max(0, difficultySettings[difficulty].baseScore + timeBonus - hintPenalty);
      setScore(finalScore);
      
      // Always show completion dialog first
      setShowCompletionDialog(true);

      // Always call the game complete callback with all data
      if (onGameComplete) {
        console.log('Calling onGameComplete callback...');
        onGameComplete({
          score: finalScore,
          time: timeElapsed,
          difficulty,
          hintsUsed: difficultySettings[difficulty].hintCount - hints,
          totalCells: totalCells,
          correctCells: filledCells
        });
      }
    }
  };

  const useHint = () => {
    if (hints <= 0 || !selectedCell || !puzzle.grid[selectedCell.row][selectedCell.col]) return;

    const correctLetter = puzzle.grid[selectedCell.row][selectedCell.col];
    const newUserGrid = userGrid.map(r => [...r]);
    newUserGrid[selectedCell.row][selectedCell.col] = correctLetter;
    setUserGrid(newUserGrid);
    setHints(hints - 1);

    checkCompletion(newUserGrid);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCellStyle = (row, col) => {
    const isBlackCell = !puzzle.grid[row][col];
    const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;
    const isInSelectedWord = selectedWord && selectedWord.cells.some(cell => cell.row === row && cell.col === col);
    const hasNumber = puzzle.words.some(word => word.row === row && word.col === col);
    const number = puzzle.words.find(word => word.row === row && word.col === col)?.number;

    return {
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      cursor: isBlackCell ? 'default' : 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      color: isBlackCell ? 'transparent' : '#000000',
      backgroundColor: isBlackCell ? '#000000' :
                      isSelected ? 'rgba(0, 245, 255, 0.6)' :
                      isInSelectedWord ? 'rgba(0, 245, 255, 0.3)' :
                      '#ffffff',
      border: isBlackCell ? '2px solid rgba(0, 245, 255, 0.6)' : '2px solid rgba(0, 245, 255, 0.5)',
      borderRadius: isBlackCell ? '2px' : '4px',
      transition: 'all 0.2s ease',
      backdropFilter: isBlackCell ? 'none' : 'blur(5px)',
      boxShadow: isSelected ? '0 0 15px rgba(0, 245, 255, 0.6)' : 
                 isBlackCell ? 'inset 0 0 10px rgba(0, 0, 0, 0.8)' : 'none',
      '&:hover': !isBlackCell ? {
        backgroundColor: 'rgba(0, 245, 255, 0.3)',
        transform: 'scale(1.05)'
      } : {}
    };
  };

  const acrossClues = puzzle?.words.filter(word => word.direction === 'across') || [];
  const downClues = puzzle?.words.filter(word => word.direction === 'down') || [];

  if (!puzzle) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>Loading...</Box>;
  }

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
          maxWidth: 800,
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
                CROSSWORD
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap' }}>
              <Typography sx={{ color: '#ffffff', fontSize: '16px' }}>
                Time: {formatTime(timeElapsed)}
              </Typography>
              <Typography sx={{ color: '#ffffff', fontSize: '16px' }}>
                Hints: {hints}
              </Typography>
              <Typography sx={{ color: '#ffffff', fontSize: '16px' }}>
                Direction: {direction.toUpperCase()}
              </Typography>
            </Box>

            {/* Current Clue */}
            {selectedWord && (
              <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(0, 245, 255, 0.1)', borderRadius: '8px' }}>
                <Typography sx={{ color: '#00f5ff', fontWeight: 'bold', mb: 1 }}>
                  {selectedWord.number} {selectedWord.direction.toUpperCase()}
                </Typography>
                <Typography sx={{ color: '#ffffff' }}>
                  {selectedWord.clue}
                </Typography>
              </Box>
            )}

            {/* Clues Panel - Always Visible */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: 2, 
              mb: 3,
              maxHeight: '200px',
              overflow: 'auto',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              p: 2,
              border: '1px solid rgba(0, 245, 255, 0.2)'
            }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#00f5ff', mb: 2, fontSize: '16px' }}>
                  ACROSS
                </Typography>
                {acrossClues.map((word, index) => (
                  <Typography 
                    key={index} 
                    sx={{ 
                      color: '#ffffff',
                      fontSize: '12px',
                      mb: 0.5,
                      backgroundColor: selectedWord?.number === word.number && selectedWord?.direction === 'across' 
                        ? 'rgba(0, 245, 255, 0.2)' : 'transparent',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      const firstCell = word.cells[0];
                      handleCellClick(firstCell.row, firstCell.col);
                      setDirection('across');
                    }}
                  >
                    <strong>{word.number}.</strong> {word.clue}
                  </Typography>
                ))}
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: '#00f5ff', mb: 2, fontSize: '16px' }}>
                  DOWN
                </Typography>
                {downClues.map((word, index) => (
                  <Typography 
                    key={index} 
                    sx={{ 
                      color: '#ffffff',
                      fontSize: '12px',
                      mb: 0.5,
                      backgroundColor: selectedWord?.number === word.number && selectedWord?.direction === 'down' 
                        ? 'rgba(0, 245, 255, 0.2)' : 'transparent',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      const firstCell = word.cells[0];
                      handleCellClick(firstCell.row, firstCell.col);
                      setDirection('down');
                    }}
                  >
                    <strong>{word.number}.</strong> {word.clue}
                  </Typography>
                ))}
              </Box>
            </Box>

            {/* Crossword Grid */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${puzzle.size}, 1fr)`,
              gap: '2px',
              backgroundColor: '#000000',
              padding: 3,
              borderRadius: '12px',
              mb: 3,
              border: '3px solid rgba(0, 245, 255, 0.4)',
              justifyContent: 'center',
              margin: '0 auto',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
            }}>
              {puzzle.grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const number = puzzle.words.find(word => word.row === rowIndex && word.col === colIndex)?.number;
                  return (
                    <motion.div
                      key={`${rowIndex}-${colIndex}`}
                      whileHover={{ scale: cell ? 1.05 : 1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Box
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        sx={getCellStyle(rowIndex, colIndex)}
                      >
                        {number && (
                          <Typography sx={{
                            position: 'absolute',
                            top: 1,
                            left: 1,
                            fontSize: '8px',
                            color: '#0066cc',
                            fontWeight: 'bold',
                            zIndex: 10
                          }}>
                            {number}
                          </Typography>
                        )}
                        {userGrid[rowIndex][colIndex]}
                      </Box>
                    </motion.div>
                  );
                })
              )}
            </Box>

            {/* Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={useHint}
                disabled={hints <= 0 || !selectedCell}
                startIcon={<HintIcon />}
                sx={{
                  color: hints <= 0 ? 'rgba(255, 235, 59, 0.3)' : '#ffeb3b',
                  borderColor: hints <= 0 ? 'rgba(255, 235, 59, 0.2)' : 'rgba(255, 235, 59, 0.5)',
                  '&:hover': hints > 0 ? {
                    backgroundColor: 'rgba(255, 235, 59, 0.2)',
                    borderColor: '#ffeb3b'
                  } : {}
                }}
              >
                Hint ({hints})
              </Button>

              <Button
                variant="outlined"
                onClick={() => setShowCluesDialog(true)}
                startIcon={<ClueListIcon />}
                sx={{
                  color: '#00f5ff',
                  borderColor: 'rgba(0, 245, 255, 0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 245, 255, 0.2)',
                    borderColor: '#00f5ff'
                  }
                }}
              >
                Clues
              </Button>

              <Button
                variant="outlined"
                onClick={generateNewPuzzle}
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
                New Puzzle
              </Button>

              <Button
                variant="outlined"
                onClick={() => checkCompletion(userGrid)}
                sx={{
                  color: '#4caf50',
                  borderColor: 'rgba(76, 175, 80, 0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    borderColor: '#4caf50'
                  }
                }}
              >
                Check Progress
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Clues Dialog */}
      <Dialog 
        open={showCluesDialog} 
        onClose={() => setShowCluesDialog(false)}
        maxWidth="md"
        fullWidth
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
          color: '#00f5ff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Crossword Clues
          <IconButton 
            onClick={() => setShowCluesDialog(false)}
            sx={{ color: '#ffffff' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ color: '#00f5ff', mb: 2 }}>
                ACROSS
              </Typography>
              <List dense>
                {acrossClues.map((word, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={`${word.number}. ${word.clue}`}
                      sx={{ 
                        '& .MuiListItemText-primary': { 
                          color: '#ffffff',
                          fontSize: '14px'
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: '#00f5ff', mb: 2 }}>
                DOWN
              </Typography>
              <List dense>
                {downClues.map((word, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={`${word.number}. ${word.clue}`}
                      sx={{ 
                        '& .MuiListItemText-primary': { 
                          color: '#ffffff',
                          fontSize: '14px'
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog 
        open={showCompletionDialog} 
        onClose={() => setShowCompletionDialog(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'rgba(13, 20, 33, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '2px solid #00f5ff',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 245, 255, 0.3)'
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
            Congratulations! You've completed the {difficulty} crossword!
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ color: '#00f5ff', fontSize: '24px', fontWeight: 'bold' }}>
              Final Score: {score}
            </Typography>
            <Typography sx={{ color: '#ffffff', mt: 1 }}>
              Time: {formatTime(timeElapsed)} | Hints Used: {difficultySettings[difficulty].hintCount - hints}
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
          {onGameComplete && (
            <Button 
              onClick={() => {
                setShowCompletionDialog(false);
                // Force trigger the completion callback
                const timeBonus = Math.max(0, 600 - timeElapsed);
                const hintPenalty = (difficultySettings[difficulty].hintCount - hints) * 100;
                const finalScore = Math.max(0, difficultySettings[difficulty].baseScore + timeBonus - hintPenalty);
                
                onGameComplete({
                  score: finalScore,
                  time: timeElapsed,
                  difficulty,
                  hintsUsed: difficultySettings[difficulty].hintCount - hints
                });
              }}
              sx={{ 
                color: '#ffffff',
                backgroundColor: '#4caf50',
                '&:hover': {
                  backgroundColor: '#45a049'
                }
              }}
              variant="contained"
            >
              Submit Score
            </Button>
          )}
          <Button 
            onClick={() => {
              setShowCompletionDialog(false);
              generateNewPuzzle();
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
            New Puzzle
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
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              backgroundColor: '#00f5ff',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.1
            }}
            animate={{
              y: [-10, 10, -10],
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

export default CrosswordGame;