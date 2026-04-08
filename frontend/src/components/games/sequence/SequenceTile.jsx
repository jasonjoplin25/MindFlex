import React from 'react';
import { Paper, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const SequenceTile = ({ tile, isActive, onClick, disabled }) => {
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
          cursor: disabled ? 'default' : 'pointer',
          background: isActive
            ? `linear-gradient(135deg, ${tile.light} 0%, ${tile.color} 100%)`
            : `linear-gradient(135deg, ${tile.color}40 0%, ${tile.color}80 100%)`,
          transition: 'background 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease',
          border: `2px solid ${tile.color}40`,
          borderRadius: 2,
          boxShadow: isActive
            ? `0 0 20px ${tile.color}80`
            : '0 4px 8px rgba(0, 0, 0, 0.1)',
          '&:hover': !disabled && {
            boxShadow: `0 0 15px ${tile.color}60`,
            border: `2px solid ${tile.color}80`,
          },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              color: isActive ? 'white' : `${tile.color}CC`,
              userSelect: 'none',
            }}
          >
            {tile.symbol}
          </Typography>
        </motion.div>
      </Paper>
    </motion.div>
  );
};

export default SequenceTile; 