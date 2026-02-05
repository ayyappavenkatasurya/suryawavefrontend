// frontend/src/firebase.jsx

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  setPersistence, 
  browserLocalPersistence 
} from 'firebase/auth'; 
import api from './services'; 
import toast from 'react-hot-toast';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app, auth, messaging, googleProvider;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Ensure auth state persists
    setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.error("Firebase persistence error:", error);
    });

    googleProvider = new GoogleAuthProvider();
    
    // Only initialize Messaging in a browser environment that supports Service Workers
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
        try {
            messaging = getMessaging(app);
        } catch (messagingError) {
            console.warn("Firebase Messaging failed to initialize:", messagingError.message);
        }
    }
} catch (error) {
    console.warn("Firebase initialization warning:", error.message);
}

export { 
  auth, 
  messaging, 
  googleProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult 
};

// ==========================================
// Helper Functions for Notifications
// ==========================================

export const getCurrentToken = async () => {
    if (!messaging || !('serviceWorker' in navigator)) return null;
    try {
        const registration = await navigator.serviceWorker.ready;
        const currentToken = await getToken(messaging, { 
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration 
        });
        return currentToken;
    } catch (err) {
        console.warn('Unable to retrieve token:', err);
        return null;
    }
}

export const requestForToken = async () => {
  if (!messaging) {
      console.warn("Notifications are not supported in this browser mode.");
      return null;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getCurrentToken();
      if(token) {
          // Sync token with backend immediately
          await api.post('/api/notifications/subscribe', { token });
          return token;
      }
    }
    return null;
  } catch (err) {
    console.error('Error requesting permission:', err);
    return null;
  }
};

export const onMessageListener = (callback) => {
  if (!messaging) return () => {}; 
  return onMessage(messaging, (payload) => {
    console.log('Foreground message received.', payload);
    callback(payload);
  });
};

export const unsubscribeCurrentToken = async (authToken) => {
    if (!messaging) return false;
    try {
        const currentToken = await getCurrentToken();
        if (currentToken) {
            const config = {};
            if (authToken) config.headers = { Authorization: `Bearer ${authToken}` };
            await api.post('/api/notifications/unsubscribe', { token: currentToken }, config);
            await deleteToken(messaging);
            if (!authToken) toast.success('Notifications Disabled!');
            return true;
        }
        return true;
    } catch (error) {
        console.error('Error unsubscribing:', error);
        return false;
    }
}