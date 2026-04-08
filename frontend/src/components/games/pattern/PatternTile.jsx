import React from 'react';
import { Paper } from '@mui/material';
import { motion } from 'framer-motion';

const PatternTile = ({ index, isActive, onClick, disabled, colors }) => {
  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      <Paper
        onClick={!disabled ? onClick : undefined}
        sx={{
          aspectRatio: '1',
          width: '100%',
          minHeight: { xs: '60px', sm: '80px' },
          cursor: disabled ? 'default' : 'pointer',
          background: isActive
            ? `linear-gradient(135deg, ${colors.light} 0%, ${colors.main} 100%)`
            : `linear-gradient(135deg, ${colors.main}40 0%, ${colors.main}80 100%)`,
          transition: 'background 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease',
          border: `2px solid ${colors.main}40`,
          borderRadius: 2,
          boxShadow: isActive
            ? `0 0 20px ${colors.main}80`
            : '0 4px 8px rgba(0, 0, 0, 0.1)',
          '&:hover': !disabled && {
            boxShadow: `0 0 15px ${colors.main}60`,
            border: `2px solid ${colors.main}80`,
          },
          // Touch-friendly on mobile
          '@media (hover: none)': {
            '&:active': !disabled && {
              transform: 'scale(0.95)',
              boxShadow: `0 0 15px ${colors.main}60`,
            },
          },
        }}
      >
        <motion.div
          initial={false}
          animate={{
            scale: isActive ? 1.1 : 1,
            opacity: isActive ? 1 : 0.8,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
          }}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </Paper>
    </motion.div>
  );
};

export default PatternTile; 