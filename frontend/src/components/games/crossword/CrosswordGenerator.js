// Professional crossword puzzle generator using proper placement algorithms
class CrosswordGenerator {
  constructor() {
    // Enhanced word lists with balanced lengths for proper crossword layout
    this.wordLists = {
      easy: [
        { word: 'CAT', clue: 'Feline pet' },
        { word: 'DOG', clue: 'Man\'s best friend' },
        { word: 'SUN', clue: 'Bright star in our solar system' },
        { word: 'MOON', clue: 'Earth\'s natural satellite' },
        { word: 'TREE', clue: 'Woody plant with branches' },
        { word: 'FISH', clue: 'Aquatic animal with gills' },
        { word: 'BIRD', clue: 'Flying creature with feathers' },
        { word: 'BOOK', clue: 'Collection of pages with text' },
        { word: 'RAIN', clue: 'Water falling from clouds' },
        { word: 'SNOW', clue: 'Frozen precipitation' },
        { word: 'STAR', clue: 'Celestial body that shines' },
        { word: 'WIND', clue: 'Moving air' },
        { word: 'FIRE', clue: 'Hot, burning element' },
        { word: 'WATER', clue: 'Clear liquid essential for life' },
        { word: 'HOUSE', clue: 'Building where people live' },
        { word: 'CHAIR', clue: 'Furniture for sitting' },
        { word: 'TABLE', clue: 'Flat surface for dining' },
        { word: 'PHONE', clue: 'Device for making calls' },
        { word: 'SMILE', clue: 'Happy facial expression' },
        { word: 'LAUGH', clue: 'Expression of amusement' },
        { word: 'HEART', clue: 'Organ that pumps blood' },
        { word: 'LIGHT', clue: 'Bright illumination' },
        { word: 'OCEAN', clue: 'Large body of salt water' },
        { word: 'GRASS', clue: 'Green lawn covering' },
        { word: 'SWEET', clue: 'Having a sugary taste' }
      ],
      medium: [
        { word: 'COMPUTER', clue: 'Electronic device for processing data' },
        { word: 'ELEPHANT', clue: 'Large mammal with trunk' },
        { word: 'MOUNTAIN', clue: 'High natural elevation' },
        { word: 'KEYBOARD', clue: 'Input device with keys' },
        { word: 'BIRTHDAY', clue: 'Annual celebration of birth' },
        { word: 'HOMEWORK', clue: 'School assignments done at home' },
        { word: 'SANDWICH', clue: 'Food between bread slices' },
        { word: 'UMBRELLA', clue: 'Protection from rain' },
        { word: 'BACKPACK', clue: 'Bag carried on shoulders' },
        { word: 'AIRPLANE', clue: 'Flying vehicle with wings' },
        { word: 'HOSPITAL', clue: 'Medical treatment facility' },
        { word: 'VACATION', clue: 'Time away from work' },
        { word: 'MAGAZINE', clue: 'Periodic publication' },
        { word: 'EXERCISE', clue: 'Physical activity for health' },
        { word: 'GARDEN', clue: 'Space for growing plants' },
        { word: 'KITCHEN', clue: 'Room for cooking' },
        { word: 'WEATHER', clue: 'Atmospheric conditions' },
        { word: 'PICTURE', clue: 'Visual representation' },
        { word: 'SCIENCE', clue: 'Study of natural world' },
        { word: 'FREEDOM', clue: 'State of being free' },
        { word: 'COURAGE', clue: 'Bravery in face of danger' },
        { word: 'MYSTERY', clue: 'Something unexplained' },
        { word: 'JOURNEY', clue: 'Trip from one place to another' },
        { word: 'RAINBOW', clue: 'Colorful arc in sky' },
        { word: 'CRYSTAL', clue: 'Clear mineral formation' }
      ],
      hard: [
        { word: 'ALGORITHM', clue: 'Set of rules for solving problems' },
        { word: 'PHILOSOPHY', clue: 'Study of fundamental questions' },
        { word: 'ARCHITECTURE', clue: 'Design and construction of buildings' },
        { word: 'CONSEQUENCE', clue: 'Result of an action' },
        { word: 'EXTRAORDINARY', clue: 'Beyond what is normal' },
        { word: 'SYNCHRONIZE', clue: 'Coordinate in time' },
        { word: 'METAPHYSICS', clue: 'Branch of philosophy about reality' },
        { word: 'RENAISSANCE', clue: 'Period of cultural rebirth' },
        { word: 'DEMOCRACY', clue: 'Government by the people' },
        { word: 'REVOLUTION', clue: 'Dramatic change in society' },
        { word: 'TECHNOLOGY', clue: 'Application of scientific knowledge' },
        { word: 'ENVIRONMENT', clue: 'Natural world around us' },
        { word: 'INFORMATION', clue: 'Facts and data' },
        { word: 'IMAGINATION', clue: 'Ability to form mental images' },
        { word: 'OPPORTUNITY', clue: 'Favorable circumstances' },
        { word: 'PERSONALITY', clue: 'Individual character traits' },
        { word: 'RESPONSIBILITY', clue: 'Duty or obligation' },
        { word: 'ENTERTAINMENT', clue: 'Amusement or diversion' },
        { word: 'COMMUNICATION', clue: 'Exchange of information' },
        { word: 'ORGANIZATION', clue: 'Structured group or system' },
        { word: 'RELATIONSHIP', clue: 'Connection between people' },
        { word: 'ACHIEVEMENT', clue: 'Successful completion of goal' },
        { word: 'DEVELOPMENT', clue: 'Process of growth' },
        { word: 'SIGNIFICANCE', clue: 'Importance or meaning' },
        { word: 'PERFORMANCE', clue: 'Execution of an activity' }
      ]
    };
  }

