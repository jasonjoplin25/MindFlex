import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';

const CognitiveGames = () => {
  const { games, loading, error, fetchGames, fetchCategories } = useGame();

  useEffect(() => {
    fetchGames();
    fetchCategories();
  }, [fetchGames, fetchCategories]);

  // Hardcoded game data since we've implemented these games directly
  const availableGames = [
    {
      id: 'memory',
      title: 'Memory Match',
      description: 'Test and improve your memory by matching pairs of cards.',
      category: 'Memory',
      difficulty: 'Easy to Hard',
      imageUrl: '/images/games/memory.jpg',
      path: '/games/memory'
    },
    {
      id: 'word-scramble',
      title: 'Word Scramble',
      description: 'Unscramble letters to form words and enhance your vocabulary.',
      category: 'Language',
      difficulty: 'Easy to Hard',
      imageUrl: '/images/games/word-scramble.jpg',
      path: '/games/word-scramble'
    },
    {
      id: 'pattern-match',
      title: 'Pattern Match',
      description: 'Remember and repeat patterns to boost your working memory.',
      category: 'Memory',
      difficulty: 'Easy to Hard',
      imageUrl: '/images/games/pattern-match.jpg',
      path: '/games/pattern-match'
    },
    {
      id: 'reaction-time',
      title: 'Reaction Time',
      description: 'Test your reflexes and improve your reaction speed.',
      category: 'Reflexes',
      difficulty: 'Easy to Hard',
      imageUrl: '/images/games/reaction-time.jpg',
      path: '/games/reaction-time'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Cognitive Games</h1>
        <div className="flex space-x-2">
          <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Categories</option>
            <option value="memory">Memory</option>
            <option value="language">Language</option>
            <option value="reflexes">Reflexes</option>
            <option value="attention">Attention</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableGames.map((game) => (
            <Link 
              to={game.path} 
              key={game.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="h-48 bg-gray-200 relative">
                <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-20">
                  <span className="text-4xl">{game.title.charAt(0)}</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-gray-800">{game.title}</h2>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {game.category}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{game.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Difficulty: {game.difficulty}</span>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Play Now
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Benefits of Cognitive Games</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-3xl mb-3">🧠</div>
            <h3 className="text-lg font-semibold mb-2">Improved Memory</h3>
            <p className="text-gray-600">Regular memory exercises can help strengthen both short and long-term memory.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-green-600 text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Faster Processing</h3>
            <p className="text-gray-600">Reaction games help improve your brain's processing speed and response time.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-purple-600 text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold mb-2">Enhanced Focus</h3>
            <p className="text-gray-600">Concentration games help train your brain to maintain attention for longer periods.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-orange-600 text-3xl mb-3">🧩</div>
            <h3 className="text-lg font-semibold mb-2">Problem Solving</h3>
            <p className="text-gray-600">Puzzle games improve your ability to think critically and solve complex problems.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CognitiveGames; 