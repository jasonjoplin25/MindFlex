import React from 'react';
import { Paper, Box } from '@mui/material';
import { motion } from 'framer-motion';

const MemoryCard = ({ card, isFlipped, isMatched, onClick }) => {
  return (
    <Box
      sx={{
        perspective: '1000px',
        aspectRatio: '1',
        width: '100%',
      }}
    >
      <motion.div
        initial={false}
        animate={{
          rotateY: isFlipped ? 180 : 0,
          scale: isMatched ? 0.9 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          cursor: isMatched ? 'default' : 'pointer',
          minHeight: '60px',
        }}
        whileHover={!isMatched && !isFlipped ? { scale: 1.05 } : {}}
        onClick={() => !isMatched && onClick()}
      >
        {/* Front of card */}
        <Paper
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: { xs: '1.5rem', sm: '2rem' },
            background: 'linear-gradient(135deg, #7C4DFF 0%, #00E5FF 100%)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            boxShadow: isMatched
              ? '0 0 20px rgba(0, 229, 255, 0.5)'
              : '0 4px 12px rgba(0, 0, 0, 0.1)',
            opacity: isMatched ? 0.7 : 1,
          }}
        >
          ?
        </Paper>

        {/* Back of card */}
        <Paper
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: { xs: '1.5rem', sm: '2rem' },
            transform: 'rotateY(180deg)',
            background: isMatched
              ? 'linear-gradient(135deg, #00E676 0%, #00E5FF 100%)'
              : 'linear-gradient(135deg, #B47CFF 0%, #00E5FF 100%)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            boxShadow: isMatched
              ? '0 0 20px rgba(0, 229, 255, 0.5)'
              : '0 4px 12px rgba(0, 0, 0, 0.1)',
            opacity: isMatched ? 0.7 : 1,
          }}
        >
          {card.symbol}
        </Paper>
      </motion.div>
    </Box>
  );
};

export default MemoryCard; 