  generatePuzzle(difficulty) {
    const wordList = this.wordLists[difficulty];
    const targetWordCount = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 16 : 20;
    
    // Select balanced words for proper crossword layout
    const selectedWords = this.selectBalancedWords(wordList, targetWordCount);
    
    // Generate proper crossword layout with multiple attempts
    let bestLayout = null;
    let bestScore = 0;
    
    // Try multiple times to generate the best layout
    for (let attempt = 0; attempt < 5; attempt++) {
      const layout = this.generateProperCrosswordLayout(selectedWords, difficulty);
      const score = this.scoreLayout(layout);
      
      if (score > bestScore) {
        bestScore = score;
        bestLayout = layout;
      }
    }
    
    return bestLayout || this.generateProperCrosswordLayout(selectedWords, difficulty);
  }

  selectBalancedWords(wordList, count) {
    // Sort words by length to ensure good variety
    const shortWords = wordList.filter(w => w.word.length <= 4);
    const mediumWords = wordList.filter(w => w.word.length >= 5 && w.word.length <= 7);
    const longWords = wordList.filter(w => w.word.length >= 8);
    
    const selected = [];
    const wordsPerCategory = Math.floor(count / 3);
    
    // Shuffle and select from each category
    const shuffledShort = [...shortWords].sort(() => Math.random() - 0.5);
    const shuffledMedium = [...mediumWords].sort(() => Math.random() - 0.5);
    const shuffledLong = [...longWords].sort(() => Math.random() - 0.5);
    
    selected.push(...shuffledShort.slice(0, wordsPerCategory));
    selected.push(...shuffledMedium.slice(0, wordsPerCategory));
    selected.push(...shuffledLong.slice(0, wordsPerCategory));
    
    // Fill remaining slots
    const remaining = count - selected.length;
    if (remaining > 0) {
      const allRemaining = [...shuffledShort, ...shuffledMedium, ...shuffledLong]
        .filter(w => !selected.includes(w))
        .sort(() => Math.random() - 0.5);
      selected.push(...allRemaining.slice(0, remaining));
    }
    
    return selected.slice(0, count);
  }

  generateProperCrosswordLayout(words, difficulty) {
    const gridSize = difficulty === 'easy' ? 11 : difficulty === 'medium' ? 13 : 15;
    const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(null));
    const placedWords = [];
    
    // Separate words into across and down for balanced placement
    const acrossWords = [];
    const downWords = [];
    
    words.forEach((word, index) => {
      if (index % 2 === 0) {
        acrossWords.push(word);
      } else {
        downWords.push(word);
      }
    });
    
