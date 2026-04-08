import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../contexts/GameContext';
import GameControls from '../common/GameControls';
import GameResults from '../common/GameResults';
import { shuffleArray } from '../../utils/gameUtils';

// Word lists by difficulty
const wordLists = {
  easy: [
    'apple', 'banana', 'orange', 'grape', 'melon',
    'chair', 'table', 'house', 'plant', 'water',
    'happy', 'smile', 'laugh', 'dance', 'music'
  ],
  medium: [
    'computer', 'keyboard', 'monitor', 'program', 'network',
    'mountain', 'elephant', 'dinosaur', 'calendar', 'hospital',
    'exercise', 'vacation', 'birthday', 'language', 'sandwich'
  ],
  hard: [
    'algorithm', 'psychology', 'philosophy', 'technology', 'environment',
    'university', 'development', 'experience', 'opportunity', 'celebration',
    'communication', 'understanding', 'relationship', 'imagination', 'appreciation'
  ]
};

// Hints by difficulty
const hintTypes = {
  easy: ['first letter', 'last letter', 'word length', 'category'],
  medium: ['first letter', 'word length', 'category'],
  hard: ['category']
};

// Categories for words
const wordCategories = {
  'apple': 'fruit', 'banana': 'fruit', 'orange': 'fruit', 'grape': 'fruit', 'melon': 'fruit',
  'chair': 'furniture', 'table': 'furniture', 'house': 'building', 'plant': 'nature', 'water': 'liquid',
  'happy': 'emotion', 'smile': 'expression', 'laugh': 'expression', 'dance': 'activity', 'music': 'art',
  
  'computer': 'technology', 'keyboard': 'device', 'monitor': 'device', 'program': 'software', 'network': 'technology',
  'mountain': 'nature', 'elephant': 'animal', 'dinosaur': 'animal', 'calendar': 'tool', 'hospital': 'building',
  'exercise': 'activity', 'vacation': 'activity', 'birthday': 'event', 'language': 'communication', 'sandwich': 'food',
  
  'algorithm': 'computing', 'psychology': 'science', 'philosophy': 'study', 'technology': 'innovation', 'environment': 'nature',
  'university': 'education', 'development': 'process', 'experience': 'concept', 'opportunity': 'concept', 'celebration': 'event',
  'communication': 'interaction', 'understanding': 'concept', 'relationship': 'connection', 'imagination': 'mental', 'appreciation': 'feeling'
};

