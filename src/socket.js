// frontend/src/socket.js
import { io } from 'socket.io-client';
import { safeGetLocalStorage } from './utils/storage';

const URL = import.meta.env.DEV 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5000')
  : 'https://suryawavebackend.vercel.app'; 

let socket;

export const initSocket = () => {
    if (socket) return socket;

    const token = safeGetLocalStorage('token');
    
    socket = io(URL, {
        autoConnect: false,
        auth: {
            token: token // Send JWT for authentication on socket connection
        },
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'] // Prefer WebSocket
    });

    return socket;
};

export const getSocket = () => {
    if (!socket) {
        return initSocket();
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};