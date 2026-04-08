import React from 'react';
import PropTypes from 'prop-types';

const MemoryCard = ({ id, image, isFlipped, isMatched, onClick }) => {
  return (
    <div 
      className={`
        relative w-20 h-20 sm:w-24 sm:h-24 
        cursor-pointer transition-all duration-300 transform 
        ${isMatched ? 'scale-95 opacity-70' : 'hover:scale-105'} 
        rounded-lg shadow-md
      `}
      onClick={onClick}
      data-testid={`memory-card-${id}`}
    >
      <div 
        className={`
          absolute inset-0 w-full h-full 
          flex items-center justify-center 
          rounded-lg transition-all duration-300
          ${isFlipped ? 'rotateY-180 opacity-0' : 'opacity-100 bg-gradient-to-br from-blue-500 to-purple-600'}
        `}
      >
        <span className="text-white text-2xl font-bold">?</span>
      </div>
      
      <div 
        className={`
          absolute inset-0 w-full h-full 
          flex items-center justify-center 
          bg-white rounded-lg border-2
          ${isMatched ? 'border-green-500' : 'border-blue-300'}
          transition-all duration-300
          ${isFlipped ? 'opacity-100 rotateY-0' : 'rotateY-180 opacity-0'}
        `}
      >
        <span className="text-4xl">{image}</span>
      </div>
    </div>
  );
};

MemoryCard.propTypes = {
  id: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  isFlipped: PropTypes.bool.isRequired,
  isMatched: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

export default MemoryCard; 