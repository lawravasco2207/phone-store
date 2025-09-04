import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { v4 as uuidv4 } from 'uuid';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

/**
 * AI-powered support chat component
 */
const SupportChat: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'Hello! I\'m your AI assistant. How can I help you with your phone today?' }
  ]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createTicketDialog, setCreateTicketDialog] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketCreating, setTicketCreating] = useState(false);
  const [duplicateTicket, setDuplicateTicket] = useState<any>(null);
  
  const { token } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session ID on component mount
  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /**
   * Send a message to the AI assistant
   */
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    setError(null);
    setLoading(true);
    
    // Add user message to the chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      const response = await fetch('/api/support/assist/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          message: userMessage
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from assistant');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      // Add AI response to the chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.data.response }]);
      
      // Check if we should suggest creating a ticket
      if (data.data.shouldCreateTicket) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev, 
            { 
              role: 'assistant', 
              content: 'Would you like me to create a support ticket for you?',
              action: 'suggest-ticket'
            }
          ]);
        }, 1000);
      }
      
      // Check for duplicate ticket
      if (data.data.duplicate) {
        setDuplicateTicket(data.data.duplicate);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to communicate with the assistant');
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle user pressing Enter to send a message
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Open the create ticket dialog
   */
  const openCreateTicketDialog = () => {
    setCreateTicketDialog(true);
    
    // Pre-populate with the last user message
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      const lastMessage = userMessages[userMessages.length - 1].content;
      setTicketSubject(lastMessage.split('\n')[0].substring(0, 80));
      setTicketDescription(lastMessage);
    }
  };

  /**
   * Close the create ticket dialog
   */
  const closeCreateTicketDialog = () => {
    setCreateTicketDialog(false);
  };

  /**
   * Create a ticket from the chat
   */
  const createTicket = async () => {
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      return;
    }
    
    setTicketCreating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/support/assist/chat/create-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          subject: ticketSubject,
          description: ticketDescription
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409 && data.duplicateTicket) {
          setDuplicateTicket(data.duplicateTicket);
          throw new Error('Similar ticket already exists');
        }
        throw new Error(data.error || 'Failed to create ticket');
      }
      
      // Add confirmation message to the chat
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `I've created a support ticket for you! Your ticket ID is: ${data.data.id}. Our support team will review your issue and get back to you via email. You can also check the status of your ticket in your account.`,
          ticketId: data.data.id
        }
      ]);
      
      // Close the dialog
      closeCreateTicketDialog();
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket');
      console.error('Error creating ticket:', err);
    } finally {
      setTicketCreating(false);
    }
  };

  /**
   * View ticket details
   */
  const viewTicket = (ticketId: string) => {
    navigate(`/support/tickets/${ticketId}`);
  };

  // Removed unused viewAllTickets function

  return (
    <Paper elevation={3} sx={{ p: 0, maxWidth: 800, mx: 'auto', mt: 4, height: 600, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Typography variant="h6">
          AI Support Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Describe your issue, and I'll try to help or create a support ticket for you.
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
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
                onClick={() => viewTicket(duplicateTicket.id)}
                sx={{ mt: 1 }}
              >
                View Existing Ticket
              </Button>
            </Box>
          )}
        </Alert>
      )}
      
      {/* Chat Messages */}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column',
        gap: 2
      }}>
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 1
            }}
          >
            <Box
              sx={{
                display: 'flex',
                maxWidth: '70%',
                gap: 1
              }}
            >
              {message.role === 'assistant' && (
                <Box sx={{ pt: 0.5 }}>
                  <SmartToyIcon color="primary" fontSize="small" />
                </Box>
              )}
              
              <Box
                sx={{
                  backgroundColor: message.role === 'user' ? 'primary.main' : 'grey.100',
                  color: message.role === 'user' ? 'white' : 'text.primary',
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
                
                {message.action === 'suggest-ticket' && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={openCreateTicketDialog}
                    >
                      Create Ticket
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setMessages(prev => [
                        ...prev, 
                        { role: 'user', content: "No, I don't need a ticket yet" },
                        { role: 'assistant', content: "Okay, I won't create a ticket. Feel free to continue asking questions, and I'll do my best to help." }
                      ])}
                    >
                      No Thanks
                    </Button>
                  </Box>
                )}
                
                {message.ticketId && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => viewTicket(message.ticketId)}
                    >
                      View Ticket
                    </Button>
                  </Box>
                )}
              </Box>
              
              {message.role === 'user' && (
                <Box sx={{ pt: 0.5 }}>
                  <PersonIcon color="inherit" fontSize="small" />
                </Box>
              )}
            </Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)', display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Type your message..."
          variant="outlined"
          size="small"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          multiline
          maxRows={3}
        />
        <Button
          variant="contained"
          color="primary"
          endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          Send
        </Button>
      </Box>
      
      {/* Create Ticket Dialog */}
      <Dialog open={createTicketDialog} onClose={closeCreateTicketDialog}>
        <DialogTitle>Create Support Ticket</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a subject and description for your ticket. Our support team will get back to you as soon as possible.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Subject"
            fullWidth
            variant="outlined"
            value={ticketSubject}
            onChange={(e) => setTicketSubject(e.target.value)}
            required
            disabled={ticketCreating}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={ticketDescription}
            onChange={(e) => setTicketDescription(e.target.value)}
            required
            disabled={ticketCreating}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateTicketDialog} disabled={ticketCreating}>
            Cancel
          </Button>
          <Button 
            onClick={createTicket} 
            variant="contained" 
            color="primary"
            disabled={ticketCreating || !ticketSubject.trim() || !ticketDescription.trim()}
          >
            {ticketCreating ? <CircularProgress size={24} /> : 'Create Ticket'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SupportChat;
