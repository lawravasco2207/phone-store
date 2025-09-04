import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { toast } from 'react-toastify';
import { Button, TextField, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';

/**
 * Support form component for creating support tickets
 */
const SupportForm: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [duplicateTicket, setDuplicateTicket] = useState<any>(null);
  
  const { token } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !description.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subject, description })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check if this is a duplicate ticket error
        if (response.status === 409 && data.duplicateTicket) {
          setDuplicateTicket(data.duplicateTicket);
          setError('Similar ticket already exists');
        } else {
          setError(data.error || 'Failed to create ticket');
        }
      } else {
        setSuccess(true);
        setTicketId(data.data.id);
        toast.success('Support ticket created successfully!');
      }
    } catch (err) {
      setError('Network error, please try again');
      console.error('Error creating ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate to the duplicate ticket
   */
  const viewDuplicateTicket = () => {
    if (duplicateTicket) {
      navigate(`/support/tickets/${duplicateTicket.id}`);
    }
  };

  /**
   * Navigate to the ticket list
   */
  const viewAllTickets = () => {
    navigate('/support/tickets');
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Submit Support Ticket
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          {duplicateTicket && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                Ticket #{duplicateTicket.id}: {duplicateTicket.subject} 
                (Status: {duplicateTicket.status})
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={viewDuplicateTicket}
                sx={{ mt: 1 }}
              >
                View Existing Ticket
              </Button>
            </Box>
          )}
        </Alert>
      )}
      
      {success ? (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            Your ticket has been created successfully! Ticket ID: {ticketId}
          </Alert>
          <Typography variant="body1" paragraph>
            Our support team will review your ticket and respond via email as soon as possible.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={viewAllTickets}
          >
            View All Tickets
          </Button>
        </Box>
      ) : (
        <form onSubmit={handleSubmit}>
          <TextField
            label="Subject"
            fullWidth
            margin="normal"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            disabled={loading}
          />
          
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            multiline
            rows={5}
            disabled={loading}
            helperText="Please provide as much detail as possible about your issue"
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/support/chat')}
              disabled={loading}
            >
              Use AI Assistant Instead
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </Box>
        </form>
      )}
    </Paper>
  );
};

export default SupportForm;
