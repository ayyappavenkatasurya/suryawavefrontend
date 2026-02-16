import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faSpinner, faEye } from '@fortawesome/free-solid-svg-icons';
import api from '../../../services';
import { AdminContentSkeleton } from '../AdminComponents';
import { AddFaqForm } from '../AdminForms';

export const FaqsView = ({ getRenderData, actionLoading, setActionLoading }) => {
    const queryClient = useQueryClient();
    const { data: faqs = [], isLoading } = useQuery({
        queryKey: ['adminFaqs'],
        queryFn: async () => (await api.get('/api/admin/faqs')).data,
    });

    const [editingFaq, setEditingFaq] = useState(null);

    const handleEditFaqClick = (faq) => { setEditingFaq(faq); };
    const handleCancelEditFaq = () => { setEditingFaq(null); };
    const handleFaqUpdated = (updated) => { 
        queryClient.setQueryData(['adminFaqs'], old => old.map(f => f._id === updated._id ? updated : f));
        handleCancelEditFaq(); 
    };
    const handleFaqAdded = (added) => { 
        queryClient.setQueryData(['adminFaqs'], old => [added, ...old]);
    };

    const handleDeleteFaq = async (id) => { 
        if(window.confirm('DELETE this FAQ?')) { 
            setActionLoading({ type: 'delete-faq', id }); 
            try { 
                await api.delete(`/api/admin/faqs/${id}`); 
                toast.success('FAQ deleted!'); 
                queryClient.setQueryData(['adminFaqs'], old => old.filter(f => f._id !== id));
                if (editingFaq?._id === id) handleCancelEditFaq(); 
            } catch (e) { /* handled */ } 
            finally { setActionLoading({ type: null, id: null }); } 
        } 
    };

    if (isLoading) return <AdminContentSkeleton />;

    const displayedFaqs = getRenderData(faqs);

    return (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-8">
                <AddFaqForm
                    key={editingFaq ? editingFaq._id : 'new-faq'}
                    faqToEdit={editingFaq}
                    onFaqAdded={handleFaqAdded}
                    onFaqUpdated={handleFaqUpdated}
                    onCancelEdit={handleCancelEditFaq}
                />
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Manage FAQs</h2>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {displayedFaqs.map(faq => (
                            <div key={faq._id} className={`bg-white p-4 rounded-lg shadow-sm border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${!faq.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
                                <div>
                                    <p className="font-semibold">{faq.question}</p>
                                    <p className="text-sm text-gray-500 line-clamp-1">{faq.answer.replace(/<[^>]+>/g, '')}</p>
                                    <div className="text-xs mt-1 space-x-2">
                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded">Order: {faq.order}</span>
                                        {!faq.isActive && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Inactive</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button onClick={() => handleEditFaqClick(faq)} className="flex items-center gap-1 text-sm px-3 py-1 bg-yellow-400 text-yellow-900 rounded hover:bg-yellow-500"><FontAwesomeIcon icon={faEdit} /> Edit</button>
                                    <button onClick={() => handleDeleteFaq(faq._id)} disabled={actionLoading.id === faq._id} className="w-20 flex items-center justify-center gap-1 text-sm px-3 py-1 bg-red-500 text-white rounded disabled:bg-red-300 hover:bg-red-600">
                                        {actionLoading.type === 'delete-faq' && actionLoading.id === faq._id ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faTrash} /> Delete</>}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="sticky top-20">
                <div className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-700"><FontAwesomeIcon icon={faEye} />Live Preview</div>
                <div className="border-4 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                    <div className="bg-gray-800 p-2 flex items-center gap-2"><span className="h-3 w-3 bg-red-500 rounded-full"></span><span className="h-3 w-3 bg-yellow-500 rounded-full"></span><span className="h-3 w-3 bg-green-500 rounded-full"></span></div>
                    <div className="p-6 bg-white">
                        <div className="space-y-2">
                            <details className="group bg-white p-4 border rounded-lg shadow-sm cursor-pointer" open>
                                <summary className="flex justify-between items-center font-semibold text-gray-800 list-none">
                                    {editingFaq ? editingFaq.question : (faqs[0]?.question || 'Example Question')}
                                </summary>
                                <div className="mt-4 text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: editingFaq ? editingFaq.answer : (faqs[0]?.answer || 'Example Answer') }} />
                            </details>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};