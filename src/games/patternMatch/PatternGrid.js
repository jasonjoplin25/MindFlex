import React from 'react';
import PropTypes from 'prop-types';

const PatternGrid = ({ 
  size, 
  pattern, 
  userPattern, 
  currentIndex, 
  onCellClick, 
  isUserTurn 
}) => {
  // Generate grid cells
  const cells = Array.from({ length: size * size }, (_, index) => {
    // Check if this cell is currently active in the pattern display
    const isActiveInPattern = pattern.includes(index);
    
    // Check if this cell has been clicked by the user
    const isClickedByUser = userPattern.includes(index);
    
    // Determine cell color based on state
    let cellColor = 'bg-gray-200 hover:bg-gray-300';
    
    if (isActiveInPattern) {
      cellColor = 'bg-blue-500';
    } else if (isClickedByUser) {
      // Find the position in the user pattern to determine color
      const positionInUserPattern = userPattern.indexOf(index);
      
      // Use different colors for correct and incorrect cells
      if (positionInUserPattern >= 0 && pattern[positionInUserPattern] === index) {
        cellColor = 'bg-green-500'; // Correct match
      } else {
        cellColor = 'bg-red-500'; // Incorrect match
      }
    }
    
    return (
      <div
        key={index}
        className={`
          ${cellColor}
          w-16 h-16 sm:w-20 sm:h-20
          rounded-lg shadow-md
          flex items-center justify-center
          transition-all duration-200
          ${isUserTurn ? 'cursor-pointer transform hover:scale-105' : 'cursor-default'}
        `}
        onClick={() => isUserTurn && onCellClick(index)}
        data-testid={`pattern-cell-${index}`}
      />
    );
  });

  return (
    <div 
      className={`
        grid gap-2 
        ${size === 3 ? 'grid-cols-3' : size === 4 ? 'grid-cols-4' : 'grid-cols-5'}
        bg-white p-4 rounded-lg shadow-lg
      `}
    >
      {cells}
    </div>
  );
};

PatternGrid.propTypes = {
  size: PropTypes.number.isRequired,
  pattern: PropTypes.array.isRequired,
  userPattern: PropTypes.array.isRequired,
  currentIndex: PropTypes.number.isRequired,
  onCellClick: PropTypes.func.isRequired,
  isUserTurn: PropTypes.bool.isRequired
};

export default PatternGrid; 