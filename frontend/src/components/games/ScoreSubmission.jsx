import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { gameService, sessionManager } from '../../services/gameService';

const ScoreSubmission = ({ 
  open, 
  onClose, 
  gameData, 
  scoreData, 
  onSubmitSuccess 
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmitScore = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      console.log('Score dialog - displaying results');
      console.log('Game data:', gameData);
      console.log('Score data:', scoreData);

      // Score was already submitted by the game component
      // This dialog just displays results and closes
      onSubmitSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error in score dialog:', err);
      setError('Error closing dialog.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Game Complete!</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="h6" gutterBottom>
            {gameData?.name}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Difficulty: {scoreData?.difficulty}
          </Typography>
          <Typography variant="h4" color="primary" gutterBottom>
            Score: {scoreData?.score}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Time: {Math.floor(scoreData?.duration / 60)}m {scoreData?.duration % 60}s
          </Typography>
          {scoreData?.errors > 0 && (
            <Typography variant="body2" color="error">
              Errors: {scoreData.errors}
            </Typography>
          )}
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmitScore} 
          variant="contained" 
          color="primary"
          disabled={submitting}
        >
          {submitting ? <CircularProgress size={24} /> : 'Continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScoreSubmission; 