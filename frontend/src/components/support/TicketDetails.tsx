import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import type { TimelineDotProps } from '@mui/lab/TimelineDot';
import { API_BASE_URL } from '../../utils/api';

/**
 * Ticket details component to display a single ticket and its history
 */
type Status = 'open' | 'in_progress' | 'resolved' | 'closed';

type TicketHistory = {
  timestamp: string;
  status: Status | string;
  note?: string;
  updater?: { name?: string } | null;
};

type Ticket = {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: Status;
  user_id: number;
  User?: { name?: string } | null;
  createdAt: string;
  updatedAt: string;
  TicketHistories?: TicketHistory[];
};

const TicketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<Status | ''>('');
  const [resolutionNote, setResolutionNote] = useState<string>('');
  
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  // Fetch ticket details on component mount
  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        if (!id) {
          setError('Invalid ticket ID');
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/support/tickets/${id}`, {
          credentials: 'include',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Ticket not found');
          }
          throw new Error('Failed to fetch ticket details');
        }

        const data = await response.json();
        setTicket(data.data || null);
        
        // Initialize the status field with current value
        if (data.data) {
          setNewStatus(data.data.status as Status);
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching ticket details');
        console.error('Error fetching ticket details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [id, token]);

  /**
   * Update the ticket status
   */
  const handleUpdateStatus = async () => {
    if (!id || !newStatus) return;
    
    setUpdating(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/support/tickets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          note: resolutionNote
        })
      });

      if (!response.ok) {
        // Try to extract server error
        try {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to update ticket status');
        } catch {
          throw new Error('Failed to update ticket status');
        }
      }

      // Refresh ticket data
      const updatedData = await response.json();
      if (updatedData?.data) {
        setTicket(updatedData.data);
        setNewStatus(updatedData.data.status as Status);
      } else if (ticket) {
        setTicket({ ...ticket, status: newStatus as Status });
      }
      setResolutionNote('');
    } catch (err: any) {
      setError(err.message || 'Error updating ticket status');
      console.error('Error updating ticket status:', err);
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Get appropriate color for status chip
   */
  const getChipStatusColor = (status: string): ChipProps['color'] => {
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
   * Get appropriate color for timeline dot
   */
  const getDotStatusColor = (status: string): TimelineDotProps['color'] => {
    switch (status) {
      case 'open':
        return 'primary';
      case 'in_progress':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'grey';
      default:
        return 'grey';
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

  /**
   * Check if user can update the ticket
   */
  const canUpdateTicket = () => {
  if (!user || !ticket) return false;
    
    // Admins can always update
    if (user.role === 'admin') return true;
    
    // Users can only close their own tickets
    if (user.id === ticket.user_id) {
      return true;
    }
    
    return false;
  };

  /**
   * Get available status options based on user role and current status
   */
  const getAvailableStatuses = () => {
  if (!user || !ticket) return [] as string[];
    
    // Admin can set any status
    if (user.role === 'admin') {
      return ['open', 'in_progress', 'resolved', 'closed'];
    }
    
    // Regular users can only close their own tickets
    if (user.id === ticket.user_id) {
      return ['closed'];
    }
    
    return [];
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 1000, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Support Ticket Details
        </Typography>
        
        <Button
          variant="outlined"
          onClick={() => navigate('/support/tickets')}
        >
          Back to Tickets
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
      ) : !ticket ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body1" paragraph>
            Ticket not found or you don't have permission to view it.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/support/tickets')}
          >
            Back to Tickets
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {ticket.subject}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Chip 
                    label={ticket.category}
                    color="info"
                    size="small"
                  />
                  <Chip 
                    label={ticket.status}
                    color={getChipStatusColor(ticket.status)}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
                  {ticket.description}
                </Typography>
              </Box>
              
              <Box>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Ticket Information
                  </Typography>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" component="div" color="text.secondary">
                      Ticket ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {ticket.id}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" component="div" color="text.secondary">
                      Created By
                    </Typography>
                    <Typography variant="body2">
                      {ticket.User?.name || 'Unknown User'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" component="div" color="text.secondary">
                      Created At
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(ticket.createdAt)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" component="div" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(ticket.updatedAt)}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {/* Status Update Form */}
          {canUpdateTicket() && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Update Ticket
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' }, gap: 2, alignItems: 'start' }}>
                <Box>
                  <FormControl fullWidth size="small">
                    <InputLabel id="status-select-label">Status</InputLabel>
                    <Select
                      labelId="status-select-label"
                      value={newStatus}
                      label="Status"
                      onChange={(e: SelectChangeEvent<Status>) => setNewStatus(e.target.value as Status)}
                      disabled={updating}
                    >
                      {getAvailableStatuses().map((status) => (
                        <MenuItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <Box>
                  <TextField
                    label="Resolution Note"
                    placeholder="Add a note about this status change"
                    fullWidth
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    disabled={updating}
                    size="small"
                  />
                </Box>
                
                <Box>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleUpdateStatus}
                    disabled={updating || newStatus === ticket.status}
                  >
                    {updating ? <CircularProgress size={24} /> : 'Update Status'}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
          
          {/* Ticket History */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ticket History
            </Typography>
            
            {ticket.TicketHistories && ticket.TicketHistories.length > 0 ? (
              (() => {
                const histories = ticket.TicketHistories ?? [];
                return (
              <Timeline position="right">
        {histories.map((history: TicketHistory, index: number) => (
                  <TimelineItem key={index}>
                    <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.2 }}>
                      {formatDate(history.timestamp)}
                    </TimelineOppositeContent>
                    
                    <TimelineSeparator>
            <TimelineDot color={getDotStatusColor(history.status)} />
                      {index < histories.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    
                    <TimelineContent>
                      <Typography variant="body2" component="span">
                        Status changed to <strong>{history.status}</strong>
                      </Typography>
                      
                      {history.note && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {history.note}
                        </Typography>
                      )}
                      
            {history.updater && (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              by {history.updater.name}
                        </Typography>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
                );
              })()
            ) : (
              <Typography variant="body2" color="text.secondary">
                No history available for this ticket.
              </Typography>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default TicketDetails;
