// frontend/src/components.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useAuth, usePwaInstall } from './context';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, faShareNodes, faSpinner, faTools, faWallet, faTag, faCheckCircle, 
  faClock, faEllipsisVertical, faUser, faNewspaper, faLayerGroup, faTachometerAlt, faDownload, faFolderOpen,
  faChevronDown, faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';
import { faLinkedin, faYoutube, faInstagram } from '@fortawesome/free-brands-svg-icons';
import toast from 'react-hot-toast'; 
import QRCode from "react-qr-code"; 
import { useRegisterSW } from 'virtual:pwa-register/react';
import { LazyImage } from './components/LazyImage';

// ... [Keep SkeletonPulse, ServiceCardSkeleton, ArticleCardSkeleton, DashboardItemSkeleton unchanged] ...
export const SkeletonPulse = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

export const ServiceCardSkeleton = () => (
  <div className="border rounded-lg overflow-hidden shadow-sm bg-white flex flex-col h-full">
    <SkeletonPulse className="w-full h-48" />
    <div className="p-4 md:p-6 flex flex-col flex-grow space-y-4">
      <SkeletonPulse className="h-6 w-3/4" />
      <SkeletonPulse className="h-4 w-1/2" />
      <div className="space-y-2 flex-grow">
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-2/3" />
      </div>
      <div className="pt-4 border-t flex justify-between items-center">
        <SkeletonPulse className="h-8 w-24" />
        <SkeletonPulse className="h-10 w-32" />
      </div>
    </div>
  </div>
);

export const ArticleCardSkeleton = () => (
  <div className="border rounded-lg overflow-hidden shadow-sm bg-white flex flex-col h-full">
    <SkeletonPulse className="w-full h-48" />
    <div className="p-6 flex flex-col flex-grow space-y-4">
      <SkeletonPulse className="h-6 w-full" />
      <SkeletonPulse className="h-4 w-1/3" />
      <div className="space-y-2 flex-grow">
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-5/6" />
        <SkeletonPulse className="h-4 w-4/6" />
      </div>
      <div className="pt-4 border-t">
        <SkeletonPulse className="h-4 w-24" />
      </div>
    </div>
  </div>
);

export const DashboardItemSkeleton = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-row gap-4 animate-pulse">
        <div className="w-24 h-24 bg-gray-200 rounded-md flex-shrink-0"></div>
        <div className="flex-grow space-y-3 py-1">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
    </div>
);

// ... [Keep PwaReloadPrompt unchanged] ...
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

// ========== SEO COMPONENT (UPDATED FOR INDEXING) ==========
export const SEO = ({ title, description, keywords, image, path, children }) => {
  // Primary domain for Canonical URLs (Best for SEO to avoid duplicates)
  const primaryUrl = 'https://suryawave.me';
  
  // Current Origin for OG Image generation if relative
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : primaryUrl;

  // ✅ FIXED: Remove trailing slash from path to avoid "Page with redirect" errors
  const cleanPath = path === '/' ? '' : path.replace(/\/$/, '');
  const canonicalUrl = `${primaryUrl}${cleanPath}`;
  
  // Robust image URL handling
  const imageUrl = image 
    ? (image.startsWith('http') ? image : `${currentOrigin}${image}`) 
    : `${currentOrigin}/og-image.png`;

  return (
    <>
      <title>{`${title} | Surya Wave`}</title>
      <meta name='description' content={description} />
      <meta name='keywords' content={`Surya Wave, Surya Nallamothu, GATE 2026, Final Year Projects, ${keywords}`} />
      
      {/* Canonical always points to primary domain without trailing slash */}
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

// ... [Rest of components.jsx remains unchanged] ...
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
  
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

export const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  return user && user.role === 'admin' ? children : <Navigate to="/" state={{ from: location }} replace />;
};

export const Spinner = () => (
  <div className="flex justify-center items-center h-full min-h-[300px]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-google-blue"></div>
  </div>
);

export const CountdownTimer = React.memo(({ endDate }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(endDate) - +new Date();
        if (difference <= 0) return null;
        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [endDate]);

    if (!timeLeft) {
        return <span className="text-sm font-semibold text-red-600 animate-pulse">Offer has ended!</span>;
    }

    const { days, hours, minutes, seconds } = timeLeft;
    const parts = [];

    if (days > 0) {
        parts.push(<span key="d"><span className="font-bold">{days}</span>d</span>);
        parts.push(<span key="h"><span className="font-bold">{String(hours).padStart(2, '0')}</span>h</span>);
    } else if (hours > 0) {
        parts.push(<span key="h"><span className="font-bold">{String(hours).padStart(2, '0')}</span>h</span>);
        parts.push(<span key="m"><span className="font-bold">{String(minutes).padStart(2, '0')}</span>m</span>);
    } 
    
    parts.push(<span key="s"><span className="font-bold">{String(seconds).padStart(2, '0')}</span>s</span>);
    
    return (
        <div className="flex items-center gap-2 text-sm font-medium text-red-600">
            <FontAwesomeIcon icon={faClock} />
            <div className="flex items-baseline gap-1.5 tabular-nums">
                <span>Ends in:</span>
                {parts.map((part, index) => (
                    <React.Fragment key={index}>{part}</React.Fragment>
                ))}
            </div>
        </div>
    );
});
CountdownTimer.displayName = 'CountdownTimer';

