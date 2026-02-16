// frontend/src/components/ContentComponents.jsx

import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock, faQuestionCircle, faChevronDown, faShareNodes, faSpinner, faTag, faTools, 
  faCalendarAlt, faFolderOpen, faExternalLinkAlt, faTimes, faFire
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import QRCode from "react-qr-code";
import { LazyImage } from './LazyImage';

// --- Countdown Timer ---

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

// --- People Also Ask (FAQ) ---

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

// --- Service Card ---

export const ServiceCard = React.memo(({ service }) => {
  const hasOffer = service.price !== service.currentPrice;
  const isFree = service.currentPrice === 0;
  const [isSharing, setIsSharing] = useState(false);

  // ✅ FEATURE: Format Order Count "10+"
  const formatOrderCount = (count) => {
    if (!count || count < 5) return null;
    if (count < 10) return "5+ bought";
    if (count < 50) return "10+ bought";
    if (count < 100) return "50+ bought";
    if (count < 500) return "100+ bought";
    if (count < 1000) return "500+ bought";
    return "1k+ bought";
  };

  const orderBadge = formatOrderCount(service.orderCount);

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
    <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white flex flex-col relative group h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <button onClick={handleShareClick} disabled={isSharing} className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur text-gray-600 rounded-full h-8 w-8 flex items-center justify-center transition-colors duration-300 ease-in-out hover:bg-blue-50 hover:text-blue-600 shadow-sm border border-gray-100 disabled:opacity-50" aria-label="Share Service" title="Share Service">
        {isSharing ? <FontAwesomeIcon icon={faSpinner} spin className="text-xs" /> : <FontAwesomeIcon icon={faShareNodes} className="text-xs" />}
      </button>

      <Link to={`/services/${service.slug}`} className="flex flex-col flex-grow">
        <div className="relative h-48 overflow-hidden bg-gray-50">
          <LazyImage src={service.imageUrl} alt={service.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            {hasOffer && service.offer.name && !isFree && (
                <div className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase tracking-wide">
                <FontAwesomeIcon icon={faTag} /><span>{service.offer.name}</span>
                </div>
            )}
            {isFree && (
                <div className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase tracking-wide">
                <FontAwesomeIcon icon={faTag} /><span>FREE</span>
                </div>
            )}
          </div>
          
          {/* ✅ FEATURE: Order Count Badge */}
          {orderBadge && (
             <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                <FontAwesomeIcon icon={faFire} className="text-orange-400" />
                {orderBadge}
             </div>
          )}
        </div>
        
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-2 leading-tight group-hover:text-google-blue transition-colors">{service.title}</h3>
          
          <div className="flex items-center text-[11px] text-gray-400 mb-3 font-medium">
             <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5" />
             <span>{new Date(service.createdAt).toLocaleDateString()}</span>
          </div>
          
          <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-2 leading-relaxed">{service.description}</p>
        </div>
      </Link>
      
      <div className="px-4 pb-4 mt-auto">
        {hasOffer && !isFree && (
            <div className="mb-3 pt-2 border-t border-gray-50">
                <CountdownTimer endDate={service.offer.endDate} />
            </div>
        )}

        <div className="flex justify-between items-end">
          {(service.price > 0 || service.serviceType === 'standard') ? (
            <div className="flex flex-col">
              {isFree ? (
                  <span className="text-xl font-bold text-purple-600">Free</span>
              ) : (
                  <>
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-xl font-bold ${hasOffer ? 'text-gray-900' : 'text-gray-900'}`}>₹{service.currentPrice}</span>
                        {hasOffer && (<span className="text-xs font-medium text-gray-400 line-through">₹{service.price}</span>)}
                    </div>
                    {hasOffer && <span className="text-[10px] text-green-600 font-bold">Save ₹{service.price - service.currentPrice}</span>}
                  </>
              )}
            </div>
          ) : (
            <span className="text-sm font-bold text-gray-700 flex items-center gap-1"><FontAwesomeIcon icon={faTools} className="text-google-yellow" /> Custom</span>
          )}
          
          <NavLink to={`/services/${service.slug}`} className="px-4 py-1.5 bg-blue-50 text-google-blue border border-blue-100 rounded-lg hover:bg-google-blue hover:text-white transition-all text-sm font-semibold shadow-sm hover:shadow">
            {isFree ? 'View' : 'Details'}
          </NavLink>
        </div>
      </div>
    </div>
  );
});
ServiceCard.displayName = 'ServiceCard';

// --- Article Card ---

export const ArticleCard = React.memo(({ article }) => {
  return (
    <Link to={`/blog/${article.slug}`} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-white flex flex-col group h-full hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <LazyImage src={article.featuredImage} alt={article.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">
          <FontAwesomeIcon icon={faCalendarAlt} className="mr-1.5" />
          <span>{new Date(article.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-google-blue transition-colors line-clamp-2 leading-snug">{article.title}</h3>
        <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3 leading-relaxed">{article.excerpt}</p>
        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center text-google-blue font-medium text-sm">
            <span>Read Article</span>
            <span className="ml-1 transition-transform group-hover:translate-x-1">&rarr;</span>
        </div>
      </div>
    </Link>
  );
});
ArticleCard.displayName = 'ArticleCard';

// --- Service Content Modal ---

export const ServiceContentModal = ({ service, isOpen, onClose }) => {
    if (!isOpen || !service) return null;
  
    return (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-enter" 
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative transform transition-all overflow-hidden flex flex-col max-h-[85vh]" 
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-100 bg-white flex items-start gap-4">
             <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <LazyImage 
                    src={service.imageUrl} 
                    alt={service.title} 
                    className="w-full h-full object-cover" 
                />
             </div>
             <div className="flex-1 pr-8">
                <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2">
                    {service.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 font-medium bg-gray-100 inline-block px-2 py-0.5 rounded">
                    {service.contentUrls?.length || 0} Resource{service.contentUrls?.length !== 1 ? 's' : ''}
                </p>
             </div>
             <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                aria-label="Close modal"
             >
                <FontAwesomeIcon icon={faTimes} className="text-lg w-5 h-5 block" />
             </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50/50">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Downloads & Links
            </h4>
            <div className="space-y-3">
              {(service.contentUrls && service.contentUrls.length > 0) ? (
                  service.contentUrls.map((content, index) => (
                    <a
                        href={content.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        key={index}
                        className="group flex items-center p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-200 hover:shadow-md hover:shadow-blue-50 transition-all duration-200"
                    >
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-google-blue flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <FontAwesomeIcon icon={faFolderOpen} />
                        </div>
                        <div className="ml-3 flex-grow min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-google-blue transition-colors">
                                {content.name || `Resource ${index + 1}`}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">Click to access content</p>
                        </div>
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="text-gray-300 group-hover:text-google-blue ml-2 text-sm" />
                    </a>
                  ))
              ) : (
                  <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-dashed">
                      <p className="text-sm">No resources available yet.</p>
                  </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
             <button 
                onClick={onClose}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
             >
                Done
             </button>
          </div>
        </div>
      </div>
    );
};

// --- Payment Component ---

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
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-google-blue p-6 text-white text-center">
                <h1 className="text-2xl font-bold mb-1">{title}</h1>
                <p className="opacity-90 text-sm">{description}</p>
            </div>
            
            <div className="p-6 sm:p-8">
                <div className="text-center mb-8">
                    <p className="mb-4 text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Scan QR Code to Pay
                    </p>
                    <div className="inline-block p-4 bg-white border rounded-xl shadow-sm">
                        <div className="w-48 h-48 flex items-center justify-center">
                            {upiLink ? (
                                <QRCode value={upiLink} size={192} className="h-full w-full" />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-gray-400">
                                    <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 flex justify-center gap-4">
                         <a href={upiLink} className="text-google-blue hover:underline text-sm font-medium">Open UPI App</a>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">UTR / Transaction ID</label>
                            <input 
                                type="text" 
                                value={transactionId} 
                                onChange={(e) => setTransactionId(e.target.value)} 
                                required 
                                className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-google-blue focus:border-transparent transition-all font-mono text-sm" 
                                placeholder="Enter 12-digit UTR ID" 
                            />
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-lg flex gap-3 items-start">
                            <FontAwesomeIcon icon={faQuestionCircle} className="text-google-blue mt-0.5 text-sm" />
                            <p className="text-xs text-blue-800 leading-relaxed">
                                Verification typically takes <strong>10-20 minutes</strong>. You will be notified via email immediately upon confirmation.
                            </p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold shadow-md hover:bg-green-700 hover:shadow-lg disabled:opacity-70 disabled:shadow-none transition-all transform active:scale-[0.98]"
                        >
                            {loading ? <span className="flex items-center justify-center gap-2"><FontAwesomeIcon icon={faSpinner} spin /> Verifying...</span> : 'Submit Payment Details'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
});
PaymentComponent.displayName = 'PaymentComponent';