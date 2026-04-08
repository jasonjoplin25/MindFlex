import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../contexts/GameContext';
import GameControls from '../common/GameControls';
import GameResults from '../common/GameResults';
import PatternGrid from './PatternGrid';
import { getRandomInt, delay } from '../../utils/gameUtils';

const PatternMatchGame = () => {
  const { gameState, startGame, updateScore, endGame, resetGame } = useGame();
  const [pattern, setPattern] = useState([]);
  const [userPattern, setUserPattern] = useState([]);
  const [isShowingPattern, setIsShowingPattern] = useState(false);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timer, setTimer] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [gridSize, setGridSize] = useState(3);
  const [patternSpeed, setPatternSpeed] = useState(1000);

  // Generate a new pattern based on level and difficulty
  const generatePattern = useCallback(() => {
    const patternLength = level + (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3);
    const newPattern = [];
    
    for (let i = 0; i < patternLength; i++) {
      const cell = getRandomInt(0, gridSize * gridSize - 1);
      newPattern.push(cell);
    }
    
    return newPattern;
  }, [level, difficulty, gridSize]);

  // Initialize game based on difficulty
  const initializeGame = useCallback(() => {
    // Set grid size based on difficulty
    const newGridSize = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
    setGridSize(newGridSize);
    
    // Set pattern display speed based on difficulty
    const speed = difficulty === 'easy' ? 1000 : difficulty === 'medium' ? 800 : 600;
    setPatternSpeed(speed);
    
    // Set time limit based on difficulty
    setTimeLeft(difficulty === 'easy' ? 60 : difficulty === 'medium' ? 90 : 120);
    
    // Reset game state
    setLevel(1);
    setPattern([]);
    setUserPattern([]);
    setIsShowingPattern(false);
    setIsUserTurn(false);
    setGameOver(false);
  }, [difficulty]);

  // Start the game
  const handleStartGame = () => {
    initializeGame();
    startGame();
    setGameStarted(true);
    
    // Start the timer
    const interval = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(interval);
          handleGameOver();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    setTimer(interval);
    
    // Start first round
    startRound();
  };

  // Start a new round
  const startRound = async () => {
    setIsUserTurn(false);
    setUserPattern([]);
    
    // Generate new pattern
    const newPattern = generatePattern();
    setPattern(newPattern);
    
    // Show pattern to user
    setIsShowingPattern(true);
    
    // Display pattern sequence
    for (let i = 0; i < newPattern.length; i++) {
      await delay(patternSpeed);
    }
    
    // Hide pattern and let user input
    setIsShowingPattern(false);
    setIsUserTurn(true);
  };

  // Handle user cell click
  const handleCellClick = (cellIndex) => {
    if (!isUserTurn || gameOver) return;
    
    const newUserPattern = [...userPattern, cellIndex];
    setUserPattern(newUserPattern);
    
    // Check if user pattern matches so far
    const currentIndex = newUserPattern.length - 1;
    if (pattern[currentIndex] !== cellIndex) {
      // Pattern mismatch - game over
      handleGameOver();
      return;
    }
    
    // Check if user completed the pattern
    if (newUserPattern.length === pattern.length) {
      // Pattern complete - award points and go to next level
      const pointsEarned = level * (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20);
      updateScore(pointsEarned);
      
      // Increase level
      setLevel(prevLevel => prevLevel + 1);
      
      // Start next round after a short delay
      setTimeout(() => {
        startRound();
      }, 1000);
    }
  };

  // Handle game over
  const handleGameOver = async () => {
    if (timer) clearInterval(timer);
    setGameOver(true);
    setIsUserTurn(false);
    
    // Calculate final score based on level reached and time left
    const difficultyMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2;
    const finalScore = Math.round(((level - 1) * 10 * difficultyMultiplier) + timeLeft);
    
    // Log the score
    await endGame(finalScore);
  };

  // Reset the game
  const handleResetGame = () => {
    if (timer) clearInterval(timer);
    resetGame();
    setGameStarted(false);
    setGameOver(false);
  };

  // Change difficulty
  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">Pattern Match</h1>
      
      {!gameStarted ? (
        <div className="flex flex-col items-center space-y-4 mb-6">
          <div className="flex flex-col items-center mb-4">
            <h2 className="text-xl font-semibold mb-2">Select Difficulty</h2>
            <div className="flex space-x-4">
              <button 
                className={`px-4 py-2 rounded ${difficulty === 'easy' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                onClick={() => handleDifficultyChange('easy')}
              >
                Easy
              </button>
              <button 
                className={`px-4 py-2 rounded ${difficulty === 'medium' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
                onClick={() => handleDifficultyChange('medium')}
              >
                Medium
              </button>
              <button 
                className={`px-4 py-2 rounded ${difficulty === 'hard' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                onClick={() => handleDifficultyChange('hard')}
              >
                Hard
              </button>
            </div>
          </div>
          
          <div className="text-center mb-4">
            <p className="text-gray-700">
              Watch the pattern and repeat it by clicking the cells in the same order.
              Each level adds more steps to remember!
            </p>
          </div>
          
          <button 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            onClick={handleStartGame}
          >
            Start Game
          </button>
        </div>
      ) : (
        <>
          <GameControls 
            score={gameState.score}
            timeLeft={timeLeft}
            moves={level - 1}
            onReset={handleResetGame}
          />
          
          {gameOver ? (
            <GameResults 
              score={gameState.score}
              moves={level - 1}
              timeLeft={timeLeft}
              onPlayAgain={handleResetGame}
            />
          ) : (
            <div className="w-full max-w-md flex flex-col items-center">
              <div className="mb-4 text-center">
                <h2 className="text-xl font-semibold mb-2">Level {level}</h2>
                <p className="text-gray-600">
                  {isShowingPattern 
                    ? "Watch the pattern..." 
                    : isUserTurn 
                      ? "Your turn! Repeat the pattern." 
                      : "Get ready..."}
                </p>
              </div>
              
              <PatternGrid 
                size={gridSize}
                pattern={isShowingPattern ? pattern : []}
                userPattern={userPattern}
                currentIndex={userPattern.length}
                onCellClick={handleCellClick}
                isUserTurn={isUserTurn}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatternMatchGame;