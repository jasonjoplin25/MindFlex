import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  Chip,
  Card,
  CardContent,
  CardHeader,
  IconButton,
} from '@mui/material';

useEffect(() => {
  if (selectedDomain) {
    setGames(generateGamesForCategory(selectedDomain));
    setSelectedGame(null);
  }
}, [selectedDomain]); 