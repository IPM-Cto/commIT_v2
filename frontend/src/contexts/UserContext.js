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
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔥 CRITICAL FIX: Load from localStorage on mount
  useEffect(() => {
    console.log('🔄 UserContext: Initializing...');
    
    // Try to load from localStorage first (for immediate access)
    const cachedData = localStorage.getItem('user_data');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        console.log('✅ UserContext: Loaded from localStorage:', parsed);
        setUserData(parsed);
        setLoading(false);
      } catch (err) {
        console.error('❌ UserContext: Error parsing localStorage:', err);
        localStorage.removeItem('user_data');
      }
    } else {
      console.log('⚠️ UserContext: No cached data found');
      setLoading(false);
    }
  }, []);

  // Fetch from API when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔐 UserContext: User authenticated, fetching data...');
      fetchUserData();
    }
  }, [isAuthenticated, user]);

  const fetchUserData = async () => {
    try {
      console.log('📤 UserContext: Fetching user data from API...');
      const token = await getAccessTokenSilently();
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('✅ UserContext: Raw API response:', response.data);
      
      // 🔥 CRITICAL FIX: Extract user object from response
      // API returns: { success: true, user: {...} }
      // We need to store just the user object
      let userObject;
      
      if (response.data.user) {
        // If response has a 'user' property, use that
        userObject = response.data.user;
        console.log('✅ UserContext: Extracted user from response.data.user');
      } else if (response.data.user_type) {
        // If response directly has user_type, it's already the user object
        userObject = response.data;
        console.log('✅ UserContext: Using response.data directly as user object');
      } else {
        console.error('❌ UserContext: Invalid API response structure:', response.data);
        throw new Error('Invalid API response structure');
      }
      
      console.log('✅ UserContext: Final user object:', userObject);
      console.log('✅ UserContext: User type extracted:', userObject.user_type);
      
      // Store the clean user object
      setUserData(userObject);
      localStorage.setItem('user_data', JSON.stringify(userObject));
      localStorage.setItem('user_type', userObject.user_type);
      
    } catch (err) {
      console.error('❌ UserContext: Error fetching from API:', err);
      setError(err.message);
      
      // Keep cached data if API fails
      const cachedData = localStorage.getItem('user_data');
      if (cachedData && !userData) {
        console.log('⚠️ UserContext: Using cached data as fallback');
        setUserData(JSON.parse(cachedData));
      }
    } finally {
      setLoading(false);
    }
  };

  const updateUserData = async (updates) => {
    try {
      setLoading(true);
      const token = await getAccessTokenSilently();
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/users/profile`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // 🔥 CRITICAL FIX: Handle response structure properly
      let updatedUser;
      if (response.data.user) {
        updatedUser = response.data.user;
      } else if (response.data.user_type) {
        updatedUser = response.data;
      } else {
        throw new Error('Invalid update response structure');
      }
      
      console.log('✅ UserContext: Profile updated:', updatedUser);
      
      setUserData(updatedUser);
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      localStorage.setItem('user_type', updatedUser.user_type);
      
      return updatedUser;
    } catch (err) {
      console.error('❌ UserContext: Error updating user data:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearUserData = () => {
    console.log('🗑️ UserContext: Clearing user data');
    setUserData(null);
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_type');
  };

  // 🔥 CRITICAL FIX: userType extraction now works correctly
  const value = {
    userData,
    userType: userData?.user_type || null,  // Clean extraction
    loading,
    error,
    isAuthenticated,
    fetchUserData,
    updateUserData,
    clearUserData,
    isProvider: userData?.user_type === 'provider',
    isCustomer: userData?.user_type === 'customer',
    isAdmin: userData?.user_type === 'admin',
  };

  // Debug logging with more details
  useEffect(() => {
    console.log('📊 UserContext State:', {
      userData: userData ? {
        hasData: true,
        email: userData.email,
        user_type: userData.user_type,
        _id: userData._id
      } : 'Null',
      userType: value.userType,
      loading,
      isAuthenticated,
      isProvider: value.isProvider,
      isCustomer: value.isCustomer,
      isAdmin: value.isAdmin
    });
  }, [userData, loading, isAuthenticated]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
