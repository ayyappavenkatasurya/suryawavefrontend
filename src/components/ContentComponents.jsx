// frontend/src/components/ContentComponents.jsx

import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock, faQuestionCircle, faChevronDown, faShareNodes, faSpinner, faTag, faTools, 
  faCalendarAlt, faFolderOpen, faExternalLinkAlt, faTimes
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

// --- Article Card ---

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
          <div className="p-6 border-b bg-gray-50 flex items-start gap-4">
             <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border shadow-sm bg-white">
                <LazyImage 
                    src={service.imageUrl} 
                    alt={service.title} 
                    className="w-full h-full object-cover" 
                />
             </div>
             <div className="flex-1 pr-8">
                <h3 className="text-xl font-bold text-gray-900 leading-snug line-clamp-2">
                    {service.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    {service.contentUrls?.length || 0} Resource{service.contentUrls?.length !== 1 ? 's' : ''} Available
                </p>
             </div>
             <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-900 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Close modal"
             >
                <FontAwesomeIcon icon={faTimes} className="text-lg w-5 h-5 block" />
             </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar bg-white">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
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
                        className="group flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-google-blue hover:shadow-md hover:bg-blue-50 transition-all duration-200"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-google-blue flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <FontAwesomeIcon icon={faFolderOpen} />
                        </div>
                        <div className="ml-4 flex-grow min-w-0">
                            <p className="text-base font-semibold text-gray-800 truncate group-hover:text-google-blue">
                                {content.name || `Resource ${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-500 truncate">Click to open</p>
                        </div>
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="text-gray-400 group-hover:text-google-blue ml-2" />
                    </a>
                  ))
              ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                      <p>No resources have been added to this service yet.</p>
                  </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 flex justify-end">
             <button 
                onClick={onClose}
                className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
             >
                Close
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