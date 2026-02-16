import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faSpinner, faTag, faCalendarDays, faTimes, faEye } from '@fortawesome/free-solid-svg-icons';
import api from '../../../services';
import { AdminContentSkeleton, OfferModal } from '../AdminComponents';
import { AddServiceForm } from '../AdminForms';
// ✅ FIXED IMPORTS below
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

    const handleEditServiceClick = (service) => { setEditingService(service); setPreviewData(service); };
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
            <div className="grid lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-8">
                    <AddServiceForm 
                        key={editingService ? editingService._id : 'new'} 
                        serviceToEdit={editingService} 
                        onServiceAdded={handleServiceAdded} 
                        onServiceUpdated={onServiceUpdate} 
                        onCancelEdit={handleCancelEditService} 
                        onFormChange={setPreviewData}
                    />
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold mb-4">Existing Services</h2>
                        <div className="space-y-4">
                            {displayedServices.map(s => (
                                <div key={s._id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div>
                                        <strong className="block">{s.title}</strong>
                                        <span className="text-sm text-gray-600">{s.serviceType === 'custom' ? `Advanced (Total: ₹${s.price}, Adv: ₹${s.advanceAmount})` : `Standard (₹${s.price})`}</span>
                                        {s.offer?.name && (
                                            <div className="text-xs mt-1 p-1.5 bg-green-100 text-green-800 rounded-md">
                                                <p><FontAwesomeIcon icon={faTag} /> <strong>{s.offer.name}</strong> @ ₹{s.offer.price}</p>
                                                <p><FontAwesomeIcon icon={faCalendarDays} /> {new Date(s.offer.startDate).toLocaleDateString()} - {new Date(s.offer.endDate).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0 flex-wrap justify-start sm:justify-end">
                                        {s.offer?.name ? 
                                            <button onClick={() => removeOfferHandler(s._id)} className="flex items-center gap-1 text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"><FontAwesomeIcon icon={faTimes} /> Remove Offer</button> :
                                            <button onClick={() => setOfferModalService(s)} className="flex items-center gap-1 text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"><FontAwesomeIcon icon={faTag} /> Set Offer</button>}
                                        <button onClick={() => handleEditServiceClick(s)} className="flex items-center gap-1 text-sm px-3 py-1 bg-yellow-400 text-yellow-900 rounded hover:bg-yellow-500"><FontAwesomeIcon icon={faEdit} /> Edit</button>
                                        <button onClick={() => deleteServiceMutation.mutate(s._id)} disabled={actionLoading.id === s._id} className="w-20 flex items-center justify-center gap-1 text-sm px-3 py-1 bg-red-500 text-white rounded disabled:bg-red-300 hover:bg-red-600">
                                            {actionLoading.type === 'delete-service' && actionLoading.id === s._id ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faTrash} /> Delete</>}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="sticky top-20">
                    <div className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-700"><FontAwesomeIcon icon={faEye} />Live Preview</div>
                    <div className="border-4 border-gray-200 rounded-xl overflow-hidden bg-white">
                        <div className="bg-gray-800 p-2 flex items-center gap-2"><span className="h-3 w-3 bg-red-500 rounded-full"></span><span className="h-3 w-3 bg-yellow-500 rounded-full"></span><span className="h-3 w-3 bg-green-500 rounded-full"></span></div>
                        <div className="max-h-[75vh] overflow-y-auto bg-gray-50">
                            {previewData && previewData.serviceType === 'custom' 
                                ? <CustomProjectForm service={previewData} onSubmit={() => toast.info('This is a preview form.')} /> 
                                : <ServicePagePreview service={previewData} onPurchase={() => toast.success('Preview Purchase Button Clicked')} />
                            }
                        </div>
                    </div>
                </div>
            </div>
            <OfferModal isOpen={!!offerModalService} service={offerModalService} onClose={() => setOfferModalService(null)} onOfferSet={handleServiceUpdated}/>
        </>
    );
};