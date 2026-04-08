import React from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';

const GameResults = ({ score, moves, timeLeft, onPlayAgain }) => {
  const { user } = useAuth();
  
  // Calculate performance metrics
  const getPerformanceMessage = () => {
    if (score >= 100) return "Outstanding performance!";
    if (score >= 70) return "Great job!";
    if (score >= 40) return "Good effort!";
    return "Keep practicing!";
  };
  
  // Calculate efficiency (score per move)
  const efficiency = moves > 0 ? (score / moves).toFixed(1) : 0;
  
  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Game Over!</h2>
      
      <div className="mb-6">
        <div className="text-5xl font-bold text-blue-600 mb-2">{score}</div>
        <p className="text-gray-600">Final Score</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-100 p-3 rounded-lg">
          <div className="text-xl font-semibold text-purple-600">{moves}</div>
          <p className="text-sm text-gray-600">Total Moves</p>
        </div>
        
        <div className="bg-gray-100 p-3 rounded-lg">
          <div className="text-xl font-semibold text-green-600">{efficiency}</div>
          <p className="text-sm text-gray-600">Points per Move</p>
        </div>
        
        <div className="bg-gray-100 p-3 rounded-lg">
          <div className="text-xl font-semibold text-orange-600">{timeLeft}</div>
          <p className="text-sm text-gray-600">Seconds Left</p>
        </div>
        
        <div className="bg-gray-100 p-3 rounded-lg">
          <div className="text-xl font-semibold text-indigo-600">
            {user ? "Saved" : "Not Saved"}
          </div>
          <p className="text-sm text-gray-600">Score Status</p>
        </div>
      </div>
      
      <p className="text-lg font-medium text-gray-700 mb-6">
        {getPerformanceMessage()}
      </p>
      
      {!user && (
        <p className="text-sm text-gray-500 mb-4">
          Sign in to save your scores and track your progress!
        </p>
      )}
      
      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
        onClick={onPlayAgain}
      >
        Play Again
      </button>
    </div>
  );
};

GameResults.propTypes = {
  score: PropTypes.number.isRequired,
  moves: PropTypes.number.isRequired,
  timeLeft: PropTypes.number.isRequired,
  onPlayAgain: PropTypes.func.isRequired
};

export default GameResults; 