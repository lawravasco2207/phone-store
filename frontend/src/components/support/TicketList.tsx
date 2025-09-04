import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';

/**
 * Ticket list component to display all user tickets
 */
const TicketList: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Fetch tickets on component mount
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        if (!user?.id) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/support/tickets/user/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tickets');
        }

        const data = await response.json();
        setTickets(data.data || []);
      } catch (err) {
        setError('Error fetching tickets. Please try again.');
        console.error('Error fetching tickets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user?.id, token]);

  /**
   * Get appropriate color for status chip
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'primary';
      case 'in_progress':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          My Support Tickets
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/support/new')}
        >
          Create New Ticket
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : tickets.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body1" paragraph>
            You don't have any support tickets yet.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/support/new')}
          >
            Create Your First Ticket
          </Button>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <Typography variant="body2" component="span" sx={{ fontFamily: 'monospace' }}>
                      {ticket.id.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell>{ticket.category}</TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.status}
                      color={getStatusColor(ticket.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                  <TableCell>{formatDate(ticket.updatedAt)}</TableCell>
                  <TableCell>
                    <Button
                      component={Link}
                      to={`/support/tickets/${ticket.id}`}
                      size="small"
                      variant="outlined"
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default TicketList;
