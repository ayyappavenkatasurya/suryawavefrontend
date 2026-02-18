// frontend/src/context.jsx

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from './services';
import { safeGetLocalStorage, safeSetLocalStorage, safeRemoveLocalStorage } from './utils/storage';
import { unsubscribeCurrentToken, getCurrentToken } from './firebase.jsx';
import { initSocket, disconnectSocket, getSocket } from './socket.js';

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
        
        // ✅ SMART: Connect Socket when user is confirmed
        const socket = initSocket();
        socket.auth = { token };
        socket.connect();

      } catch (error) {
        console.error("Failed to fetch user profile", error);
        if (error.response && error.response.status === 401) {
            safeRemoveLocalStorage('token');
            setToken(null);
            setUser(null);
            disconnectSocket();
        }
      }
    } else {
        setUser(null);
        disconnectSocket();
    }
    setLoading(false);
  }, [token]);

  // Initial fetch on mount or token change
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);
  
  // Sync FCM Token for Notifications
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
    
    // ✅ SMART: Connect Socket immediately on login
    const socket = initSocket();
    socket.auth = { token: userToken };
    socket.connect();

  }, []);

  const logout = useCallback(async () => {
    const tokenToInvalidate = token;
    try {
      await unsubscribeCurrentToken(tokenToInvalidate);
    } catch (error) {
        console.error('Failed to unsubscribe FCM token during logout:', error);
    } finally {
      safeRemoveLocalStorage('token');
      setToken(null);
      setUser(null);
      disconnectSocket(); // ✅ SMART: Disconnect socket
    }
  }, [token]);
  
  // Handle 401 events
  useEffect(() => {
    const handleAuthError = () => {
      console.warn('Authentication error detected. Logging out.');
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