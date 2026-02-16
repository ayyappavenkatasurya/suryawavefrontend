import React, { useState } from 'react';
import { CountdownTimer } from '../../components';

export const CustomProjectForm = ({ service, onSubmit }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const hasOffer = service.price !== service.currentPrice;

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

    return (
        <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-lg shadow-lg text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{service.title}</h1>
            <p className="text-gray-600 mb-6">Please fill out the requirements form below. We will review your submission and contact you for the next steps.</p>
            
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

            <form onSubmit={handleSubmit} className="space-y-6">
                {service.srsForm.map((field, index) => (
                    <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.fieldType === 'text' && <input type="text" onChange={(e) => handleChange(field.label, e.target.value)} required={field.required} className="w-full p-2 border rounded-md focus:ring-google-blue focus:border-google-blue"/>}
                        {field.fieldType === 'textarea' && <textarea rows="5" onChange={(e) => handleChange(field.label, e.target.value)} required={field.required} className="w-full p-2 border rounded-md focus:ring-google-blue focus:border-google-blue"/>}
                        {field.fieldType === 'file' && (
                            <div>
                                <input type="text" placeholder="Enter link to your file (Google Drive, Dropbox, etc.)" onChange={(e) => handleChange(field.label, e.target.value)} required={field.required} className="w-full p-2 border rounded-md focus:ring-google-blue focus:border-google-blue"/>
                                <p className="text-xs text-gray-500 mt-1">Please provide a shareable link to your document/file.</p>
                            </div>
                        )}
                    </div>
                ))}
                <button type="submit" disabled={loading} className={`w-full py-3 bg-google-blue text-white rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors`}>
                    {loading ? 'Submitting...' : 'Submit Request'}
                </button>
            </form>
        </div>
    );
};