// frontend/src/components/service/CustomProjectForm.jsx

import React, { useState } from 'react';
import { CountdownTimer } from '../../components';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { LazyImage } from '../LazyImage';

export const CustomProjectForm = ({ service, onSubmit }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const hasOffer = service.price !== service.currentPrice;

    // Handle Input Changes
    const handleChange = (label, value) => {
        setFormData(prev => ({ ...prev, [label]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    // Helper to render mixed block types
    const renderBlock = (block, index) => {
        // --- CONTENT BLOCKS ---
        if (block.blockType === 'heading') {
            return <h2 key={index} className="text-3xl font-bold text-gray-900 mt-8 mb-4">{block.content}</h2>;
        }
        if (block.blockType === 'subheading') {
            return <h3 key={index} className="text-2xl font-semibold text-gray-800 mt-6 mb-3">{block.content}</h3>;
        }
        if (block.blockType === 'paragraph') {
            return (
                <div key={index} className="text-gray-700 leading-relaxed mb-4 prose max-w-none">
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>{block.content}</ReactMarkdown>
                </div>
            );
        }
        if (block.blockType === 'image') {
            return (
                <LazyImage 
                    key={index}
                    src={block.url} 
                    alt={block.alt || 'Reference Image'} 
                    className="my-6 w-full h-auto rounded-lg object-contain" 
                />
            );
        }
        if (block.blockType === 'file') {
            return (
                <div key={index} className="my-4 p-4 border rounded-lg bg-gray-50">
                    <a 
                        href={block.url || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-medium text-google-blue hover:underline flex items-center gap-3"
                    >
                        {block.iconUrl && <img src={block.iconUrl} alt="" className="w-6 h-6 object-contain" />}
                        <span>{block.content || 'Download File'}</span>
                    </a>
                </div>
            );
        }

        // --- INPUT BLOCKS (Legacy & New) ---
        // Fallback: If blockType is undefined or 'input', treat as input form field
        if (!block.blockType || block.blockType === 'input') {
            return (
                <div key={index} className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        {block.label} {block.required && <span className="text-red-500">*</span>}
                    </label>
                    
                    {/* ✅ FIX: Removed placeholder */}
                    {block.inputType === 'text' && (
                        <input 
                            type="text" 
                            onChange={(e) => handleChange(block.label, e.target.value)} 
                            required={block.required} 
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-google-blue transition-all"
                        />
                    )}
                    
                    {/* ✅ FIX: Removed placeholder */}
                    {block.inputType === 'textarea' && (
                        <textarea 
                            rows="5" 
                            onChange={(e) => handleChange(block.label, e.target.value)} 
                            required={block.required} 
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-google-blue transition-all"
                        />
                    )}
                    
                    {block.inputType === 'file' && (
                        <div className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
                            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                                <FontAwesomeIcon icon={faFileAlt} />
                                <span>Share a link to your file (Google Drive, Dropbox, etc.)</span>
                            </div>
                            <input 
                                type="url" 
                                placeholder="https://..." 
                                onChange={(e) => handleChange(block.label, e.target.value)} 
                                required={block.required} 
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-google-blue focus:border-google-blue"
                            />
                            <p className="text-xs text-gray-400 mt-1">Ensure the link is publicly accessible or shared with us.</p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-lg shadow-lg text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{service.title}</h1>
            <p className="text-gray-600 mb-6">Please review the details below and fill out the form to proceed.</p>
            
            {hasOffer && (
              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xl font-bold text-green-700 text-center mb-2">{service.offer.name} is LIVE!</p>
                <div className="flex justify-center">
                  <CountdownTimer endDate={service.offer.endDate} />
                </div>
              </div>
            )}

            {service.price > 0 && (
                <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">Project Pricing</h3>
                    {hasOffer && service.offer.name && (
                         <p className="text-sm font-semibold text-green-700 bg-green-100 inline-block px-2 py-0.5 rounded-md mb-2">{service.offer.name} Active!</p>
                    )}
                    <p className="text-gray-700">
                        The total fixed price for this project is{' '}
                        {hasOffer && <span className="line-through text-gray-500">₹{service.price}</span>}{' '}
                        <span className="font-semibold text-xl text-gray-900">₹{service.currentPrice}</span>.
                    </p>
                    {service.advanceAmount > 0 && <p className="text-gray-700 mt-1">An advance payment of <span className="font-semibold">₹{service.advanceAmount}</span> will be required to start.</p>}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2">
                {service.srsForm.map((block, index) => renderBlock(block, index))}
                
                <div className="pt-6 border-t mt-6">
                    <button type="submit" disabled={loading} className={`w-full py-3.5 bg-google-blue text-white rounded-lg font-bold text-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 transition-all transform active:scale-[0.99]`}>
                        {loading ? 'Submitting...' : 'Submit Project Request'}
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-3">By submitting, you agree to our terms of service.</p>
                </div>
            </form>
        </div>
    );
};