    let wordNumber = 1;
    
    // Place words using strategic positioning
    const allWords = [];
    acrossWords.forEach(word => allWords.push({ ...word, preferredDirection: 'across' }));
    downWords.forEach(word => allWords.push({ ...word, preferredDirection: 'down' }));
    
    // Sort by length for better placement strategy
    allWords.sort((a, b) => b.word.length - a.word.length);
    
    // Place first word in center
    if (allWords.length > 0) {
      const firstWord = allWords[0];
      const direction = firstWord.preferredDirection;
      let startRow, startCol;
      
      if (direction === 'across') {
        startRow = Math.floor(gridSize / 2);
        startCol = Math.floor((gridSize - firstWord.word.length) / 2);
      } else {
        startRow = Math.floor((gridSize - firstWord.word.length) / 2);
        startCol = Math.floor(gridSize / 2);
      }
      
      if (this.canPlaceWordWithSeparation(grid, firstWord.word, startRow, startCol, direction)) {
        this.placeWordWithSeparation(grid, firstWord.word, startRow, startCol, direction);
        placedWords.push({
          ...firstWord,
          number: wordNumber++,
          row: startRow,
          col: startCol,
          direction: direction,
          cells: this.getWordCells(startRow, startCol, firstWord.word.length, direction)
        });
      }
    }
    
    // Place remaining words with proper separation
    for (let i = 1; i < allWords.length && placedWords.length < 12; i++) {
      const word = allWords[i];
      const placement = this.findBestPlacementWithSeparation(grid, word, placedWords, gridSize);
      
      if (placement) {
        this.placeWordWithSeparation(grid, word.word, placement.row, placement.col, placement.direction);
        placedWords.push({
          ...word,
          number: wordNumber++,
          row: placement.row,
          col: placement.col,
          direction: placement.direction,
          cells: this.getWordCells(placement.row, placement.col, word.word.length, placement.direction)
        });
      }
    }

