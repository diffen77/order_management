import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { addCustomerNote, getCustomerById } from '../../services/customer-service';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AddCustomerNote() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!id) return;
      
      try {
        const response = await getCustomerById(id);
        if (response.status === 'error') {
          throw new Error(response.message || 'Failed to load customer');
        }
        setCustomerName(response.data.full_name);
      } catch (err: any) {
        console.error('Error fetching customer data:', err);
        setError(err.message || 'Failed to load customer data');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchCustomerData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !content.trim()) {
      setError('Please provide note content');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await addCustomerNote(id, content);
      
      if (response.status === 'error') {
        throw new Error(response.message || 'Failed to add note');
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/customers/${id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error adding customer note:', err);
      setError(err.message || 'Failed to add customer note');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/customers/${id}`);
  };

  if (initialLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            Add Note for {customerName}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Note added successfully! Redirecting...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Note Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            multiline
            rows={6}
            margin="normal"
            variant="outlined"
            required
            disabled={loading || success}
            placeholder="Enter note content here..."
          />

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={handleBack}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !content.trim() || success}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Saving...' : 'Save Note'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
} 