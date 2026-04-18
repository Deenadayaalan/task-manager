// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signOut, fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuthState = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      
      setUser({
        ...currentUser,
        tokens: session.tokens,
        credentials: session.credentials
      });
    } catch (err) {
      console.log('No authenticated user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      if (user) {
        setUser(prev => ({
          ...prev,
          tokens: session.tokens,
          credentials: session.credentials
        }));
      }
      return session;
    } catch (err) {
      console.error('Error refreshing session:', err);
      throw err;
    }
  };

  const getUserAttributes = () => {
    if (!user) return null;
    
    return {
      email: user.signInDetails?.loginId || user.username,
      given_name: user.attributes?.given_name,
      family_name: user.attributes?.family_name,
      email_verified: user.attributes?.email_verified
    };
  };

  const isTokenExpired = () => {
    if (!user?.tokens?.accessToken) return true;
    
    const expirationTime = user.tokens.accessToken.payload.exp * 1000;
    return Date.now() >= expirationTime;
  };

  useEffect(() => {
    checkAuthState();

    // Listen for auth events
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          console.log('User signed in');
          checkAuthState();
          break;
        case 'signedOut':
          console.log('User signed out');
          setUser(null);
          break;
        case 'tokenRefresh':
          console.log('Token refreshed');
          checkAuthState();
          break;
        case 'tokenRefresh_failure':
          console.log('Token refresh failed');
          setUser(null);
          break;
        default:
          break;
      }
    });

    return unsubscribe;
  }, []);

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!user || !user.tokens) return;

    const checkTokenExpiration = () => {
      if (isTokenExpired()) {
        refreshSession().catch(() => {
          handleSignOut();
        });
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signOut: handleSignOut,
    refreshSession,
    getUserAttributes,
    isTokenExpired,
    checkAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};