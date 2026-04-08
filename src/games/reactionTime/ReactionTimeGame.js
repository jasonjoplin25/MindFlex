import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from '../../contexts/GameContext';
import GameControls from '../common/GameControls';
import GameResults from '../common/GameResults';
import { getRandomInt, getRandomColor } from '../../utils/gameUtils';

const ReactionTimeGame = () => {
  const { gameState, startGame, updateScore, endGame, resetGame } = useGame();
  const [status, setStatus] = useState('waiting'); // waiting, ready, go, tooEarly, finished
  const [target, setTarget] = useState(null);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timer, setTimer] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [totalRounds, setTotalRounds] = useState(5);
  const [averageTime, setAverageTime] = useState(0);
  
  const startTimeRef = useRef(null);
  const timeoutRef = useRef(null);

  // Initialize game based on difficulty
  const initializeGame = useCallback(() => {
    // Set total rounds based on difficulty
    const rounds = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 10;
    setTotalRounds(rounds);
    
    // Set time limit based on difficulty
    setTimeLeft(difficulty === 'easy' ? 60 : difficulty === 'medium' ? 90 : 120);
    
    // Reset game state
    setStatus('waiting');
    setTarget(null);
    setReactionTimes([]);
    setCurrentRound(0);
    setAverageTime(0);
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
  const startRound = () => {
    setStatus('ready');
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Generate random wait time (1-4 seconds)
    const waitTime = getRandomInt(1000, 4000);
    
    // Set timeout to show target
    timeoutRef.current = setTimeout(() => {
      // Generate random target properties
      const newTarget = {
        color: getRandomColor(),
        size: getRandomInt(80, 150),
        position: {
          top: getRandomInt(10, 70),
          left: getRandomInt(10, 70)
        }
      };
      
      setTarget(newTarget);
      setStatus('go');
      startTimeRef.current = Date.now();
    }, waitTime);
  };

  // Handle user click on target
  const handleTargetClick = () => {
    if (status !== 'go') return;
    
    // Calculate reaction time
    const endTime = Date.now();
    const reactionTime = endTime - startTimeRef.current;
    
    // Add to reaction times list
    const newReactionTimes = [...reactionTimes, reactionTime];
    setReactionTimes(newReactionTimes);
    
    // Calculate average
    const sum = newReactionTimes.reduce((acc, time) => acc + time, 0);
    const newAverage = Math.round(sum / newReactionTimes.length);
    setAverageTime(newAverage);
    
    // Award points based on reaction time and difficulty
    let points = 0;
    if (reactionTime < 300) {
      points = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 30 : 40;
    } else if (reactionTime < 500) {
      points = difficulty === 'easy' ? 15 : difficulty === 'medium' ? 20 : 25;
    } else if (reactionTime < 800) {
      points = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20;
    } else {
      points = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 10;
    }
    
    updateScore(points);
    
    // Update round counter
    const newRound = currentRound + 1;
    setCurrentRound(newRound);
    
    // Check if game is complete
    if (newRound >= totalRounds) {
      handleGameOver();
    } else {
      // Set status to finished for this round
      setStatus('finished');
      
      // Start next round after a short delay
      setTimeout(() => {
        startRound();
      }, 1500);
    }
  };

  // Handle click when not supposed to click
  const handleEarlyClick = () => {
    if (status !== 'ready') return;
    
    // Penalize for clicking too early
    setStatus('tooEarly');
    
    // Clear the timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Start next round after a penalty delay
    setTimeout(() => {
      startRound();
    }, 2000);
  };

  // Handle game over
  const handleGameOver = async () => {
    if (timer) clearInterval(timer);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setGameOver(true);
    setStatus('waiting');
    
    // Calculate final score based on average reaction time and rounds completed
    const difficultyMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2;
    let finalScore = 0;
    
    if (reactionTimes.length > 0) {
      // Better (lower) reaction times give higher scores
      const baseScore = Math.max(0, 1000 - averageTime);
      finalScore = Math.round((baseScore * difficultyMultiplier) + (currentRound * 5) + timeLeft);
    }
    
    // Log the score
    await endGame(finalScore);
  };

  // Reset the game
  const handleResetGame = () => {
    if (timer) clearInterval(timer);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    resetGame();
    setGameStarted(false);
    setGameOver(false);
  };

  // Change difficulty
  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [timer]);

  // Render the game area based on status
  const renderGameArea = () => {
    switch (status) {
      case 'ready':
        return (
          <div 
            className="w-full h-64 bg-yellow-100 rounded-lg flex items-center justify-center cursor-pointer"
            onClick={handleEarlyClick}
          >
            <p className="text-xl font-semibold text-yellow-800">Wait for the target...</p>
          </div>
        );
      
      case 'go':
        return (
          <div 
            className="w-full h-64 bg-green-100 rounded-lg relative overflow-hidden"
          >
            <div
              className="absolute rounded-full cursor-pointer transform hover:scale-105 transition-transform"
              style={{
                backgroundColor: target.color,
                width: `${target.size}px`,
                height: `${target.size}px`,
                top: `${target.position.top}%`,
                left: `${target.position.left}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={handleTargetClick}
            />
          </div>
        );
      
      case 'tooEarly':
        return (
          <div className="w-full h-64 bg-red-100 rounded-lg flex items-center justify-center">
            <p className="text-xl font-semibold text-red-800">Too early! Wait for the target to appear.</p>
          </div>
        );
      
      case 'finished':
        return (
          <div className="w-full h-64 bg-blue-100 rounded-lg flex flex-col items-center justify-center">
            <p className="text-xl font-semibold text-blue-800 mb-2">
              Your reaction time: {reactionTimes[reactionTimes.length - 1]} ms
            </p>
            <p className="text-lg text-blue-600">
              Average: {averageTime} ms
            </p>
            <p className="mt-4 text-gray-600">
              Get ready for the next round...
            </p>
          </div>
        );
      
      default:
        return (
          <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-xl font-semibold text-gray-800">Preparing game...</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">Reaction Time</h1>
      
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
              Test your reaction time! Wait for the target to appear, then click it as quickly as possible.
              Don't click too early!
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
            moves={currentRound}
            onReset={handleResetGame}
          />
          
          {gameOver ? (
            <GameResults 
              score={gameState.score}
              moves={currentRound}
              timeLeft={timeLeft}
              onPlayAgain={handleResetGame}
            />
          ) : (
            <div className="w-full max-w-md">
              <div className="mb-4 flex justify-between items-center">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Round</p>
                  <p className="text-xl font-semibold">{currentRound + 1} / {totalRounds}</p>
                </div>
                
                {reactionTimes.length > 0 && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Last Time</p>
                    <p className="text-xl font-semibold">{reactionTimes[reactionTimes.length - 1]} ms</p>
                  </div>
                )}
                
                {reactionTimes.length > 0 && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Average</p>
                    <p className="text-xl font-semibold">{averageTime} ms</p>
                  </div>
                )}
              </div>
              
              {renderGameArea()}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReactionTimeGame; 