export const PeopleAlsoAsk = React.memo(({ faqs }) => {
  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto py-12 text-left px-4 sm:px-6 lg:px-0">
      <h2 className="text-2xl font-bold text-center mb-8 text-gray-800 flex items-center justify-center gap-2">
        <FontAwesomeIcon icon={faQuestionCircle} className="text-google-blue" />
        People Also Ask
      </h2>
      <div className="space-y-4">
        {faqs.map((qa) => (
          <details key={qa._id} className="group bg-white p-4 border rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-all duration-200">
            <summary className="flex justify-between items-center font-semibold text-gray-800 list-none select-none">
              <span>{qa.question}</span>
              <FontAwesomeIcon icon={faChevronDown} className="text-gray-500 transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <div 
              className="mt-4 text-gray-600 prose prose-sm max-w-none animate-fadeIn" 
              dangerouslySetInnerHTML={{ __html: qa.answer }} 
            />
          </details>
        ))}
      </div>
    </div>
  );
});
PeopleAlsoAsk.displayName = 'PeopleAlsoAsk';

export const ServiceCard = React.memo(({ service }) => {
  const hasOffer = service.price !== service.currentPrice;
  const isFree = service.currentPrice === 0;
  const [isSharing, setIsSharing] = useState(false);

  const handleShareClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSharing(true);
    
    const shareData = {
        title: service.title,
        text: service.description,
        url: `${window.location.origin}/services/${service.slug}`,
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(shareData.url);
            toast.success('Link copied to clipboard!');
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Share failed:', error);
            toast.error('Could not share or copy link.');
        }
    } finally {
        setIsSharing(false);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-md bg-white flex flex-col relative group h-full transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
      <button onClick={handleShareClick} disabled={isSharing} className="absolute top-3 right-3 z-10 bg-blue-600 text-white rounded-full h-9 w-9 flex items-center justify-center transition-colors duration-300 ease-in-out hover:bg-blue-700 disabled:bg-gray-400" aria-label="Share Service" title="Share Service">
        {isSharing ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faShareNodes} />}
      </button>

      {/* ✅ FIXED: The main link now wraps only non-interactive content */}
      <Link to={`/services/${service.slug}`} className="flex flex-col flex-grow">
        <div className="relative h-48">
          <LazyImage src={service.imageUrl} alt={service.title} className="w-full h-full" />
          {hasOffer && service.offer.name && !isFree && (
            <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <FontAwesomeIcon icon={faTag} /><span>{service.offer.name}</span>
            </div>
          )}
          {isFree && (
            <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <FontAwesomeIcon icon={faTag} /><span>FREE</span>
            </div>
          )}
        </div>
        <div className="p-4 md:p-6 flex flex-col flex-grow">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-google-blue transition-colors">{service.title}</h3>
          <div className="flex items-center text-xs text-gray-500 mb-3"><FontAwesomeIcon icon={faCalendarAlt} className="mr-2" /><span>Posted on: {new Date(service.createdAt).toLocaleDateString()}</span></div>
          <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">{service.description}</p>
        </div>
      </Link>
      
      {/* Interactive elements are now separate from the main link */}
      <div className="p-4 md:p-6 pt-0 mt-auto">
        {hasOffer && !isFree && (
            <div className="my-3">
                <CountdownTimer endDate={service.offer.endDate} />
            </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          {(service.price > 0 || service.serviceType === 'standard') ? (
            <div className="flex items-baseline gap-2">
              {isFree ? (
                  <span className="text-2xl font-bold text-purple-600">Free</span>
              ) : (
                  <>
                    <span className={`text-2xl font-bold ${hasOffer ? 'text-green-600' : 'text-gray-900'}`}>₹{service.currentPrice}</span>
                    {hasOffer && (<span className="text-lg font-medium text-gray-500 line-through">₹{service.price}</span>)}
                  </>
              )}
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-900 flex items-center gap-2"><FontAwesomeIcon icon={faTools} className="text-google-yellow" /> Custom Project</span>
          )}
          <NavLink to={`/services/${service.slug}`} className="px-4 py-2 md:px-6 bg-google-blue text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
            {isFree ? 'Access Now' : 'Get Started'}
          </NavLink>
        </div>
      </div>
    </div>
  );
});
ServiceCard.displayName = 'ServiceCard';

