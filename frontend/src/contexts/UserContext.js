// UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { user: auth0User, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [userData, setUserData] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && auth0User) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, auth0User]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUserData(response.data);
      setUserType(response.data.user_type);
      
      // Save to localStorage for offline access
      localStorage.setItem('user_data', JSON.stringify(response.data));
      localStorage.setItem('user_type', response.data.user_type);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message);
      
      // Try to get from localStorage as fallback
      const cachedData = localStorage.getItem('user_data');
      if (cachedData) {
        const data = JSON.parse(cachedData);
        setUserData(data);
        setUserType(data.user_type);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateUserData = async (updates) => {
    try {
      const token = await getAccessTokenSilently();
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/auth/profile`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUserData(response.data);
      localStorage.setItem('user_data', JSON.stringify(response.data));
      
      return response.data;
    } catch (err) {
      console.error('Error updating user data:', err);
      throw err;
    }
  };

  const clearUserData = () => {
    setUserData(null);
    setUserType(null);
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_type');
  };

  const value = {
    userData,
    userType,
    loading,
    error,
    isAuthenticated,
    fetchUserData,
    updateUserData,
    clearUserData,
    isCustomer: userType === 'customer',
    isProvider: userType === 'provider',
    isAdmin: userType === 'admin',
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
