// ChatContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Start a new chat session
  const startNewSession = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/chat/start`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const session = {
        id: response.data.session_id,
        startedAt: new Date(),
        messages: [],
      };

      setSessions(prev => [...prev, session]);
      setActiveSession(session.id);
      setMessages([]);
      
      return session.id;
    } catch (err) {
      console.error('Error starting chat session:', err);
      setError(err.message);
      toast.error('Errore nell\'avvio della chat');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently]);

  // Send a message to the AI
  const sendMessage = useCallback(async (content, sessionId = activeSession) => {
    if (!sessionId) {
      sessionId = await startNewSession();
    }

    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      
      // Add user message to state immediately
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content,
        timestamp: new Date(),
        sessionId,
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Send to backend
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/chat/message`,
        {
          session_id: sessionId,
          message: content,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Add AI response
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.response.content,
        timestamp: new Date(),
        sessionId,
        intent: response.data.response.intent,
        entities: response.data.response.entities,
        suggestedActions: response.data.response.suggested_actions,
        suggestedProviders: response.data.response.suggested_providers,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      return aiMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Mi dispiace, si è verificato un errore. Riprova tra poco.',
        timestamp: new Date(),
        sessionId,
        isError: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeSession, getAccessTokenSilently, startNewSession]);

  // Load chat history
  const loadChatHistory = useCallback(async (sessionId) => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/chat/history/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const messages = response.data.messages.map(msg => ({
        id: msg._id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        sessionId: msg.session_id,
        intent: msg.intent,
        entities: msg.entities,
        suggestedActions: msg.suggested_actions,
        suggestedProviders: msg.suggested_providers,
      }));

      setMessages(messages);
      setActiveSession(sessionId);
      
      return messages;
    } catch (err) {
      console.error('Error loading chat history:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently]);

  // Clear current chat
  const clearChat = useCallback(() => {
    setMessages([]);
    setActiveSession(null);
    setError(null);
  }, []);

  // Get messages for current session
  const getCurrentMessages = useCallback(() => {
    if (!activeSession) return [];
    return messages.filter(msg => msg.sessionId === activeSession);
  }, [activeSession, messages]);

  const value = {
    sessions,
    activeSession,
    messages: getCurrentMessages(),
    loading,
    error,
    startNewSession,
    sendMessage,
    loadChatHistory,
    clearChat,
    setActiveSession,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
