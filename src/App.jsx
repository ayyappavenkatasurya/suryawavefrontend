// frontend/src/App.jsx

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Header, 
  Footer, 
  ProtectedRoute, 
  AdminRoute, 
  Spinner, 
  BottomNav, 
  PwaReloadPrompt 
} from './components';
import { onMessageListener, requestForToken } from './firebase.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faBell, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence, motion } from 'framer-motion';

import { useAuth } from './context.jsx';
import api from './services';

import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ServicesPage,
  ServiceDetailPage,
  AboutPage,
  ContactPage,
  PrivacyPolicyPage,
  TermsOfServicePage,
  UserDashboardPage,
  ProfilePage,
  PaymentPage,
  AdvancePaymentPage,
  FullPaymentPage,
  PaymentSuccessPage,
  ArticlesPage,
  ArticleDetailPage,
  AdminDashboardPage,
  NotFoundPage,
} from './pages';

// Animation wrapper for consistent page transitions
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="w-full"
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode='wait'>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><ServicesPage /></PageWrapper>} />
        <Route path="/services" element={<PageWrapper><ServicesPage /></PageWrapper>} />
        <Route path="/services/:slug" element={<PageWrapper><ServiceDetailPage /></PageWrapper>} />
        <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
        <Route path="/contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
        <Route path="/privacy-policy" element={<PageWrapper><PrivacyPolicyPage /></PageWrapper>} />
        <Route path="/terms-of-service" element={<PageWrapper><TermsOfServicePage /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
        <Route path="/forgot-password" element={<PageWrapper><ForgotPasswordPage /></PageWrapper>} />
        <Route path="/reset-password" element={<PageWrapper><ResetPasswordPage /></PageWrapper>} />
        <Route path="/blog" element={<PageWrapper><ArticlesPage /></PageWrapper>} />
        <Route path="/blog/:slug" element={<PageWrapper><ArticleDetailPage /></PageWrapper>} />
        
        <Route path="/dashboard" element={<ProtectedRoute><PageWrapper><UserDashboardPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageWrapper><ProfilePage /></PageWrapper></ProtectedRoute>} />
        <Route path="/payment/:id" element={<ProtectedRoute><PageWrapper><PaymentPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/request-advance-payment/:id" element={<ProtectedRoute><PageWrapper><AdvancePaymentPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/request-full-payment/:id" element={<ProtectedRoute><PageWrapper><FullPaymentPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/payment-success" element={<ProtectedRoute><PageWrapper><PaymentSuccessPage /></PageWrapper></ProtectedRoute>} />
        
        <Route path="/admin" element={<AdminRoute><PageWrapper><AdminDashboardPage /></PageWrapper></AdminRoute>} />
        
        <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const { user } = useAuth();

  // ✅ Splash Screen Logic using direct DOM manipulation
  useEffect(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      // Start fading out after 2 seconds
      setTimeout(() => {
        splash.classList.add('splash-fade-out');
        
        // After fade-out animation is complete (500ms), remove from DOM
        setTimeout(() => {
          splash.remove();
        }, 500);
      }, 2000); 
    }
  }, []);
  
  // Handle foreground notification messages
  useEffect(() => {
    const notificationHandler = (payload) => {
      const { title, body, icon, url, image, actions: actionsString } = payload.data;
      
      let actions = [];
      try {
          if (actionsString && typeof actionsString === 'string' && actionsString !== "[]") {
              actions = JSON.parse(actionsString);
          }
      } catch (e) {
          console.warn("Failed to parse notification actions", e);
      }

      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden`}
          >
            {image && (
              <img 
                src={image}
                alt={title || ''}
                className="w-full h-32 object-cover cursor-pointer"
                onClick={() => {
                  if (url) window.open(url, '_blank', 'noopener,noreferrer');
                  toast.dismiss(t.id);
                }}
              />
            )}
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <img
                    className="h-10 w-10 rounded-full"
                    src={icon || '/logo.png'}
                    alt=""
                  />
                </div>
                <div className="ml-3 flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 cursor-pointer" onClick={() => { if (url) window.open(url, '_blank', 'noopener,noreferrer'); toast.dismiss(t.id); }}>
                    {title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 cursor-pointer" onClick={() => { if (url) window.open(url, '_blank', 'noopener,noreferrer'); toast.dismiss(t.id); }}>
                    {body}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="sr-only">Close</span>
                    <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            {Array.isArray(actions) && actions.length > 0 && (
              <div className="flex border-t border-gray-200">
                {actions.map((action) => (
                  <button
                    key={action.action}
                    onClick={() => {
                      if (action.url) window.open(action.url, '_blank', 'noopener,noreferrer');
                      toast.dismiss(t.id);
                    }}
                    className="flex-1 w-full border-r last:border-r-0 border-gray-200 p-3 flex items-center justify-center text-sm font-medium text-google-blue hover:bg-gray-50 focus:outline-none"
                  >
                    {action.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ),
        // ✅ FIXED: Reduced duration from 10s to 5s to feel more like a native app notification
        { duration: 5000, position: 'top-right' }
      );
    };

    const unsubscribe = onMessageListener(notificationHandler);
    return () => unsubscribe();
  }, []);

  // Handle notification permission prompt
  useEffect(() => {
    if (!user) return;

    if ('Notification' in window && Notification.permission === 'default') {
      const toastId = toast.custom(
        (t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg p-4 ring-1 ring-black ring-opacity-5 text-left flex items-start gap-3`}>
             <div className="flex-shrink-0 pt-1">
                <FontAwesomeIcon icon={faBell} className="text-google-blue text-xl" />
             </div>
             <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Enable Notifications?</p>
                <p className="mt-1 text-sm text-gray-500">Get real-time updates on your orders and project requests.</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                        toast.dismiss(t.id);
                        requestForToken().then(token => {
                            if (token) {
                                api.post('/api/notifications/subscribe', { token }).catch(err => console.warn("Silent sub fail", err));
                                
                                // ✅ FIXED: Intelligent Custom Toast for Mobile
                                // We use a custom component with onClick dismiss to prevent it from getting stuck due to mobile hover/touch behavior.
                                toast.custom((tt) => (
                                  <div 
                                    onClick={() => toast.dismiss(tt.id)}
                                    className={`${tt.visible ? 'animate-enter' : 'animate-leave'} 
                                      max-w-xs w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 
                                      flex items-center p-4 cursor-pointer transform transition-all duration-300`}
                                  >
                                    <div className="flex-shrink-0">
                                      <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-2xl" />
                                    </div>
                                    <div className="ml-3 flex-1 pt-0.5">
                                      <p className="text-sm font-medium text-gray-900">Notifications Enabled!</p>
                                    </div>
                                  </div>
                                ), { duration: 3000, position: 'top-center' });
                            }
                        });
                    }}
                    className="inline-flex justify-center rounded-md border border-transparent bg-google-blue px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    Allow
                  </button>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    Later
                  </button>
                </div>
             </div>
          </div>
        ), 
        { duration: Infinity, position: 'top-center' } 
      );
      
      return () => toast.dismiss(toastId);
    }
  }, [user]);

  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />
      <PwaReloadPrompt />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow pb-20 md:pb-0">
          <Suspense fallback={<Spinner />}>
            <AnimatedRoutes />
          </Suspense>
        </main>
        <Footer />
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;