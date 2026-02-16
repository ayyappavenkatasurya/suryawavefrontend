// frontend/src/components/LayoutComponents.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth, usePwaInstall } from '../context';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, faEllipsisVertical, faTachometerAlt, 
  faLayerGroup, faNewspaper, faUser 
} from '@fortawesome/free-solid-svg-icons';
import { faLinkedin, faYoutube, faInstagram } from '@fortawesome/free-brands-svg-icons';
import toast from 'react-hot-toast';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Helmet } from 'react-helmet-async'; // ✅ ADDED HELMET IMPORT

// --- PWA Reload Prompt ---

export const PwaReloadPrompt = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (r?.waiting) {
        setNeedRefresh(true);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      const toastId = toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg p-4 ring-1 ring-black ring-opacity-5 text-left`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">A new version is available!</p>
              <p className="mt-1 text-sm text-gray-500">
                Reload the app to get the latest features and fixes.
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  updateServiceWorker(true);
                  toast.dismiss(toastId);
                }}
                className="flex-1 inline-flex justify-center items-center gap-2 rounded-md border border-transparent bg-google-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                <FontAwesomeIcon icon={faDownload} />
                Update
              </button>
              <button
                onClick={() => {
                  setNeedRefresh(false);
                  toast.dismiss(toastId);
                }}
                className="flex-1 inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Not Now
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity, 
          position: 'bottom-center'
        }
      );

      return () => toast.dismiss(toastId);
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
};

// --- SEO Component ---

export const SEO = ({ title, description, keywords, image, path, children }) => {
  const primaryUrl = 'https://suryawave.me';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : primaryUrl;
  const cleanPath = path === '/' ? '' : path.replace(/\/$/, '');
  const canonicalUrl = `${primaryUrl}${cleanPath}`;
  
  const imageUrl = image 
    ? (image.startsWith('http') ? image : `${currentOrigin}${image}`) 
    : `${currentOrigin}/og-image.png`;

  return (
    <Helmet> {/* ✅ CHANGED FROM FRAGMENT TO HELMET */}
      <title>{`${title} | Surya Wave`}</title>
      <meta name='description' content={description} />
      <meta name='keywords' content={`Surya Wave, Surya Nallamothu, GATE 2026, Final Year Projects, ${keywords}`} />
      <link rel="canonical" href={canonicalUrl} />
      
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={`${title} | Surya Wave`} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={`${title} | Surya Wave`} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      
      {/* This ensures JSON-LD scripts are also moved to head */}
      {children}
    </Helmet>
  );
};

// --- Header ---

export const Header = React.memo(() => {
  const { user, logout } = useAuth();
  const { installPrompt, triggerInstall } = usePwaInstall();
  const [isDotsMenuOpen, setIsDotsMenuOpen] = useState(false);
  const dotsMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dotsMenuRef.current && !dotsMenuRef.current.contains(event.target)) {
        setIsDotsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const DotsMenuItem = ({ to, children }) => (
    <NavLink
      to={to}
      onClick={() => setIsDotsMenuOpen(false)}
      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
    >
      {children}
    </NavLink>
  );

  const InstallButton = ({ isMobile = false }) => (
    <button
      onClick={triggerInstall}
      title="Install Surya Wave App"
      className={isMobile
        ? "p-2 text-gray-600 rounded-md hover:bg-gray-100 active:bg-gray-200 focus:outline-none"
        : "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
      }
    >
      <FontAwesomeIcon icon={faDownload} className={isMobile ? "h-6 w-6" : "h-4 w-4"} />
      {!isMobile && "Install App"}
    </button>
  );

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm transition-all duration-300">
      <nav className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <NavLink to="/" className="flex items-center gap-2 text-2xl font-bold text-google-blue">
              <span>Surya<span className="text-gray-800">wave</span></span>
            </NavLink>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {installPrompt && <InstallButton />}
            
            <NavLink to="/services" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>Services</NavLink>
            <NavLink to="/blog" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>Blog</NavLink>
            {user ? (
              <>
                <NavLink to="/dashboard" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>Dashboard</NavLink>
                {user.role === 'admin' && <NavLink to="/admin" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-gray-100 text-google-red' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>Admin</NavLink>}
                <button onClick={logout} className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">Logout</button>
              </>
            ) : (
              <NavLink to="/login" className="px-4 py-2 rounded-md text-sm font-medium text-white bg-google-blue hover:bg-blue-600 transition-colors">Sign In</NavLink>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            {!user && (
              <NavLink to="/login" className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-google-blue hover:bg-blue-600 transition-colors">
                Sign In
              </NavLink>
            )}
            
            {installPrompt && <InstallButton isMobile={true} />}

            <div className="relative" ref={dotsMenuRef}>
              <button 
                onClick={() => setIsDotsMenuOpen(!isDotsMenuOpen)} 
                className="p-2 text-gray-600 rounded-md hover:bg-gray-100 active:bg-gray-200 focus:outline-none"
                aria-label="Open menu"
              >
                <FontAwesomeIcon icon={faEllipsisVertical} className="h-6 w-6" />
              </button>
              {isDotsMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none py-1 animate-enter">
                  <DotsMenuItem to="/about">About Us</DotsMenuItem>
                  <DotsMenuItem to="/contact">Contact</DotsMenuItem>
                  <DotsMenuItem to="/privacy-policy">Privacy Policy</DotsMenuItem>
                  <DotsMenuItem to="/terms-of-service">Terms of Service</DotsMenuItem>
                  {user && (
                      <>
                        <div className="border-t my-1"></div>
                        <button
                          onClick={() => { logout(); setIsDotsMenuOpen(false); }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
});
Header.displayName = 'Header';

// --- Bottom Navigation ---

export const BottomNav = () => {
  const { user } = useAuth();

  const getInitials = (email) => {
    if (!email) return '';
    return email.substring(0, 2).toUpperCase();
  };

  const NavItem = ({ to, icon, label }) => (
    <NavLink 
      to={to} 
      className="flex flex-col items-center justify-center w-full py-1 text-xs"
    >
      {({ isActive }) => (
        <>
          <div className={`flex items-center justify-center h-8 w-16 rounded-full transition-all duration-200 ease-in-out active:scale-90 ${isActive ? 'bg-blue-100' : 'bg-transparent'}`}>
            <FontAwesomeIcon icon={icon} size="lg" className={`transition-colors ${isActive ? 'text-google-blue' : 'text-gray-500'}`}/>
          </div>
          <span className={`mt-1 transition-colors ${isActive ? 'text-gray-900 font-bold' : 'text-gray-500 font-medium'}`}>{label}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white z-40 flex justify-around items-center h-20 px-1 border-t pb-safe-area">
      <NavItem to="/dashboard" icon={faTachometerAlt} label="Dashboard" />
      <NavItem to="/services" icon={faLayerGroup} label="Services" />
      <NavItem to="/blog" icon={faNewspaper} label="Blog" />
      <NavLink 
        to={user ? "/profile" : "/login"}
        className="flex flex-col items-center justify-center w-full py-1 text-xs"
      >
        {({ isActive }) => (
          <>
            <div className={`flex items-center justify-center h-8 w-16 rounded-full transition-all duration-200 ease-in-out active:scale-90 ${isActive ? 'bg-blue-100' : 'bg-transparent'}`}>
              {user ? (
                <div className="h-7 w-7 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {getInitials(user.email)}
                </div>
              ) : (
                <FontAwesomeIcon icon={faUser} size="lg" className={`transition-colors ${isActive ? 'text-google-blue' : 'text-gray-500'}`} />
              )}
            </div>
            <span className={`mt-1 transition-colors ${isActive ? 'text-gray-900 font-bold' : 'text-gray-500 font-medium'}`}>Profile</span>
          </>
        )}
      </NavLink>
    </nav>
  );
};

// --- Footer ---

export const Footer = React.memo(() => (
    <footer className="bg-white border-t hidden md:block">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center space-x-6 mb-4">
          <a href="https://www.linkedin.com/company/suryawave" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-google-blue transition-colors" aria-label="LinkedIn">
            <FontAwesomeIcon icon={faLinkedin} size="2x" />
          </a>
          <a href="https://www.youtube.com/@Suryawave" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-google-red transition-colors" aria-label="YouTube">
            <FontAwesomeIcon icon={faYoutube} size="2x" />
          </a>
          <a href="https://www.instagram.com/suryawaveofficial" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-500 transition-colors" aria-label="Instagram">
            <FontAwesomeIcon icon={faInstagram} size="2x" />
          </a>
        </div>
        <div className="flex justify-center items-center flex-wrap gap-x-4 gap-y-2 mb-4 text-sm text-gray-600">
          <Link to="/about" className="hover:text-google-blue hover:underline">About Us</Link>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <Link to="/contact" className="hover:text-google-blue hover:underline">Contact</Link>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <Link to="/privacy-policy" className="hover:text-google-blue hover:underline">Privacy Policy</Link>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <Link to="/terms-of-service" className="hover:text-google-blue hover:underline">Terms of Service</Link>
        </div>
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Surya Wave. All rights reserved. Founded by Surya Nallamothu.
        </p>
      </div>
    </footer>
));
Footer.displayName = 'Footer';