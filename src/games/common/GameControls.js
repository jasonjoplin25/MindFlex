import React from 'react';
import PropTypes from 'prop-types';

const GameControls = ({ score, timeLeft, moves, onReset }) => {
  // Format time to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex flex-col items-center p-2">
          <span className="text-gray-600 text-sm">Score</span>
          <span className="text-2xl font-bold text-blue-600">{score}</span>
        </div>
        
        <div className="flex flex-col items-center p-2">
          <span className="text-gray-600 text-sm">Time Left</span>
          <span className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
        
        <div className="flex flex-col items-center p-2">
          <span className="text-gray-600 text-sm">Moves</span>
          <span className="text-2xl font-bold text-purple-600">{moves}</span>
        </div>
        
        <button
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
          onClick={onReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

GameControls.propTypes = {
  score: PropTypes.number.isRequired,
  timeLeft: PropTypes.number.isRequired,
  moves: PropTypes.number.isRequired,
  onReset: PropTypes.func.isRequired
};

export default GameControls; 