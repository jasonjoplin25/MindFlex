import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  InputAdornment,
  LinearProgress,
  Chip,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const PatientList = ({ patients, selectedPatient, onSelectPatient }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.condition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActivityStatus = (lastActive) => {
    const daysSinceActive = Math.floor((new Date() - new Date(lastActive)) / (1000 * 60 * 60 * 24));
    return daysSinceActive <= 7;
  };

  return (
    <Box>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search patients..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer
        component={Paper}
        sx={{
          background: 'transparent',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Condition</TableCell>
              <TableCell>Last Active</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence>
              {filteredPatients
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((patient) => (
                  <motion.tr
                    key={patient.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectPatient(patient)}
                  >
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{
                        fontWeight: selectedPatient?.id === patient.id ? 'bold' : 'normal',
                      }}
                    >
                      {patient.name}
                    </TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell>{patient.condition}</TableCell>
                    <TableCell>{new Date(patient.lastActive).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={patient.progress}
                          sx={{
                            width: 100,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(90deg, #00E676, #00E5FF)',
                              borderRadius: 4,
                            },
                          }}
                        />
                        <Typography variant="body2">
                          {patient.progress}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getActivityStatus(patient.lastActive) ? <ActiveIcon /> : <InactiveIcon />}
                        label={getActivityStatus(patient.lastActive) ? 'Active' : 'Inactive'}
                        color={getActivityStatus(patient.lastActive) ? 'success' : 'error'}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                  </motion.tr>
                ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredPatients.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          '.MuiTablePagination-select': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        }}
      />
    </Box>
  );
};

export default PatientList; 