import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Avatar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Alarm as ReminderIcon,
  Flag as FlagIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
  Today as DateIcon,
  AccessTime as TimeIcon,
  Person as UserIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { caregiverApi } from '../../services/apiService';

// Define note categories with colors
const noteCategories = [
  { id: 'observation', name: 'Observation', color: 'primary.main' },
  { id: 'medication', name: 'Medication', color: 'secondary.main' },
  { id: 'behavior', name: 'Behavior', color: '#ff9800' },
  { id: 'activity', name: 'Activity', color: '#4caf50' },
  { id: 'mood', name: 'Mood', color: '#9c27b0' },
  { id: 'other', name: 'Other', color: '#607d8b' },
];

// Define mood options
const moodOptions = [
  { id: 'excellent', name: 'Excellent', emoji: '😄' },
  { id: 'good', name: 'Good', emoji: '🙂' },
  { id: 'neutral', name: 'Neutral', emoji: '😐' },
  { id: 'tired', name: 'Tired', emoji: '😴' },
  { id: 'anxious', name: 'Anxious', emoji: '😟' },
  { id: 'agitated', name: 'Agitated', emoji: '😠' },
  { id: 'confused', name: 'Confused', emoji: '😕' },
  { id: 'sad', name: 'Sad', emoji: '😢' },
];


// Component to add or edit a note
const NoteForm = ({ note, onSubmit, onCancel, patientId }) => {
  const initialState = note || {
    patientId: patientId,
    content: '',
    category: 'observation',
    mood: 'neutral',
    important: false,
    createdAt: new Date().toISOString(),
    createdBy: 'Current User', // Would come from auth context in real app
  };
  
  const [formData, setFormData] = useState(initialState);
  
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'important' ? checked : value,
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: formData.id || `note-${Date.now()}`,
      createdAt: formData.id ? formData.createdAt : new Date().toISOString(),
    });
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <TextField
        fullWidth
        multiline
        rows={4}
        label="Note Content"
        name="content"
        value={formData.content}
        onChange={handleChange}
        required
        sx={{ mb: 2 }}
      />
      
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              label="Category"
            >
              {noteCategories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: category.color,
                        mr: 1,
                      }}
                    />
                    {category.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Mood</InputLabel>
            <Select
              name="mood"
              value={formData.mood}
              onChange={handleChange}
              label="Mood"
            >
              {moodOptions.map((mood) => (
                <MenuItem key={mood.id} value={mood.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ mr: 1 }}>{mood.emoji}</Typography>
                    {mood.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Chip
          icon={<FlagIcon />}
          label="Mark as Important"
          color={formData.important ? 'error' : 'default'}
          onClick={() => setFormData(prev => ({ ...prev, important: !prev.important }))}
          sx={{ mr: 2 }}
        />
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
        >
          {note ? 'Update Note' : 'Add Note'}
        </Button>
      </Box>
    </Box>
  );
};

// Component to display a single note
const NoteItem = ({ note, onEdit, onDelete, disabled }) => {
  const theme = useTheme();
  const category = noteCategories.find(c => c.id === note.category) || noteCategories[0];
  const mood = moodOptions.find(m => m.id === note.mood) || moodOptions[2]; // Default to neutral
  
  const date = new Date(note.createdAt);
  const formattedDate = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  
  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          p: 2,
          mb: 2,
          position: 'relative',
          borderLeft: `4px solid ${category.color}`,
          backgroundColor: theme => theme.palette.mode === 'dark'
            ? 'rgba(19, 47, 76, 0.4)'
            : 'rgba(255, 255, 255, 0.8)',
        }}
      >
        {note.important && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              bgcolor: 'error.main',
              color: 'white',
              px: 1,
              py: 0.5,
              borderBottomLeftRadius: 8,
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            Important
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Chip
            size="small"
            label={category.name}
            sx={{
              backgroundColor: category.color,
              color: 'white',
            }}
          />
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => onEdit(note)}
              title="Edit Note"
              disabled={disabled}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDelete(note.id)}
              title="Delete Note"
              disabled={disabled}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          {note.content}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip
              size="small"
              label={mood.name}
              icon={<Typography sx={{ ml: 1 }}>{mood.emoji}</Typography>}
              variant="outlined"
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <DateIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.6 }} />
              <Typography variant="caption">{formattedDate}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <TimeIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.6 }} />
              <Typography variant="caption">{formattedTime}</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <UserIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.6 }} />
              <Typography variant="caption">{note.createdBy}</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
};

