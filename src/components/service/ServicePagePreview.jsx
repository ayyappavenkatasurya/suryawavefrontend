import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheckCircle, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { CountdownTimer } from '../../components';
import { LazyImage } from '../LazyImage';

const markdownComponents = {
    ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 space-y-2 text-gray-700 my-4" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 space-y-2 text-gray-700 my-4" {...props} />,
    li: ({node, ...props}) => <li className="pl-1" {...props} />,
    h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-gray-800 mt-5 mb-2" {...props} />,
    p: ({node, ...props}) => <p className="text-gray-700 leading-relaxed mb-4" {...props} />,
    a: ({node, ...props}) => <a className="text-google-blue hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
    strong: ({node, ...props}) => <span className="font-bold text-gray-900" {...props} />,
    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4" {...props} />,
};

export const ServicePagePreview = ({ service, onPurchase, isOwned }) => {
    if (!service) { return <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-lg shadow-lg text-left text-gray-500">Loading service details...</div>; }
    
    const hasOffer = service.price !== service.currentPrice;
    const isFree = service.currentPrice === 0;
    
    const [isPurchasing, setIsPurchasing] = useState(false);
    const navigate = useNavigate();

    const handleButtonClick = async () => {
        if (isOwned) {
            navigate('/dashboard');
        } else {
            setIsPurchasing(true);
            await onPurchase();
            setIsPurchasing(false);
        }
    };
    
    let buttonText = "";
    let buttonClass = "";
    
    if (isOwned) {
        buttonText = "Go to Dashboard";
        buttonClass = "bg-green-600 hover:bg-green-700";
    } else if (isFree) {
        buttonText = "Access Now";
        buttonClass = "bg-purple-600 hover:bg-purple-700";
    } else {
        buttonText = `Purchase Now for ₹${service.currentPrice}`;
        buttonClass = "bg-google-blue hover:bg-blue-700";
    }

    const renderContentBlock = (block, index) => {
      switch (block.type) {
        case 'heading': return <h1 key={index} className="text-3xl md:text-4xl font-bold text-gray-900 mt-8 mb-4">{block.value}</h1>;
        case 'subheading': return <h2 key={index} className="text-2xl font-semibold text-gray-800 mt-6 mb-3">{block.value}</h2>;
        case 'paragraph': return (
            <div key={index} className="text-gray-700 leading-relaxed my-2 prose max-w-none">
                <ReactMarkdown rehypePlugins={[rehypeRaw]} components={markdownComponents}>
                    {block.value}
                </ReactMarkdown>
            </div>
        );
        case 'image': return (
            <LazyImage 
                key={index} 
                src={block.url || 'https://via.placeholder.com/800x400?text=Image+Preview'} 
                alt={block.alt || 'Service Image'} 
                className="my-6 w-full h-auto rounded-lg" 
            />
        );
        case 'file': return (<div key={index} className="my-4 p-4 border rounded-lg bg-gray-50"><a href={block.url || '#'} target="_blank" rel="noopener noreferrer" className="font-medium text-google-blue hover:underline flex items-center gap-3">{block.iconUrl && <img src={block.iconUrl} alt="" className="w-6 h-6 object-contain" />}<span>{block.value || 'Sample File'}</span></a></div>);
        case 'purchaseButton': return (
            <div key={index} className="my-8 text-center">
                {hasOffer && !isFree && !isOwned && (
                    <div className='mb-4'>
                        <p className="text-lg text-gray-500 line-through">Regular Price: ₹{service.price}</p>
                        <p className="text-2xl font-bold text-green-600">{service.offer.name} Price!</p>
                    </div>
                )}
                {!isOwned && (
                    <p className="text-4xl font-extrabold text-gray-900 mb-6">{isFree ? 'Free' : `₹${service.currentPrice}`}</p>
                )}
                <button 
                    onClick={handleButtonClick} 
                    disabled={isPurchasing} 
                    className={`w-full max-w-sm mx-auto py-3 text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2 ${buttonClass}`}
                >
                    {isPurchasing && <FontAwesomeIcon icon={faSpinner} spin />}
                    {isOwned && <FontAwesomeIcon icon={faArrowRight} />}
                    {buttonText}
                </button>
            </div>
        );
        default: return null;
      }
    };

    return (
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-lg shadow-lg text-left">
        {hasOffer && !isFree && !isOwned && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xl font-bold text-green-700 text-center mb-2">{service.offer.name} is LIVE!</p>
            <div className="flex justify-center">
              <CountdownTimer endDate={service.offer.endDate} />
            </div>
          </div>
        )}
        
        {isFree && !isOwned && (
            <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-center gap-2 text-purple-800">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span className="font-bold">This resource is available for FREE!</span>
            </div>
        )}

        {isOwned && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-2 text-green-800">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span className="font-bold">You already own this service.</span>
            </div>
        )}

        {(service.pageContent && service.pageContent.length > 0) ? (
            service.pageContent.map(renderContentBlock)
        ) : (
            <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.title || 'Service Title'}</h1>
                <p className="text-gray-600 mb-6">{service.description || 'Service short description.'}</p>
                <div className="text-center mt-8">
                    {!isOwned && (
                        <p className="text-4xl font-extrabold text-gray-900 mb-6">{isFree ? 'Free' : `₹${service.price || '0'}`}</p>
                    )}
                    <button 
                        onClick={handleButtonClick} 
                        disabled={isPurchasing} 
                        className={`w-full max-w-sm mx-auto py-3 text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2 ${buttonClass}`}
                    >
                        {isPurchasing && <FontAwesomeIcon icon={faSpinner} spin />}
                        {buttonText}
                    </button>
                </div>
            </>
        )}
      </div>
    );
};