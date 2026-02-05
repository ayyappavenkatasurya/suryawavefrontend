import React, { useState } from 'react';
import { SkeletonPulse } from '../../components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import api from '../../services';

// ========================================
//      ADMIN SKELETONS
// ========================================

export const AdminTableSkeleton = () => (
    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => <SkeletonPulse key={i} className="h-4 w-20" />)}
            </div>
        </div>
        <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="px-6 py-4 grid grid-cols-5 gap-4">
                    <SkeletonPulse className="h-4 w-32" />
                    <SkeletonPulse className="h-4 w-24" />
                    <SkeletonPulse className="h-4 w-20" />
                    <SkeletonPulse className="h-4 w-40" />
                    <SkeletonPulse className="h-8 w-20 rounded-md" />
                </div>
            ))}
        </div>
    </div>
);

export const AdminContentSkeleton = () => (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
            {/* Form Skeleton */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <SkeletonPulse className="h-6 w-1/3 mb-4" />
                <div className="space-y-4">
                    <SkeletonPulse className="h-10 w-full" />
                    <SkeletonPulse className="h-24 w-full" />
                    <SkeletonPulse className="h-10 w-full" />
                    <div className="flex gap-2">
                        <SkeletonPulse className="h-10 w-1/2" />
                        <SkeletonPulse className="h-10 w-1/2" />
                    </div>
                </div>
            </div>
            {/* List Skeleton */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <SkeletonPulse className="h-6 w-1/4 mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between p-3 border rounded">
                            <div className="w-2/3 space-y-2">
                                <SkeletonPulse className="h-4 w-1/2" />
                                <SkeletonPulse className="h-3 w-3/4" />
                            </div>
                            <div className="flex gap-2">
                                <SkeletonPulse className="h-8 w-16 rounded" />
                                <SkeletonPulse className="h-8 w-16 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        {/* Preview Skeleton */}
        <div className="hidden lg:block border-4 border-gray-200 rounded-xl overflow-hidden bg-white h-[600px]">
            <div className="bg-gray-100 p-2 flex gap-2 border-b">
                <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                <div className="h-3 w-3 rounded-full bg-gray-300"></div>
            </div>
            <div className="p-6 space-y-6">
                <SkeletonPulse className="h-8 w-3/4" />
                <SkeletonPulse className="h-48 w-full rounded-lg" />
                <div className="space-y-2">
                    <SkeletonPulse className="h-4 w-full" />
                    <SkeletonPulse className="h-4 w-full" />
                    <SkeletonPulse className="h-4 w-2/3" />
                </div>
            </div>
        </div>
    </div>
);

// ========================================
//      ADMIN MODALS
// ========================================

export const OfferModal = ({ service, isOpen, onClose, onOfferSet }) => {
    const [name, setName] = useState(service?.offer?.name || '');
    const [price, setPrice] = useState(service?.offer?.price || '');
    const formatDateForInput = (date) => date ? new Date(date).toISOString().split('T')[0] : '';
    const [startDate, setStartDate] = useState(formatDateForInput(service?.offer?.startDate));
    const [endDate, setEndDate] = useState(formatDateForInput(service?.offer?.endDate));
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.put(`/api/admin/services/${service._id}/offer`, {
                name, price, startDate, endDate
            });
            toast.success("Offer set successfully!");
            onOfferSet(data);
            onClose();
        } catch (error) {
            // Error handled by interceptor
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-bold mb-1">Set Offer for:</h3>
                        <p className="text-gray-600 mb-4">{service.title}</p>
                        <div className="space-y-4">
                            <input type="text" placeholder="Offer Name (e.g., Diwali Sale)" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded" />
                            <input type="number" placeholder="Offer Price (INR)" value={price} onChange={e => setPrice(e.target.value)} required className="w-full p-2 border rounded" />
                            <div>
                                <label className="text-sm font-medium">Start Date</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full p-2 border rounded mt-1" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">End Date</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full p-2 border rounded mt-1" />
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-google-blue text-white rounded-md disabled:bg-blue-300 hover:bg-blue-700">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Set Offer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const SrsViewModal = ({ request, isOpen, onClose }) => {
    if (!isOpen || !request) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b">
                    <h3 className="text-lg font-bold">SRS for: {request.service.title}</h3>
                    <p className="text-sm text-gray-500">User: {request.user?.email}</p>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    {Object.entries(request.srsData).map(([key, value]) => (
                        <div key={key}>
                            <p className="font-semibold text-sm text-gray-800">{key}</p>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap p-2 bg-gray-50 border rounded-md mt-1">{value}</p>
                        </div>
                    ))}
                </div>
                <div className="p-3 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Close</button>
                </div>
            </div>
        </div>
    );
};