    return {
      grid,
      words: placedWords,
      size: gridSize
    };
  }

  findBestPlacementWithSeparation(grid, word, placedWords, gridSize) {
    const possiblePlacements = [];
    const direction = word.preferredDirection;
    
    // Try different positions for the word with proper separation
    for (let row = 1; row < gridSize - 1; row++) {
      for (let col = 1; col < gridSize - 1; col++) {
        // Check if word can be placed here with intersections
        const intersections = this.findIntersections(grid, word.word, row, col, direction, placedWords);
        
        if (intersections.length > 0 && this.canPlaceWordWithSeparation(grid, word.word, row, col, direction)) {
          possiblePlacements.push({
            row,
            col,
            direction,
            intersectionCount: intersections.length,
            score: this.scoreLayoutPlacement(grid, word.word, row, col, direction, intersections)
          });
        }
      }
    }
    
    // Also try placing without intersections if we have few words
    if (placedWords.length < 3) {
      for (let row = 2; row < gridSize - 2; row += 2) {
        for (let col = 2; col < gridSize - 2; col += 2) {
          if (this.canPlaceWordWithSeparation(grid, word.word, row, col, direction)) {
            possiblePlacements.push({
              row,
              col,
              direction,
              intersectionCount: 0,
              score: 1 // Low score for isolated placement
            });
          }
        }
      }
    }

    // Return best placement
    if (possiblePlacements.length > 0) {
      possiblePlacements.sort((a, b) => b.score - a.score);
      return possiblePlacements[0];
    }

    return null;
  }

  findIntersections(grid, word, row, col, direction, placedWords) {
    const intersections = [];
    
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === 'across' ? row : row + i;
      const currentCol = direction === 'across' ? col + i : col;
      
      if (currentRow >= 0 && currentRow < grid.length && 
          currentCol >= 0 && currentCol < grid.length && 
          grid[currentRow][currentCol] === word[i]) {
        intersections.push({ row: currentRow, col: currentCol, letterIndex: i });
      }
    }
    
    return intersections;
  }

  canPlaceWordWithSeparation(grid, word, row, col, direction) {
    const gridSize = grid.length;
    
    // Check bounds
    if (direction === 'across') {
      if (row < 0 || row >= gridSize || col < 0 || col + word.length >= gridSize) {
        return false;
      }
    } else {
      if (row < 0 || row + word.length >= gridSize || col < 0 || col >= gridSize) {
        return false;
      }
    }
    
    // Check if cells before and after word are empty (for separation)
    if (direction === 'across') {
      // Check cell before start
      if (col > 0 && grid[row][col - 1] !== null) {
        return false;
      }
      // Check cell after end
      if (col + word.length < gridSize && grid[row][col + word.length] !== null) {
        return false;
      }
    } else {
      // Check cell before start
      if (row > 0 && grid[row - 1][col] !== null) {
        return false;
      }
      // Check cell after end
      if (row + word.length < gridSize && grid[row + word.length][col] !== null) {
        return false;
      }
    }
    
    // Check each letter position
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === 'across' ? row : row + i;
      const currentCol = direction === 'across' ? col + i : col;
      const currentCell = grid[currentRow][currentCol];
      
      if (currentCell !== null && currentCell !== word[i]) {
        return false; // Conflict
      }
      
      // Check perpendicular separation (only for empty cells)
      if (currentCell === null) {
        if (direction === 'across') {
          // Check above and below
          if ((currentRow > 0 && grid[currentRow - 1][currentCol] !== null) ||
              (currentRow < gridSize - 1 && grid[currentRow + 1][currentCol] !== null)) {
            // Only allow if it's part of a valid intersection
            if (grid[currentRow][currentCol] !== word[i]) {
              return false;
            }
          }
        } else {
          // Check left and right
          if ((currentCol > 0 && grid[currentRow][currentCol - 1] !== null) ||
              (currentCol < gridSize - 1 && grid[currentRow][currentCol + 1] !== null)) {
            // Only allow if it's part of a valid intersection
            if (grid[currentRow][currentCol] !== word[i]) {
              return false;
            }
          }
        }
      }
    }
    
    return true;
  }

  placeWordWithSeparation(grid, word, row, col, direction) {
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === 'across' ? row : row + i;
      const currentCol = direction === 'across' ? col + i : col;
      grid[currentRow][currentCol] = word[i];
    }
  }

  calculateIntersectionPlacement(placedWord, placedIndex, newWord, newIndex, direction) {
    if (direction === 'across') {
      return {
        row: placedWord.row + placedIndex,
        col: placedWord.col - newIndex
      };
    } else {
      return {
        row: placedWord.row - newIndex,
        col: placedWord.col + placedIndex
      };
    }
  }

  isValidPlacement(grid, word, row, col, direction) {
    const gridSize = grid.length;
    const wordLength = word.word.length;

    // Check bounds
    if (direction === 'across') {
      if (col < 0 || col + wordLength >= gridSize || row < 0 || row >= gridSize) {
        return false;
      }
    } else {
      if (row < 0 || row + wordLength >= gridSize || col < 0 || col >= gridSize) {
        return false;
      }
    }

    // Check for conflicts and ensure at least one intersection
    let hasIntersection = false;
    
    for (let i = 0; i < wordLength; i++) {
      const currentRow = direction === 'across' ? row : row + i;
      const currentCol = direction === 'across' ? col + i : col;
      const currentCell = grid[currentRow][currentCol];
      
      if (currentCell !== null) {
        if (currentCell !== word.word[i]) {
          return false; // Conflict
        }
        hasIntersection = true;
      }
    }

    // Ensure proper separation - check adjacent cells for traditional crossword format
    if (hasIntersection) {
      // Check cells before and after the word for proper separation
      if (direction === 'across') {
        // Check cell before word start
        if (col > 0 && grid[row][col - 1] !== null) {
          return false; // Words must be separated
        }
        // Check cell after word end
        if (col + wordLength < gridSize && grid[row][col + wordLength] !== null) {
          return false; // Words must be separated
        }
        
        // Check adjacent rows for vertical separation
        for (let i = 0; i < wordLength; i++) {
          const currentCol = col + i;
          // Skip cells that are intersections with down words
          if (grid[row][currentCol] === null || grid[row][currentCol] === word.word[i]) {
            // Check cell above
            if (row > 0 && grid[row - 1][currentCol] !== null) {
              // Make sure this isn't part of a crossing down word
              let isPartOfDownWord = false;
              for (let checkRow = 0; checkRow < row; checkRow++) {
                if (grid[checkRow][currentCol] !== null) {
                  isPartOfDownWord = true;
                  break;
                }
              }
              if (!isPartOfDownWord) {
                return false; // Improper adjacent word
              }
            }
            // Check cell below
            if (row + 1 < gridSize && grid[row + 1][currentCol] !== null) {
              // Make sure this isn't part of a crossing down word
              let isPartOfDownWord = false;
              for (let checkRow = row + 2; checkRow < gridSize; checkRow++) {
                if (grid[checkRow][currentCol] !== null) {
                  isPartOfDownWord = true;
                  break;
                }
              }
              if (!isPartOfDownWord) {
                return false; // Improper adjacent word
              }
            }
          }
        }
      } else { // direction === 'down'
        // Check cell before word start
        if (row > 0 && grid[row - 1][col] !== null) {
          return false; // Words must be separated
        }
        // Check cell after word end
        if (row + wordLength < gridSize && grid[row + wordLength][col] !== null) {
          return false; // Words must be separated
        }
        
        // Check adjacent columns for horizontal separation
        for (let i = 0; i < wordLength; i++) {
          const currentRow = row + i;
          // Skip cells that are intersections with across words
          if (grid[currentRow][col] === null || grid[currentRow][col] === word.word[i]) {
            // Check cell to the left
            if (col > 0 && grid[currentRow][col - 1] !== null) {
              // Make sure this isn't part of a crossing across word
              let isPartOfAcrossWord = false;
              for (let checkCol = 0; checkCol < col; checkCol++) {
                if (grid[currentRow][checkCol] !== null) {
                  isPartOfAcrossWord = true;
                  break;
                }
              }
              if (!isPartOfAcrossWord) {
                return false; // Improper adjacent word
              }
            }
            // Check cell to the right
            if (col + 1 < gridSize && grid[currentRow][col + 1] !== null) {
              // Make sure this isn't part of a crossing across word
              let isPartOfAcrossWord = false;
              for (let checkCol = col + 2; checkCol < gridSize; checkCol++) {
                if (grid[currentRow][checkCol] !== null) {
                  isPartOfAcrossWord = true;
                  break;
                }
              }
              if (!isPartOfAcrossWord) {
                return false; // Improper adjacent word
              }
            }
          }
        }
      }
    }

    return hasIntersection;
  }

  scoreLayoutPlacement(grid, word, row, col, direction, intersections) {
    let score = intersections.length * 10; // Base score for intersections
    
    // Bonus for central placement
    const gridSize = grid.length;
    const center = Math.floor(gridSize / 2);
    const distanceFromCenter = Math.abs(row - center) + Math.abs(col - center);
    score += Math.max(0, 10 - distanceFromCenter);
    
    // Bonus for word length
    score += word.length;
    
    return score;
  }

  scoreLayout(layout) {
    if (!layout || !layout.words) return 0;
    
    let score = 0;
    const acrossCount = layout.words.filter(w => w.direction === 'across').length;
    const downCount = layout.words.filter(w => w.direction === 'down').length;
    
    // Bonus for balanced word distribution
    const balance = Math.min(acrossCount, downCount);
    score += balance * 20;
    
    // Bonus for total word count
    score += layout.words.length * 5;
    
    return score;
  }

  placeWord(grid, word, row, col, direction, number) {
    for (let i = 0; i < word.word.length; i++) {
      const currentRow = direction === 'across' ? row : row + i;
      const currentCol = direction === 'across' ? col + i : col;
      
      grid[currentRow][currentCol] = word.word[i];
    }
  }

  getWordCells(row, col, length, direction) {
    const cells = [];
    for (let i = 0; i < length; i++) {
      cells.push({
        row: direction === 'across' ? row : row + i,
        col: direction === 'across' ? col + i : col
      });
    }
    return cells;
  }
}

export default CrosswordGenerator;