import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

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
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const startNewSession = async () => {
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
      
      const newSession = response.data;
      setSessions(prev => [...prev, newSession]);
      setCurrentSession(newSession.session_id);
      setMessages([]);
      
      return newSession;
    } catch (error) {
      console.error('Error starting chat session:', error);
      toast.error('Errore nell\'avvio della chat');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message, sessionId = currentSession) => {
    if (!sessionId) {
      const session = await startNewSession();
      sessionId = session.session_id;
    }
    
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      
      // Add user message to UI immediately
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/chat/message`,
        {
          session_id: sessionId,
          message: message,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const aiResponse = response.data.response;
      
      // Add AI response to messages
      const assistantMessage = {
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        intent: aiResponse.intent,
        suggested_actions: aiResponse.suggested_actions,
        suggested_providers: aiResponse.suggested_providers,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      return aiResponse;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: 'Mi dispiace, si è verificato un errore. Riprova tra poco.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast.error('Errore nell\'invio del messaggio');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async (sessionId) => {
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
      
      setMessages(response.data.messages);
      setCurrentSession(sessionId);
      
      return response.data.messages;
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast.error('Errore nel caricamento della cronologia');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentSession(null);
  };

  const deleteSession = async (sessionId) => {
    try {
      const token = await getAccessTokenSilently();
      
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/chat/sessions/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      
      if (currentSession === sessionId) {
        clearChat();
      }
      
      toast.success('Sessione eliminata');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Errore nell\'eliminazione della sessione');
      throw error;
    }
  };

  const value = {
    sessions,
    currentSession,
    messages,
    loading,
    startNewSession,
    sendMessage,
    loadChatHistory,
    clearChat,
    deleteSession,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