// Main PatientNotes component
const PatientNotes = ({ patientId, patient }) => {
  // Handle both patientId prop (from CaregiverDashboard) and patient object prop (from PatientJourneyPage)
  const actualPatientId = patientId || patient?.id;
  const theme = useTheme();
  const { user } = useAuth();
  
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [importantOnly, setImportantOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [error, setError] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);
  
  // Load notes for the patient
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await caregiverApi.getPatientNotes(actualPatientId);
        
        if (response.success) {
          // Use all real notes from database
          console.log('Notes from database:', response.notes);
          
          const validNotes = (response.notes || []).filter(note => {
            const hasValidId = note.id && (typeof note.id === 'string' || typeof note.id === 'number');
            const hasContent = note.content && note.content.length > 0;
            return hasValidId && hasContent;
          });
          
          const transformedNotes = validNotes.map(note => ({
            id: note.id,
            patientId: actualPatientId,
            content: note.content,
            category: note.category || 'observation',
            mood: 'neutral',
            createdAt: note.date && note.time ? `${note.date}T${note.time}:00` : new Date().toISOString(),
            important: note.urgency === 'high' || note.urgency === 'medium',
            createdBy: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Caregiver',
            type: note.type || 'observation',
            urgency: note.urgency || 'normal',
            tags: note.tags || []
          }));
          setNotes(transformedNotes);
        } else {
          // Clear notes on error and just show empty state
          setNotes([]);
          setError(response.error || 'Failed to load patient notes');
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        setError('Failed to load patient notes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (actualPatientId) {
      fetchNotes();
    }
  }, [actualPatientId, user]);
  
  // Handle adding a new note
  const handleAddNote = async (newNote) => {
    try {
      setOperationLoading(true);
      setError(null);
      
      // Transform note data for API
      const noteData = {
        content: newNote.content,
        type: newNote.category,
        category: newNote.category,
        urgency: newNote.important ? 'high' : 'normal',
        tags: []
      };
      
      console.log('Adding note with data:', noteData);
      const response = await caregiverApi.addPatientNote(actualPatientId, noteData);
      console.log('Add note response:', response);
      console.log('Added note details:', response.note);
      
      if (response.success && response.note) {
        // Add the new note directly from the response instead of relying on broken reload
        const newNote = response.note;
        console.log('Creating note from response:', newNote);
        
        const transformedNewNote = {
          id: newNote.id,
          patientId: actualPatientId,
          content: newNote.content || newNote.content,
          category: newNote.category || 'observation',
          mood: 'neutral',
          createdAt: newNote.date && newNote.time ? `${newNote.date}T${newNote.time}:00` : new Date().toISOString(),
          important: newNote.urgency === 'high' || newNote.urgency === 'medium',
          createdBy: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Caregiver',
          type: newNote.type || 'observation',
          urgency: newNote.urgency || 'normal',
          tags: newNote.tags || []
        };
        
        console.log('Transformed new note:', transformedNewNote);
        
        // Add the new note to the existing notes (filtered to remove mock notes)
        const currentNonMockNotes = notes.filter(note => {
          const isMockNote = note.id === '1' || note.id === '2' || note.id === '3' || note.id === 1 || note.id === 2 || note.id === 3;
          return !isMockNote;
        });
        
        setNotes([transformedNewNote, ...currentNonMockNotes]);
        setShowAddNote(false);
      } else {
        setError(response.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      setError('Failed to add note. Please try again.');
    } finally {
      setOperationLoading(false);
    }
  };
  
  // Handle editing a note
  const handleEditNote = async (updatedNote) => {
    try {
      setOperationLoading(true);
      setError(null);
      
      // Transform note data for API
      const noteData = {
        content: updatedNote.content,
        type: updatedNote.category,
        category: updatedNote.category,
        urgency: updatedNote.important ? 'high' : 'normal',
        tags: updatedNote.tags || []
      };
      
      const response = await caregiverApi.updatePatientNote(actualPatientId, updatedNote.id, noteData);
      if (response.success) {
        // Transform API response back to component format
        const transformedNote = {
          id: response.note.id,
          patientId: actualPatientId,
          content: response.note.content,
          category: response.note.category || 'observation',
          mood: updatedNote.mood || 'neutral',
          createdAt: response.note.date && response.note.time ? `${response.note.date}T${response.note.time}:00` : updatedNote.createdAt,
          important: response.note.urgency === 'high' || response.note.urgency === 'medium',
          createdBy: updatedNote.createdBy,
          type: response.note.type || 'observation',
          urgency: response.note.urgency || 'normal',
          tags: response.note.tags || []
        };
        
        setNotes(notes.map(note => 
          note.id === updatedNote.id ? transformedNote : note
        ));
        setEditingNote(null);
      } else {
        setError(response.error || 'Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      setError('Failed to update note. Please try again.');
    } finally {
      setOperationLoading(false);
    }
  };
  
  // Handle deleting a note
  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        setOperationLoading(true);
        setError(null);
        
        const response = await caregiverApi.deletePatientNote(actualPatientId, noteId);
        
        if (response.success) {
          setNotes(notes.filter(note => note.id !== noteId));
        } else {
          // If the note doesn't exist on the backend, remove it from local state anyway
          if (response.error && (response.error.includes('404') || response.error.includes('not found'))) {
            setNotes(notes.filter(note => note.id !== noteId));
          } else {
            setError(response.error || 'Failed to delete note');
          }
        }
      } catch (error) {
        console.error('Error deleting note:', error);
        
        // If it's a 404 error (note doesn't exist), remove it from local state anyway
        if (error.response && error.response.status === 404) {
          setNotes(notes.filter(note => note.id !== noteId));
        } else {
          setError('Failed to delete note. Please try again.');
        }
      } finally {
        setOperationLoading(false);
      }
    }
  };
  
  // Filter and sort notes based on search, category, importance, and sort preference
  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = searchQuery === '' || 
        note.content.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesCategory = filterCategory === 'all' || note.category === filterCategory;
      
      const matchesImportance = !importantOnly || note.important;
      
      return matchesSearch && matchesCategory && matchesImportance;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      
      switch (sortBy) {
        case 'oldest':
          return dateA - dateB;
        case 'newest':
        default:
          return dateB - dateA;
      }
    });
  
  // Group notes by date
  const groupedNotes = filteredNotes.reduce((groups, note) => {
    const date = new Date(note.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(note);
    return groups;
  }, {});
  
  // Generate PDF report
  const handleGeneratePDF = async () => {
    try {
      setOperationLoading(true);
      
      // Create PDF content from notes data
      const pdfContent = {
        patientId: actualPatientId,
        notes: filteredNotes.map(note => ({
          content: note.content,
          category: note.category,
          createdAt: note.createdAt,
          important: note.important,
          createdBy: note.createdBy
        })),
        filters: {
          category: filterCategory,
          search: searchQuery,
          importantOnly: importantOnly,
          sortBy: sortBy
        },
        generatedAt: new Date().toISOString(),
        generatedBy: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Caregiver'
      };
      
      // Create and download the PDF
      const fileName = `patient-notes-${actualPatientId}-${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([JSON.stringify(pdfContent, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // In a real implementation, you would call a backend API to generate a proper PDF
      // const response = await caregiverApi.generateNotesReport(patientId, pdfContent);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to export notes. Please try again.');
    } finally {
      setOperationLoading(false);
    }
  };
  
  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Patient Notes</Typography>
        
        <Box>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setNotes([])}
            sx={{ mr: 1 }}
          >
            Clear All
          </Button>
          
          <Button
            variant="outlined"
            startIcon={operationLoading ? <CircularProgress size={16} /> : <PrintIcon />}
            onClick={handleGeneratePDF}
            disabled={operationLoading}
            sx={{ mr: 1 }}
          >
            Export PDF
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setShowAddNote(true)}
            disabled={operationLoading}
          >
            Add Note
          </Button>
        </Box>
      </Box>
      
      {/* Filters */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          background: theme.palette.mode === 'dark'
            ? 'rgba(19, 47, 76, 0.4)'
            : 'rgba(255, 255, 255, 0.8)',
          borderRadius: 2,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, opacity: 0.6 }} />,
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {noteCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: category.color,
                          mr: 1,
                        }}
                      />
                      {category.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Chip
                icon={<FlagIcon />}
                label="Important Only"
                color={importantOnly ? 'error' : 'default'}
                onClick={() => setImportantOnly(!importantOnly)}
                sx={{ width: '100%' }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Notes List */}
      {Object.entries(groupedNotes).length > 0 ? (
        Object.entries(groupedNotes).map(([date, dayNotes]) => (
          <Box key={date} sx={{ mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Divider sx={{ flexGrow: 1, mr: 2 }} />
              <Chip 
                label={date} 
                color="primary" 
                variant="outlined"
                icon={<DateIcon />}
              />
              <Divider sx={{ flexGrow: 1, ml: 2 }} />
            </Box>
            
            {dayNotes.map(note => (
              <NoteItem
                key={note.id}
                note={note}
                onEdit={setEditingNote}
                onDelete={handleDeleteNote}
                disabled={operationLoading}
              />
            ))}
          </Box>
        ))
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No notes found. {searchQuery || filterCategory !== 'all' || importantOnly 
              ? 'Try adjusting your filters.' 
              : 'Add your first note by clicking the button above.'}
          </Typography>
        </Paper>
      )}
      
      {/* Add Note Dialog */}
      <Dialog
        open={showAddNote}
        onClose={() => setShowAddNote(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Note</DialogTitle>
        <DialogContent>
          <NoteForm
            patientId={actualPatientId}
            onSubmit={handleAddNote}
            onCancel={() => setShowAddNote(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Note Dialog */}
      <Dialog
        open={!!editingNote}
        onClose={() => setEditingNote(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Note</DialogTitle>
        <DialogContent>
          {editingNote && (
            <NoteForm
              note={editingNote}
              patientId={actualPatientId}
              onSubmit={handleEditNote}
              onCancel={() => setEditingNote(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PatientNotes; 