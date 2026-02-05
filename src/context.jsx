// frontend/src/context.jsx

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from './services';
import { safeGetLocalStorage, safeSetLocalStorage, safeRemoveLocalStorage } from './utils/storage';
import { unsubscribeCurrentToken, getCurrentToken } from './firebase.jsx';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => safeGetLocalStorage('token'));
  const [loading, setLoading] = useState(true);

  // ✅ ROBUST: Fetch user profile using the stored token
  const fetchUser = useCallback(async () => {
    if (token) {
      try {
        const { data } = await api.get('/api/auth/profile');
        setUser(data);
      } catch (error) {
        console.error("Failed to fetch user profile", error);
        // Only logout if explicit 401 Unauthorized (invalid token)
        if (error.response && error.response.status === 401) {
            safeRemoveLocalStorage('token');
            setToken(null);
            setUser(null);
        }
      }
    } else {
        setUser(null);
    }
    setLoading(false);
  }, [token]);

  // Initial fetch on mount or token change
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);
  
  // Sync FCM Token for Notifications (Works on both domains independently)
  useEffect(() => {
    const syncFcmToken = async () => {
      if ('Notification' in window && 'serviceWorker' in navigator && Notification.permission === 'granted') {
          try {
            const currentToken = await getCurrentToken();
            if (currentToken) {
              await api.post('/api/notifications/subscribe', { token: currentToken });
            }
          } catch (error) {
            console.error('Error syncing FCM token on app load:', error);
          }
      }
    };

    if (user) {
      syncFcmToken();
    }
  }, [user?._id]); 
  
  const login = useCallback((userData, userToken) => {
    safeSetLocalStorage('token', userToken);
    setToken(userToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    const tokenToInvalidate = token;
    // Attempt to unsubscribe FCM token to keep DB clean
    try {
      await unsubscribeCurrentToken(tokenToInvalidate);
    } catch (error) {
        console.error('Failed to unsubscribe FCM token during logout, but proceeding with logout:', error);
    } finally {
      safeRemoveLocalStorage('token');
      setToken(null);
      setUser(null);
    }
  }, [token]);
  
  // Handle 401 events triggered by services.js
  useEffect(() => {
    const handleAuthError = () => {
      console.warn('Authentication error detected (e.g., session expired). Logging out.');
      logout();
    };

    window.addEventListener('auth-error', handleAuthError);

    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, [logout]);

  const updateUser = useCallback((updatedUserData) => {
    setUser(prevUser => ({...prevUser, ...updatedUserData}));
  }, []);

  const value = { user, token, loading, login, logout, updateUser, refreshUser: fetchUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// ... (PwaInstallContext remains unchanged below)
const PwaInstallContext = createContext(null);

export const PwaInstallProvider = ({ children }) => {
    const [installPrompt, setInstallPrompt] = useState(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        };

        const handleAppInstalled = () => {
            setInstallPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const triggerInstall = useCallback(async () => {
        if (!installPrompt) return;
        
        await installPrompt.prompt();
        setInstallPrompt(null);
    }, [installPrompt]);

    const value = { installPrompt, triggerInstall };

    return (
        <PwaInstallContext.Provider value={value}>
            {children}
        </PwaInstallContext.Provider>
    );
};

export const usePwaInstall = () => useContext(PwaInstallContext);