const WordScrambleGame = () => {
  const { gameState, startGame, updateScore, endGame, resetGame } = useGame();
  const [currentWord, setCurrentWord] = useState('');
  const [scrambledWord, setScrambledWord] = useState('');
  const [userGuess, setUserGuess] = useState('');
  const [hint, setHint] = useState('');
  const [usedHint, setUsedHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timer, setTimer] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [usedWords, setUsedWords] = useState([]);

  // Scramble a word
  const scrambleWord = useCallback((word) => {
    let letters = word.split('');
    let scrambled = word;
    
    // Keep scrambling until we get a different arrangement
    while (scrambled === word) {
      letters = shuffleArray(letters);
      scrambled = letters.join('');
    }
    
    return scrambled;
  }, []);

  // Get a random word based on difficulty
  const getRandomWord = useCallback(() => {
    const availableWords = wordLists[difficulty].filter(word => !usedWords.includes(word));
    
    // If all words have been used, reset the used words list
    if (availableWords.length === 0) {
      setUsedWords([]);
      return wordLists[difficulty][Math.floor(Math.random() * wordLists[difficulty].length)];
    }
    
    return availableWords[Math.floor(Math.random() * availableWords.length)];
  }, [difficulty, usedWords]);

  // Generate a hint for the current word
  const generateHint = useCallback((word) => {
    const availableHints = hintTypes[difficulty];
    const hintType = availableHints[Math.floor(Math.random() * availableHints.length)];
    
    switch (hintType) {
      case 'first letter':
        return `Hint: The first letter is "${word[0]}"`;
      case 'last letter':
        return `Hint: The last letter is "${word[word.length - 1]}"`;
      case 'word length':
        return `Hint: The word has ${word.length} letters`;
      case 'category':
        return `Hint: The word is a ${wordCategories[word] || 'common word'}`;
      default:
        return `Hint: It's a ${wordCategories[word] || 'common word'}`;
    }
  }, [difficulty]);

  // Set up a new word
  const setupNewWord = useCallback(() => {
    const word = getRandomWord();
    setCurrentWord(word);
    setScrambledWord(scrambleWord(word));
    setUserGuess('');
    setHint(generateHint(word));
    setUsedHint(false);
    setUsedWords(prev => [...prev, word]);
  }, [getRandomWord, scrambleWord, generateHint]);

  // Initialize game
  const initializeGame = useCallback(() => {
    setWordsCompleted(0);
    setCorrectGuesses(0);
    setTotalGuesses(0);
    setUsedWords([]);
    setTimeLeft(difficulty === 'easy' ? 60 : difficulty === 'medium' ? 90 : 120);
    setupNewWord();
  }, [difficulty, setupNewWord]);

  // Start the game
  const handleStartGame = () => {
    initializeGame();
    startGame();
    setGameStarted(true);
    setGameOver(false);
    
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
  };

  // Handle game over
  const handleGameOver = async () => {
    if (timer) clearInterval(timer);
    setGameOver(true);
    
    // Calculate final score based on correct guesses and time left
    const accuracy = totalGuesses > 0 ? (correctGuesses / totalGuesses) * 100 : 0;
    const difficultyMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2;
    const finalScore = Math.round((correctGuesses * 10 * difficultyMultiplier) + timeLeft);
    
    // Log the score
    await endGame(finalScore);
  };

  // Handle user guess submission
  const handleSubmitGuess = (e) => {
    e.preventDefault();
    
    setTotalGuesses(prev => prev + 1);
    
    if (userGuess.toLowerCase() === currentWord.toLowerCase()) {
      // Correct guess
      setCorrectGuesses(prev => prev + 1);
      setWordsCompleted(prev => prev + 1);
      
      // Add points based on difficulty and whether hint was used
      const basePoints = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20;
      const pointsEarned = usedHint ? Math.floor(basePoints * 0.7) : basePoints;
      
      updateScore(pointsEarned);
      
      // Set up a new word
      setupNewWord();
    } else {
      // Incorrect guess
      setUserGuess('');
    }
  };

  // Show hint
  const handleShowHint = () => {
    setUsedHint(true);
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
      <h1 className="text-3xl font-bold mb-4">Word Scramble</h1>
      
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
              Unscramble the letters to form a valid word. The faster you solve, the more points you earn!
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
            moves={totalGuesses}
            onReset={handleResetGame}
          />
          
          {gameOver ? (
            <GameResults 
              score={gameState.score}
              moves={totalGuesses}
              timeLeft={timeLeft}
              onPlayAgain={handleResetGame}
            />
          ) : (
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
              <div className="mb-6 text-center">
                <p className="text-gray-600 mb-1">Words Completed: {wordsCompleted}</p>
                <p className="text-gray-600">Accuracy: {totalGuesses > 0 ? Math.round((correctGuesses / totalGuesses) * 100) : 0}%</p>
              </div>
              
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2 text-center">Unscramble this word:</h2>
                <div className="flex justify-center">
                  <div className="text-3xl font-bold tracking-wider bg-blue-100 px-6 py-3 rounded-lg">
                    {scrambledWord.toUpperCase()}
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmitGuess} className="mb-4">
                <div className="mb-4">
                  <input
                    type="text"
                    value={userGuess}
                    onChange={(e) => setUserGuess(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your answer..."
                    autoFocus
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Submit
                </button>
              </form>
              
              <div className="text-center">
                {!usedHint ? (
                  <button
                    onClick={handleShowHint}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Need a hint?
                  </button>
                ) : (
                  <p className="text-gray-700 italic">{hint}</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WordScrambleGame; 