import React, { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import MemoryCard from './MemoryCard';
import GameControls from '../common/GameControls';
import GameResults from '../common/GameResults';
import { shuffleArray } from '../../utils/gameUtils';

const MemoryGame = () => {
  const { gameState, startGame, updateScore, endGame, resetGame } = useGame();
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState('easy'); // easy, medium, hard

  // Card images for different difficulties
  const cardSets = {
    easy: [
      { id: 1, image: '🍎' },
      { id: 2, image: '🍌' },
      { id: 3, image: '🍇' },
      { id: 4, image: '🍊' },
      { id: 5, image: '🍓' },
      { id: 6, image: '🍉' },
    ],
    medium: [
      { id: 1, image: '🍎' },
      { id: 2, image: '🍌' },
      { id: 3, image: '🍇' },
      { id: 4, image: '🍊' },
      { id: 5, image: '🍓' },
      { id: 6, image: '🍉' },
      { id: 7, image: '🥝' },
      { id: 8, image: '🍍' },
    ],
    hard: [
      { id: 1, image: '🍎' },
      { id: 2, image: '🍌' },
      { id: 3, image: '🍇' },
      { id: 4, image: '🍊' },
      { id: 5, image: '🍓' },
      { id: 6, image: '🍉' },
      { id: 7, image: '🥝' },
      { id: 8, image: '🍍' },
      { id: 9, image: '🥭' },
      { id: 10, image: '🍒' },
    ]
  };

  // Initialize game based on difficulty
  const initializeGame = () => {
    const selectedCards = cardSets[difficulty];
    // Create pairs of cards
    const cardPairs = [...selectedCards, ...selectedCards].map((card, index) => ({
      ...card,
      uniqueId: `${card.id}-${index}`,
      isFlipped: false,
      isMatched: false
    }));
    
    // Shuffle the cards
    setCards(shuffleArray(cardPairs));
    setFlippedCards([]);
    setMatchedCards([]);
    setMoves(0);
    setTimeLeft(difficulty === 'easy' ? 60 : difficulty === 'medium' ? 90 : 120);
    setGameOver(false);
  };

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
  };

  // Handle game over
  const handleGameOver = async () => {
    if (timer) clearInterval(timer);
    setGameOver(true);
    
    // Calculate final score based on matches and remaining time
    const finalScore = (matchedCards.length / 2) * 10 + timeLeft;
    
    // Log the score
    await endGame(finalScore);
  };

  // Handle card click
  const handleCardClick = (uniqueId) => {
    // Prevent clicking if game is over or card is already flipped/matched
    if (gameOver || flippedCards.length >= 2) return;
    
    // Find the clicked card
    const clickedCard = cards.find(card => card.uniqueId === uniqueId);
    
    // Prevent clicking already flipped or matched cards
    if (clickedCard.isFlipped || matchedCards.includes(clickedCard.id)) return;
    
    // Update flipped cards
    const newFlippedCards = [...flippedCards, clickedCard];
    setFlippedCards(newFlippedCards);
    
    // Update cards state to show the flipped card
    setCards(cards.map(card => 
      card.uniqueId === uniqueId ? { ...card, isFlipped: true } : card
    ));
    
    // Check for a match if two cards are flipped
    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      
      // Check if the two flipped cards match
      if (newFlippedCards[0].id === newFlippedCards[1].id) {
        // Cards match
        setMatchedCards([...matchedCards, newFlippedCards[0].id]);
        updateScore(10); // Add points for a match
        
        // Reset flipped cards
        setTimeout(() => {
          setFlippedCards([]);
        }, 500);
        
        // Check if all cards are matched
        if (matchedCards.length + 1 === cardSets[difficulty].length) {
          handleGameOver();
        }
      } else {
        // Cards don't match, flip them back
        setTimeout(() => {
          setCards(cards.map(card => 
            newFlippedCards.some(flipped => flipped.uniqueId === card.uniqueId)
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
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
      <h1 className="text-3xl font-bold mb-4">Memory Game</h1>
      
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
            moves={moves}
            onReset={handleResetGame}
          />
          
          {gameOver ? (
            <GameResults 
              score={gameState.score}
              moves={moves}
              timeLeft={timeLeft}
              onPlayAgain={handleResetGame}
            />
          ) : (
            <div className={`grid gap-4 ${
              difficulty === 'easy' ? 'grid-cols-3 sm:grid-cols-4' : 
              difficulty === 'medium' ? 'grid-cols-4 sm:grid-cols-4' : 
              'grid-cols-4 sm:grid-cols-5'
            } mt-6`}>
              {cards.map(card => (
                <MemoryCard 
                  key={card.uniqueId}
                  id={card.uniqueId}
                  image={card.image}
                  isFlipped={card.isFlipped || matchedCards.includes(card.id)}
                  isMatched={matchedCards.includes(card.id)}
                  onClick={() => handleCardClick(card.uniqueId)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MemoryGame; 