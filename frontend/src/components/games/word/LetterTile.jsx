import React from 'react';
import { Paper } from '@mui/material';
import { motion } from 'framer-motion';

const LetterTile = ({ letter, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        delay: index * 0.1,
      }}
    >
      <Paper
        sx={{
          width: { xs: 40, sm: 50 },
          height: { xs: 40, sm: 50 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #7C4DFF 0%, #00E5FF 100%)',
          color: 'white',
          borderRadius: 2,
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          userSelect: 'none',
        }}
      >
        {letter}
      </Paper>
    </motion.div>
  );
};

export default LetterTile; 