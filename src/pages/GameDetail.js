import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';

const GameDetail = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { getGameById, loading, error } = useGame();
  const [game, setGame] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        // For now, we'll use hardcoded data since the API isn't fully implemented
        // In a real implementation, this would be: const gameData = await getGameById(gameId);
        
        // Hardcoded game data based on gameId
        let gameData;
        
        switch(gameId) {
          case 'memory':
            gameData = {
              id: 'memory',
              title: 'Memory Match',
              description: 'Test and improve your memory by matching pairs of cards. Remember the positions and find all matches as quickly as possible.',
              longDescription: 'Memory Match is a classic cognitive game that challenges your visual memory and concentration. The game presents a grid of face-down cards, each with a matching pair somewhere on the board. Your task is to flip two cards at a time, trying to find matching pairs. When you find a match, the cards remain face up. The goal is to find all matches in as few moves as possible. This game is excellent for improving short-term memory, concentration, and visual recognition skills.',
              category: 'Memory',
              difficulty: ['easy', 'medium', 'hard'],
              imageUrl: '/images/memory-game.jpg',
              benefits: [
                'Improves short-term memory',
                'Enhances concentration',
                'Develops visual recognition',
                'Trains attention to detail'
              ],
              instructions: [
                'Cards are placed face down on the board',
                'Click on a card to flip it over',
                'Try to find matching pairs by flipping two cards at a time',
                'If the cards match, they remain face up',
                'If they don\'t match, they flip back face down',
                'The game ends when all pairs are matched'
              ],
              path: '/games/memory'
            };
            break;
          case 'wordscramble':
            gameData = {
              id: 'wordscramble',
              title: 'Word Scramble',
              description: 'Unscramble letters to form words. Challenge your vocabulary and word recognition skills with increasing difficulty.',
              longDescription: 'Word Scramble is a vocabulary-building game that tests your ability to recognize and form words from jumbled letters. You\'ll be presented with a set of scrambled letters, and your task is to rearrange them to form a valid word. As you progress, the words become longer and more complex. This game is perfect for expanding vocabulary, improving spelling, and enhancing cognitive flexibility as you mentally rearrange letters to discover possible words.',
              category: 'Language',
              difficulty: ['easy', 'medium', 'hard'],
              imageUrl: '/images/word-scramble.jpg',
              benefits: [
                'Expands vocabulary',
                'Improves spelling',
                'Enhances word recognition',
                'Develops cognitive flexibility'
              ],
              instructions: [
                'You will be shown a set of scrambled letters',
                'Rearrange the letters to form a valid word',
                'Type your answer in the input field',
                'Submit your answer to check if it\'s correct',
                'Progress through increasingly difficult words'
              ],
              path: '/games/wordscramble'
            };
            break;
          case 'patternmatch':
            gameData = {
              id: 'patternmatch',
              title: 'Pattern Match',
              description: 'Identify and remember visual patterns. Train your brain to recognize and recall sequences with increasing complexity.',
              longDescription: 'Pattern Match challenges your visual processing and sequential memory. The game shows you a sequence of patterns that you must memorize and then reproduce. As you advance, the patterns become longer and more complex, requiring greater concentration and memory capacity. This game is excellent for developing working memory, attention to detail, and pattern recognition abilities - skills that are valuable in many everyday tasks and professional settings.',
              category: 'Visual Processing',
              difficulty: ['easy', 'medium', 'hard'],
              imageUrl: '/images/pattern-match.jpg',
              benefits: [
                'Strengthens working memory',
                'Improves pattern recognition',
                'Enhances visual processing',
                'Develops sequential thinking'
              ],
              instructions: [
                'Watch carefully as a sequence of patterns is displayed',
                'Memorize the sequence',
                'After the sequence ends, reproduce it by clicking the patterns in the correct order',
                'Sequences become longer and more complex as you progress'
              ],
              path: '/games/patternmatch'
            };
            break;
          case 'reactiontime':
            gameData = {
              id: 'reactiontime',
              title: 'Reaction Time',
              description: 'Test and improve your reaction speed. Click targets as quickly as possible when they appear on screen.',
              longDescription: 'Reaction Time is a fast-paced game designed to measure and improve your response speed. The game presents targets that appear randomly on screen, and your goal is to click them as quickly as possible. The game measures your reaction time in milliseconds, allowing you to track your progress over time. This exercise is particularly beneficial for improving processing speed, hand-eye coordination, and attention - skills that are crucial for activities like driving, sports, and many everyday tasks.',
              category: 'Processing Speed',
              difficulty: ['easy', 'medium', 'hard'],
              imageUrl: '/images/reaction-time.jpg',
              benefits: [
                'Improves processing speed',
                'Enhances hand-eye coordination',
                'Sharpens focus and attention',
                'Develops quick decision making'
              ],
              instructions: [
                'Wait for the target to appear on screen',
                'Click the target as quickly as possible once it appears',
                'Try not to click too early (false starts)',
                'Your reaction time will be measured in milliseconds',
                'Complete multiple rounds to get an average score'
              ],
              path: '/games/reactiontime'
            };
            break;
          default:
            throw new Error('Game not found');
        }
        
        setGame(gameData);
      } catch (err) {
        console.error('Error fetching game details:', err);
      }
    };

    fetchGameDetails();
  }, [gameId, getGameById]);

  const handlePlayGame = () => {
    // Navigate to the specific game component with the selected difficulty
    navigate(`${game.path}?difficulty=${selectedDifficulty}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading game details. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Game not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Game Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="md:flex">
            <div className="md:flex-shrink-0">
              <div className="h-48 w-full md:w-48 bg-blue-100 flex items-center justify-center">
                <span className="text-5xl">{
                  game.id === 'memory' ? '🧠' :
                  game.id === 'wordscramble' ? '📝' :
                  game.id === 'patternmatch' ? '👁️' : '⚡'
                }</span>
              </div>
            </div>
            <div className="p-8">
              <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
                {game.category}
              </div>
              <h1 className="mt-1 text-3xl font-bold text-gray-900 leading-tight">
                {game.title}
              </h1>
              <p className="mt-2 text-gray-600">
                {game.description}
              </p>
            </div>
          </div>
        </div>

        {/* Game Details */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Game Description */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About This Game</h2>
              <p className="text-gray-700 mb-6">
                {game.longDescription}
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
              <ol className="list-decimal pl-5 mb-6 space-y-2">
                {game.instructions.map((instruction, index) => (
                  <li key={index} className="text-gray-700">{instruction}</li>
                ))}
              </ol>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
              <ul className="list-disc pl-5 space-y-2">
                {game.benefits.map((benefit, index) => (
                  <li key={index} className="text-gray-700">{benefit}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column - Play Game */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Play Game</h2>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="difficulty">
                  Select Difficulty
                </label>
                <select
                  id="difficulty"
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                >
                  {game.difficulty.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handlePlayGame}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150"
              >
                Start Game
              </button>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Your progress and scores will be saved automatically
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail; 