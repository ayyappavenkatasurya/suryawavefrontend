import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faEye, faDollarSign, faSpinner } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import api from '../../../services';
import { AdminTableSkeleton, SrsViewModal } from '../AdminComponents';

export const ProjectRequestsView = ({ 
    getRenderData, 
    actionLoading, 
    handleApproveRequestClick, 
    rejectInitialRequest, 
    approveProjectPayment, 
    rejectProjectPayment,
    setActionLoading
}) => {
    const queryClient = useQueryClient();
    const { data: projectRequests = [], isLoading } = useQuery({
        queryKey: ['adminProjectRequests'],
        queryFn: async () => (await api.get('/api/admin/project-requests')).data,
    });

    const [isRequestModalOpen, setRequestModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [fullAmount, setFullAmount] = useState('');
    const [finalContent, setFinalContent] = useState([{ name: '', url: '' }]);
    const [srsViewRequest, setSrsViewRequest] = useState(null);

    const openRequestModal = (request) => { 
        setSelectedRequest(request); 
        setFullAmount(request.fullPayment?.amount || ''); 
        setFinalContent(request.finalProjectContent?.length > 0 ? request.finalProjectContent : [{ name: '', url: '' }]);
        setRequestModalOpen(true); 
    };
    const closeRequestModal = () => { setRequestModalOpen(false); setSelectedRequest(null); };
    
    const handleFinalContentChange = (index, event) => { const values = [...finalContent]; values[index][event.target.name] = event.target.value; setFinalContent(values); };
    const addFinalContentField = () => { setFinalContent([...finalContent, { name: '', url: '' }]); };
    const removeFinalContentField = index => { setFinalContent(prevContent => prevContent.filter((_, i) => i !== index)); };

    const handleUpdateRequest = async () => {
        setActionLoading({type: 'update', id: selectedRequest._id });
        try {
            const payload = {
                fullPaymentAmount: selectedRequest.service?.price > 0 ? undefined : Number(fullAmount),
                finalProjectContent: finalContent.filter(item => item.name && item.url),
                status: selectedRequest.status === 'in_progress' ? 'payment_pending' : undefined
            };
            const {data} = await api.put(`/api/admin/project-requests/${selectedRequest._id}`, payload);
            toast.success('Request updated');
            queryClient.setQueryData(['adminProjectRequests'], old => old.map(r => r._id === selectedRequest._id ? data : r));
            closeRequestModal();
        } catch(e) { toast.error("Failed to update request."); } finally { setActionLoading({ type: null, id: null }); }
    };

    const exportToCSV = (data, filename) => {
        if (!data || data.length === 0) {
            return toast.error("No data to export.");
        }
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => {
            return Object.values(row).map(val => {
                if (typeof val === 'object' && val !== null) return `"${JSON.stringify(val).replace(/"/g, '""')}"`; 
                if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
                return val;
            }).join(',');
        });
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) return <AdminTableSkeleton />;

    const displayedRequests = getRenderData(projectRequests);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Advanced Project Requests</h2>
            <button onClick={() => exportToCSV(displayedRequests.map(p => ({ ...p, srsData: JSON.stringify(p.srsData) })), 'project_requests.csv')} className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-2 hover:bg-green-700 transition-colors">
                <FontAwesomeIcon icon={faDownload} /> Export CSV
            </button>
            </div>
            <div className="bg-white shadow rounded-lg overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium">User & Service</th><th className="px-6 py-3 text-left text-xs font-medium">Status & Date</th><th className="px-6 py-3 text-left text-xs font-medium">Payment Info</th><th className="px-6 py-3 text-left text-xs font-medium">Actions</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{displayedRequests.map(req => (<tr key={req._id}><td className="px-6 py-4 text-sm align-top"><div><p className="font-semibold">{req.user?.email}</p><p className="text-gray-500">{req.service?.title}</p></div></td><td className="px-6 py-4 text-sm align-top"><div className="flex flex-col"><span className="capitalize font-semibold">{req.status.replace(/_/g, ' ')}</span><span className="text-gray-500 text-xs">{new Date(req.createdAt).toLocaleDateString()}</span></div></td>
            <td className="px-6 py-4 text-sm font-mono align-top">
                <div className="space-y-2">
                    {req.advance?.transactionId && (
                        <div>
                            <p className="text-xs text-gray-500">Adv UTR ({req.advance.status || 'N/A'}):</p>
                            <p className="break-all">{req.advance.transactionId}</p>
                        </div>
                    )}
                    {req.fullPayment?.transactionId && (
                        <div>
                            <p className="text-xs text-gray-500">Final UTR ({req.fullPayment.status || 'N/A'}):</p>
                            <p className="break-all">{req.fullPayment.transactionId}</p>
                        </div>
                    )}
                    {!req.advance?.transactionId && !req.fullPayment?.transactionId && (
                        <p className="text-xs text-gray-400 italic">No UTR submitted</p>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 align-top"><div className="flex flex-wrap gap-2 items-center">{req.status === 'submitted' && (<><button onClick={() => handleApproveRequestClick(req)} disabled={actionLoading.id === req._id} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">Approve</button><button onClick={() => rejectInitialRequest(req._id)} disabled={actionLoading.id === req._id} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">Reject</button></>)}{req.status === 'advance_pending' && (<><button onClick={() => approveProjectPayment(req._id, 'advance')} disabled={actionLoading.id === req._id} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">Approve Adv.</button><button onClick={() => rejectProjectPayment(req._id, 'advance')} disabled={actionLoading.id === req._id} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">Reject Adv.</button></>)}{req.status === 'final_payment_pending' && (<><button onClick={() => approveProjectPayment(req._id, 'full')} disabled={actionLoading.id === req._id} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">Approve Final</button><button onClick={() => rejectProjectPayment(req._id, 'full')} disabled={actionLoading.id === req._id} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">Reject Final</button></>)}
            <button onClick={() => setSrsViewRequest(req)} title="View SRS Data" className="p-2 h-7 w-7 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center"><FontAwesomeIcon icon={faEye} /></button>
            <button onClick={() => openRequestModal(req)} className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700">Manage/Deliver</button>
            </div></td></tr>))}</tbody></table></div>
            
            <SrsViewModal isOpen={!!srsViewRequest} request={srsViewRequest} onClose={() => setSrsViewRequest(null)}/>
            {isRequestModalOpen && selectedRequest && (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={closeRequestModal}><div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}><div className="p-6 border-b"><h3 className="text-xl font-bold">Manage Request: {selectedRequest.service.title}</h3><p className="text-sm text-gray-500">From: {selectedRequest.user?.email || 'User Not Found'}</p></div><div className="p-6 space-y-4 overflow-y-auto"><div className="grid grid-cols-2 gap-4"><div><h4 className="font-semibold text-sm">Advance Payment</h4><p>Amount: ₹{selectedRequest.advance.amount || 'N/A'}</p><p className="break-all">UTR: {selectedRequest.advance.transactionId || 'N/A'}</p><p>Status: <span className='capitalize'>{selectedRequest.advance.status || 'N/A'}</span></p></div><div><h4 className="font-semibold text-sm">Full Payment</h4><p>Amount: ₹{selectedRequest.fullPayment.amount || 'N/A'}</p><p className="break-all">UTR: {selectedRequest.fullPayment.transactionId || 'N/A'}</p><p>Status: <span className='capitalize'>{selectedRequest.fullPayment.status || 'N/A'}</span></p></div></div><h4 className="font-semibold pt-4 border-t">Submitted Requirements (SRS)</h4><div className="bg-gray-50 p-4 rounded-md border space-y-3 max-h-48 overflow-y-auto">{Object.entries(selectedRequest.srsData).map(([key, value]) => (<div key={key}><p className="font-medium text-sm text-gray-800">{key}</p><p className="text-sm text-gray-600 whitespace-pre-wrap">{value}</p></div>))}</div><h4 className="font-semibold pt-4 border-t">Project Management</h4><div><label className="block text-sm font-medium text-gray-700">Full Payment Amount (INR)</label><div className="flex items-center gap-2 mt-1"><FontAwesomeIcon icon={faDollarSign} className="text-gray-400"/><input type="number" placeholder="e.g., 5000" value={fullAmount} onChange={e => setFullAmount(e.target.value)} disabled={selectedRequest.service?.price > 0} className="w-full p-2 border rounded-md disabled:bg-gray-100 focus:ring-2 focus:ring-google-blue focus:outline-none" /></div><p className="text-xs text-gray-500 mt-1">{selectedRequest.service?.price > 0 ? "Amount is auto-calculated from service's fixed price." : "Setting this will request the full payment from the user if the project is 'in progress'."}</p></div><div><label className="block text-sm font-medium text-gray-700">Final Project Content / Deliverables</label><div className="space-y-2 mt-1">{finalContent.map((item, index) => (<div key={index} className="flex items-center gap-2"><input type="text" name="name" placeholder="File Name (e.g., 'Project Report')" value={item.name} onChange={e => handleFinalContentChange(index, e)} className="w-1/2 p-2 border rounded focus:ring-2 focus:ring-google-blue focus:outline-none" /><input type="url" name="url" placeholder="URL" value={item.url} onChange={e => handleFinalContentChange(index, e)} className="w-1/2 p-2 border rounded focus:ring-2 focus:ring-google-blue focus:outline-none" /><button type="button" onClick={() => removeFinalContentField(index)} className="p-2 bg-red-500 text-white rounded font-bold h-fit hover:bg-red-600">&times;</button></div>))}<button type="button" onClick={addFinalContentField} className="text-sm text-google-blue hover:underline mt-2">+ Add More</button></div></div></div><div className="p-4 bg-gray-50 border-t flex justify-end gap-3"><button onClick={closeRequestModal} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button><button onClick={handleUpdateRequest} disabled={actionLoading.id === selectedRequest._id} className="px-4 py-2 bg-google-blue text-white rounded-md disabled:bg-blue-300 hover:bg-blue-700">{actionLoading.type === 'update' ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Save Changes'}</button></div></div></div>)}
        </div>
    );
};