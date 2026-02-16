// frontend/src/components/LayoutComponents.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth, usePwaInstall } from '../context';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDownload, faEllipsisVertical, faTachometerAlt, 
  faLayerGroup, faNewspaper, faUser, faHome
} from '@fortawesome/free-solid-svg-icons';
import { faLinkedin, faYoutube, faInstagram } from '@fortawesome/free-brands-svg-icons';
import toast from 'react-hot-toast';
import { useRegisterSW } from 'virtual:pwa-register/react';

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
    <>
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
      {children}
    </>
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
    <header className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm border-b border-gray-100 transition-all duration-300">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-google-blue">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
              <span>Surya<span className="text-gray-800">Wave</span></span>
            </NavLink>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {installPrompt && <InstallButton />}
            
            <NavLink to="/services" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-google-blue bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>Services</NavLink>
            <NavLink to="/blog" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-google-blue bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>Blog</NavLink>
            {user ? (
              <>
                <NavLink to="/dashboard" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-google-blue bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>Dashboard</NavLink>
                {user.role === 'admin' && <NavLink to="/admin" className={({isActive}) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-red-600 bg-red-50' : 'text-gray-600 hover:bg-gray-50'}`}>Admin</NavLink>}
                <button onClick={logout} className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Logout</button>
              </>
            ) : (
              <NavLink to="/login" className="px-4 py-2 rounded-full text-sm font-bold text-white bg-google-blue hover:bg-blue-600 shadow-md transition-all hover:shadow-lg">Sign In</NavLink>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            {!user && (
              <NavLink to="/login" className="px-4 py-1.5 rounded-full text-sm font-bold text-white bg-google-blue hover:bg-blue-600 shadow-sm transition-all">
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
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none py-1 animate-enter z-50">
                  <DotsMenuItem to="/about">About Us</DotsMenuItem>
                  <DotsMenuItem to="/contact">Contact</DotsMenuItem>
                  <DotsMenuItem to="/privacy-policy">Privacy Policy</DotsMenuItem>
                  <DotsMenuItem to="/terms-of-service">Terms of Service</DotsMenuItem>
                  {user && (
                      <>
                        <div className="border-t my-1"></div>
                        <button
                          onClick={() => { logout(); setIsDotsMenuOpen(false); }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 font-medium"
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

// --- Bottom Navigation (MNC App Style) ---

export const BottomNav = () => {
  const { user } = useAuth();

  // Helper to construct MNC-style Nav Items
  const NavItem = ({ to, icon, label, exact = false }) => (
    <NavLink 
      to={to} 
      end={exact}
      className={({ isActive }) => 
        `flex flex-col items-center justify-center w-full py-1.5 transition-colors duration-200 ${isActive ? 'text-google-blue' : 'text-gray-500 hover:text-gray-700'}`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`mb-0.5 relative ${isActive ? '-mt-1' : ''} transition-all duration-300`}>
            <FontAwesomeIcon icon={icon} className={`text-xl ${isActive ? 'transform scale-110' : ''}`} />
          </div>
          <span className={`text-[10px] font-medium leading-none ${isActive ? 'font-bold' : ''}`}>{label}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white z-50 border-t border-gray-200 pb-safe-area shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-14">
        <NavItem to="/" icon={faHome} label="Home" exact />
        <NavItem to="/services" icon={faLayerGroup} label="Services" />
        {user && <NavItem to="/dashboard" icon={faTachometerAlt} label="My Space" />}
        <NavItem to="/blog" icon={faNewspaper} label="Blog" />
        <NavItem to={user ? "/profile" : "/login"} icon={faUser} label={user ? "Profile" : "Login"} />
      </div>
    </nav>
  );
};

// --- Footer ---

export const Footer = React.memo(() => (
    <footer className="bg-white border-t border-gray-100 hidden md:block mt-auto">
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <div className="flex space-x-8 mb-6">
            <a href="https://www.linkedin.com/company/suryawave" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-google-blue transition-colors transform hover:scale-110 duration-200" aria-label="LinkedIn">
              <FontAwesomeIcon icon={faLinkedin} size="2x" />
            </a>
            <a href="https://www.youtube.com/@Suryawave" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-google-red transition-colors transform hover:scale-110 duration-200" aria-label="YouTube">
              <FontAwesomeIcon icon={faYoutube} size="2x" />
            </a>
            <a href="https://www.instagram.com/suryawaveofficial" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors transform hover:scale-110 duration-200" aria-label="Instagram">
              <FontAwesomeIcon icon={faInstagram} size="2x" />
            </a>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm font-medium text-gray-500">
            <Link to="/about" className="hover:text-google-blue transition-colors">About</Link>
            <Link to="/contact" className="hover:text-google-blue transition-colors">Contact</Link>
            <Link to="/privacy-policy" className="hover:text-google-blue transition-colors">Privacy</Link>
            <Link to="/terms-of-service" className="hover:text-google-blue transition-colors">Terms</Link>
          </div>

          <div className="text-center text-xs text-gray-400 border-t border-gray-100 pt-6 w-full max-w-lg">
            <p className="mb-2">© {new Date().getFullYear()} Surya Wave. All rights reserved.</p>
            <p>Founded by Surya Nallamothu</p>
          </div>
        </div>
      </div>
    </footer>
));
Footer.displayName = 'Footer';