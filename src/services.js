// frontend/src/services.js

import axios from 'axios';
import toast from 'react-hot-toast';
import { safeGetLocalStorage } from './utils/storage';

// ✅ UPDATE: Automatically select the backend.
// 1. If running locally (npm run dev), use http://localhost:5000
// 2. If running on ANY production domain (.me or .vercel.app), use the live backend.
const API_URL = import.meta.env.DEV 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5000')
  : 'https://suryawavebackend.vercel.app'; 

const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  (config) => {
    const token = safeGetLocalStorage('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for centralized error handling
api.interceptors.response.use(
  (response) => response, 
  (error) => {
    // Check if the error is a cancellation
    if (axios.isCancel(error)) {
      console.log('Request canceled:', error.message);
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized errors (Session expired)
    if (error.response?.status === 401) {
      // Don't trigger redirect loop on login page
      if (!window.location.pathname.includes('/login')) {
        window.dispatchEvent(new Event('auth-error'));
      }
      return Promise.reject(error);
    }
    
    // Extract a user-friendly error message
    const errorData = error.response?.data;
    let message = 'An unexpected error occurred. Please try again.';

    if (errorData) {
      if (errorData.message) {
        message = errorData.message;
      } else if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        message = errorData.errors[0].msg; 
      }
    } else if (!error.response) {
      message = 'Network error. Please check your connection.';
    }
    
    // Show toast for errors (except 404s usually handled by UI)
    if (error.response?.status !== 404) {
        toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;