export const ArticleCard = React.memo(({ article }) => {
  return (
    <Link to={`/blog/${article.slug}`} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white flex flex-col group h-full hover:-translate-y-1">
      <div className="relative h-48">
        <LazyImage src={article.featuredImage} alt={article.title} className="w-full h-full" />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-google-blue transition-colors line-clamp-2">{article.title}</h3>
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
          <span>Published on: {new Date(article.createdAt).toLocaleDateString()}</span>
        </div>
        <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">{article.excerpt}</p>
        <div className="mt-auto pt-4 border-t">
            <span className="font-semibold text-google-blue">Read More &rarr;</span>
        </div>
      </div>
    </Link>
  );
});
ArticleCard.displayName = 'ArticleCard';

export const ServiceContentModal = ({ service, isOpen, onClose }) => {
    if (!isOpen || !service) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-enter" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative transform transition-all" onClick={e => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
          <h3 className="text-2xl font-bold mb-4 pr-6">{service.title} - Resources</h3>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {(service.contentUrls ?? []).map((content, index) => (
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                key={index}
                className="block w-full p-3 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-google-blue font-medium break-all flex items-center gap-3"
              >
                <FontAwesomeIcon icon={faFolderOpen} />
                {content.name || `Resource ${index + 1}`}
              </a>
            ))}
          </div>
        </div>
      </div>
    );
};
  
export const PaymentComponent = React.memo(({ title, description, amount, upiId, upiName, upiNote, onSubmit, loading }) => {
    const [transactionId, setTransactionId] = useState('');
    const [upiLink, setUpiLink] = useState('');
    
    useEffect(() => {
        const params = new URLSearchParams({
            pa: upiId,
            pn: upiName,
            am: amount,
            cu: 'INR',
            tr: upiNote, 
            tn: `Payment for ${upiNote}`,
        });
        setUpiLink(`upi://pay?${params.toString()}`);
    }, [amount, upiId, upiName, upiNote]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!transactionId.trim()) {
            return toast.error("Please enter the Transaction ID.");
        }
        onSubmit(transactionId);
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-lg border">
            <h1 className="text-2xl font-bold text-center mb-2">{title}</h1>
            <p className="text-center text-gray-600 mb-6">{description}</p>
            
            <div className="text-center p-6 bg-gray-50 rounded-lg">
                <p className="mb-4 font-medium text-gray-700">
                    Scan and Pay with your UPI App
                </p>
                <div className="flex justify-center items-center mb-4 w-full h-[200px]">
                    {upiLink ? (
                        <QRCode value={upiLink} size={200} className="h-full w-auto max-w-full" />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-500">
                            <FontAwesomeIcon icon={faSpinner} spin size="3x" />
                            <p className="mt-4 text-sm">Generating Secure QR Code...</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8">
                <h2 className="font-semibold text-lg text-center mb-4">Please submit your UPI Reference ID</h2>
                <form onSubmit={handleSubmit}>
                    <label className="block text-sm font-medium text-gray-700">UTR Reference ID</label>
                    <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-google-blue focus:border-google-blue" placeholder="e.g., 238916381623" />
                    <p className="text-xs text-gray-500 mt-2">Verification may take up to 20 minutes. You will be notified via email upon confirmation.</p>
                    <button type="submit" disabled={loading} className="w-full mt-4 flex justify-center py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-green-400 transition-colors">
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Submit for Verification'}
                    </button>
                </form>
            </div>
        </div>
    );
});
PaymentComponent.displayName = 'PaymentComponent';