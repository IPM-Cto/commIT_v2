import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  TextField,
  Typography,
  Avatar,
  Stack,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Rating,
  Divider,
} from '@mui/material';
import {
  Close,
  Send,
  SmartToy,
  Person,
  Restaurant,
  CalendarMonth,
  AccessTime,
  LocationOn,
  Phone,
  Star,
} from '@mui/icons-material';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const Chat = ({ open, onClose }) => {
  const { user, getAccessTokenSilently } = useAuth0();
  
  const [messages, setMessages] = React.useState([]);
  const [inputMessage, setInputMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sessionId, setSessionId] = React.useState(null);
  const [suggestedProviders, setSuggestedProviders] = React.useState([]);
  const [suggestedActions, setSuggestedActions] = React.useState([]);
  const messagesEndRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      initializeChat();
    }
  }, [open]);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      const token = await getAccessTokenSilently();
      
      // Start new chat session
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/chat/start`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSessionId(response.data.session_id);
      
      // Add welcome message
      setMessages([
        {
          role: 'assistant',
          content: `Ciao ${user?.name?.split(' ')[0] || ''}! 👋 Sono il tuo assistente AI di commIT. Come posso aiutarti oggi?`,
          timestamp: new Date(),
        }
      ]);
      
      // Set initial suggestions
      setSuggestedActions([
        { type: 'quick_action', label: '🍕 Trova un ristorante' },
        { type: 'quick_action', label: '💇 Prenota parrucchiere' },
        { type: 'quick_action', label: '🏥 Cerca un medico' },
        { type: 'quick_action', label: '📅 Le mie prenotazioni' },
      ]);
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Errore nell\'inizializzazione della chat');
    }
  };

  const sendMessage = async (message = inputMessage) => {
    if (!message.trim() || !sessionId) return;
    
    // Add user message
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setSuggestedActions([]);
    setSuggestedProviders([]);
    
    try {
      const token = await getAccessTokenSilently();
      
      // Send message to AI
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/chat/message`,
        {
          session_id: sessionId,
          message: message,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const aiResponse = response.data.response;
      
      // Add AI response
      const assistantMessage = {
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        intent: aiResponse.intent,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Handle suggested providers
      if (aiResponse.suggested_providers?.length > 0) {
        fetchProviderDetails(aiResponse.suggested_providers);
      }
      
      // Handle suggested actions
      if (aiResponse.suggested_actions?.length > 0) {
        setSuggestedActions(aiResponse.suggested_actions);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: 'Mi dispiace, si è verificato un errore. Puoi riprovare?',
        timestamp: new Date(),
        isError: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderDetails = async (providerIds) => {
    try {
      const token = await getAccessTokenSilently();
      
      const providers = await Promise.all(
        providerIds.map(id =>
          axios.get(
            `${process.env.REACT_APP_API_URL}/providers/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          )
        )
      );
      
      setSuggestedProviders(providers.map(res => res.data.provider));
    } catch (error) {
      console.error('Error fetching provider details:', error);
    }
  };

  const handleQuickAction = (action) => {
    const actionMessages = {
      '🍕 Trova un ristorante': 'Vorrei trovare un buon ristorante',
      '💇 Prenota parrucchiere': 'Ho bisogno di prenotare un parrucchiere',
      '🏥 Cerca un medico': 'Sto cercando un medico',
      '📅 Le mie prenotazioni': 'Mostrami le mie prenotazioni',
    };
    
    const message = actionMessages[action.label] || action.label;
    sendMessage(message);
  };

  const handleProviderAction = (provider, action) => {
    if (action === 'book') {
      sendMessage(`Vorrei prenotare presso ${provider.business_name}`);
    } else if (action === 'info') {
      sendMessage(`Dammi più informazioni su ${provider.business_name}`);
    }
  };

  const formatTime = (date) => {
    return format(new Date(date), 'HH:mm', { locale: it });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '800px',
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <SmartToy />
            </Avatar>
            <Box>
              <Typography variant="h6">Assistente AI commIT</Typography>
              <Typography variant="caption" color="text.secondary">
                Online • Pronto ad aiutarti
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            bgcolor: 'grey.50',
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Stack
                direction={message.role === 'user' ? 'row-reverse' : 'row'}
                spacing={1}
                alignItems="flex-end"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {message.role === 'user' ? (
                    user?.picture ? (
                      <img src={user.picture} alt="" style={{ width: '100%' }} />
                    ) : (
                      <Person />
                    )
                  ) : (
                    <SmartToy />
                  )}
                </Avatar>
                
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: message.role === 'user' ? 'primary.main' : 'white',
                    color: message.role === 'user' ? 'white' : 'text.primary',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 1,
                      opacity: 0.7,
                    }}
                  >
                    {formatTime(message.timestamp)}
                  </Typography>
                </Paper>
              </Stack>
            </Box>
          ))}
          
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ width: 32, height: 32 }}>
                <SmartToy />
              </Avatar>
              <Paper sx={{ p: 2, bgcolor: 'white' }}>
                <CircularProgress size={20} />
              </Paper>
            </Box>
          )}
          
          {/* Suggested Providers */}
          {suggestedProviders.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                Provider suggeriti:
              </Typography>
              <Stack spacing={2}>
                {suggestedProviders.map((provider) => (
                  <Card key={provider._id} variant="outlined">
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Typography variant="h6">
                            {provider.business_name}
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ my: 1 }}>
                            <Rating value={provider.rating} size="small" readOnly />
                            <Typography variant="body2" color="text.secondary">
                              ({provider.total_reviews} recensioni)
                            </Typography>
                          </Stack>
                          <Stack spacing={0.5}>
                            <Stack direction="row" spacing={1}>
                              <LocationOn fontSize="small" color="action" />
                              <Typography variant="body2">
                                {provider.address?.street}, {provider.address?.city}
                              </Typography>
                            </Stack>
                            {provider.phone && (
                              <Stack direction="row" spacing={1}>
                                <Phone fontSize="small" color="action" />
                                <Typography variant="body2">
                                  {provider.phone}
                                </Typography>
                              </Stack>
                            )}
                          </Stack>
                        </Box>
                        <Chip
                          label={provider.service_category}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Stack>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleProviderAction(provider, 'book')}
                      >
                        Prenota ora
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleProviderAction(provider, 'info')}
                      >
                        Più info
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}
          
          {/* Suggested Actions */}
          {suggestedActions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {suggestedActions.map((action, index) => (
                  <Chip
                    key={index}
                    label={action.label}
                    onClick={() => handleQuickAction(action)}
                    sx={{ mb: 1, cursor: 'pointer' }}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>
        
        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'white',
          }}
        >
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              placeholder="Scrivi un messaggio..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={loading}
              multiline
              maxRows={3}
              InputProps={{
                sx: { borderRadius: 3 },
              }}
            />
            <IconButton
              color="primary"
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || loading}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&:disabled': { bgcolor: 'grey.300' },
              }}
            >
              <Send />
            </IconButton>
          </Stack>
          
          {/* Quick Actions for first interaction */}
          {messages.length <= 1 && (
            <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
              {suggestedActions.map((action, index) => (
                <Chip
                  key={index}
                  label={action.label}
                  onClick={() => handleQuickAction(action)}
                  sx={{ mb: 1, cursor: 'pointer' }}
                  size="small"
                />
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default Chat;
