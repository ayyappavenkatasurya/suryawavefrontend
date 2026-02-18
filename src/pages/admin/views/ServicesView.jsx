// frontend/src/pages/admin/views/ServicesView.jsx

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faSpinner, faTag, faCalendarDays, faTimes, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import api from '../../../services';
import { AdminContentSkeleton, OfferModal } from '../AdminComponents';
import { AddServiceForm } from '../AdminForms';
import { CustomProjectForm } from '../../../components/service/CustomProjectForm';
import { ServicePagePreview } from '../../../components/service/ServicePagePreview';

export const ServicesView = ({ getRenderData, deleteServiceMutation, actionLoading, handleServiceAdded, handleServiceUpdated }) => {
    const { data: services = [], isLoading } = useQuery({
        queryKey: ['services'],
        queryFn: async () => (await api.get('/api/services')).data,
    });

    const [editingService, setEditingService] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [offerModalService, setOfferModalService] = useState(null);
    const [showPreviewMobile, setShowPreviewMobile] = useState(false); // Mobile Toggle State

    const handleEditServiceClick = (service) => { 
        setEditingService(service); 
        setPreviewData(service); 
        setShowPreviewMobile(false); // Reset to form view on edit
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll top
    };

    const handleCancelEditService = () => { setEditingService(null); setPreviewData(null); };

    const onServiceUpdate = (updated) => {
        handleServiceUpdated(updated);
        handleCancelEditService();
    };

    const removeOfferHandler = async (id) => {
        if(window.confirm('Remove offer from this service?')) {
            try {
                const { data } = await api.delete(`/api/admin/services/${id}/offer`);
                toast.success('Offer removed!');
                handleServiceUpdated(data);
            } catch (e) { toast.error("Failed to remove offer."); } 
        }
    };

    if (isLoading) return <AdminContentSkeleton />;

    const displayedServices = getRenderData(services);

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative">
                
                {/* --- Left Column: Form & List --- */}
                <div className={`space-y-8 ${showPreviewMobile ? 'hidden lg:block' : 'block'}`}>
                    
                    <AddServiceForm 
                        key={editingService ? editingService._id : 'new'} 
                        serviceToEdit={editingService} 
                        onServiceAdded={handleServiceAdded} 
                        onServiceUpdated={onServiceUpdate} 
                        onCancelEdit={handleCancelEditService} 
                        onFormChange={setPreviewData}
                    />

                    {/* Mobile Preview Toggle Button (Visible only on small screens) */}
                    <button 
                        onClick={() => setShowPreviewMobile(true)}
                        className="lg:hidden w-full py-3 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"
                    >
                        <FontAwesomeIcon icon={faEye} /> View Live Preview
                    </button>

                    <div className="mt-8">
                        <h2 className="text-xl font-semibold mb-4">Existing Services</h2>
                        <div className="space-y-4">
                            {displayedServices.map(s => (
                                <div key={s._id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col justify-between gap-4 transition-transform hover:-translate-y-0.5 hover:shadow-md">
                                    <div>
                                        <div className="flex items-start justify-between">
                                            <strong className="block text-lg text-gray-800">{s.title}</strong>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${s.serviceType === 'custom' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {s.serviceType}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{s.description}</p>
                                        <div className="mt-2 text-sm font-medium">
                                            Price: ₹{s.price} {s.advanceAmount > 0 && <span className="text-gray-500">(Adv: ₹{s.advanceAmount})</span>}
                                        </div>

                                        {s.offer?.name && (
                                            <div className="text-xs mt-2 p-2 bg-green-50 text-green-800 rounded-md border border-green-100 inline-block">
                                                <p className="font-bold"><FontAwesomeIcon icon={faTag} className="mr-1"/> {s.offer.name} @ ₹{s.offer.price}</p>
                                                <p className="text-[10px] mt-0.5"><FontAwesomeIcon icon={faCalendarDays} className="mr-1"/> {new Date(s.offer.startDate).toLocaleDateString()} - {new Date(s.offer.endDate).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                                        {s.offer?.name ? 
                                            <button onClick={() => removeOfferHandler(s._id)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs font-bold px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"><FontAwesomeIcon icon={faTimes} /> No Offer</button> :
                                            <button onClick={() => setOfferModalService(s)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs font-bold px-3 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"><FontAwesomeIcon icon={faTag} /> Offer</button>}
                                        
                                        <button onClick={() => handleEditServiceClick(s)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs font-bold px-3 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"><FontAwesomeIcon icon={faEdit} /> Edit</button>
                                        
                                        <button onClick={() => deleteServiceMutation.mutate(s._id)} disabled={actionLoading.id === s._id} className="flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs font-bold px-3 py-2 bg-gray-100 text-gray-600 rounded disabled:opacity-50 hover:bg-red-500 hover:text-white transition-colors">
                                            {actionLoading.type === 'delete-service' && actionLoading.id === s._id ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faTrash} /> Delete</>}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- Right Column: Live Preview --- */}
                <div className={`lg:sticky lg:top-20 ${showPreviewMobile ? 'block' : 'hidden lg:block'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                            <FontAwesomeIcon icon={faEye} /> Live Preview
                        </div>
                        {/* Mobile Back Button */}
                        <button 
                            onClick={() => setShowPreviewMobile(false)}
                            className="lg:hidden text-sm bg-gray-200 px-3 py-1 rounded-full font-medium hover:bg-gray-300"
                        >
                            <FontAwesomeIcon icon={faEyeSlash} className="mr-1"/> Close Preview
                        </button>
                    </div>

                    <div className="border-4 border-gray-200 rounded-xl overflow-hidden bg-white shadow-xl">
                        <div className="bg-gray-800 p-2 flex items-center gap-2">
                            <span className="h-3 w-3 bg-red-500 rounded-full"></span>
                            <span className="h-3 w-3 bg-yellow-500 rounded-full"></span>
                            <span className="h-3 w-3 bg-green-500 rounded-full"></span>
                        </div>
                        <div className="max-h-[75vh] overflow-y-auto bg-gray-50 custom-scrollbar relative">
                             {/* Preview Overlay Label */}
                            <div className="absolute top-2 right-2 bg-black/10 text-black/50 text-xs font-bold px-2 py-1 rounded pointer-events-none">PREVIEW MODE</div>
                            
                            {previewData && previewData.serviceType === 'custom' 
                                ? <div className="p-4"><CustomProjectForm service={previewData} onSubmit={() => toast.info('This is a preview form.')} /></div>
                                : <div className="p-4"><ServicePagePreview service={previewData} onPurchase={() => toast.success('Preview Purchase Button Clicked')} /></div>
                            }
                        </div>
                    </div>
                </div>
            </div>
            <OfferModal isOpen={!!offerModalService} service={offerModalService} onClose={() => setOfferModalService(null)} onOfferSet={handleServiceUpdated}/>
        </>
    );
};