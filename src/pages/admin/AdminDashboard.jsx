// frontend/src/pages/admin/AdminDashboard.jsx

import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SEO } from '../../components';
import { CustomProjectForm, ServicePagePreview } from '../publicpages';
import api from '../../services';
import Fuse from 'fuse.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faClipboardList, faUsers, faLayerGroup, faEdit, faTrash, faCheck, faWallet, faTimes, faEye,
    faSpinner, faTools, faDollarSign, faTag, faCalendarDays,
    faNewspaper, faQuestionCircle, faChartBar, faDownload, faSearch, faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';

import { AdminTableSkeleton, AdminContentSkeleton, OfferModal, SrsViewModal } from './AdminComponents';
import { AddServiceForm, AddArticleForm, AddFaqForm, ArticlePreview } from './AdminForms';

export const AdminDashboardPage = () => {
    const [view, setView] = useState('stats');
    const [searchQuery, setSearchQuery] = useState('');
    const { pathname } = useLocation();
    const queryClient = useQueryClient();

    // Editing States
    const [editingService, setEditingService] = useState(null);
    const [editingArticle, setEditingArticle] = useState(null);
    const [editingFaq, setEditingFaq] = useState(null);

    // Previews
    const [previewData, setPreviewData] = useState(null);
    const [previewArticle, setPreviewArticle] = useState(null);
    
    // Loaders & Actions
    const [actionLoading, setActionLoading] = useState({ type: null, id: null });

    // Modals
    const [isRequestModalOpen, setRequestModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [fullAmount, setFullAmount] = useState('');
    const [finalContent, setFinalContent] = useState([{ name: '', url: '' }]);

    const [approveModalInfo, setApproveModalInfo] = useState({ isOpen: false, requestId: null, advanceAmount: '' });
    const [offerModalService, setOfferModalService] = useState(null);
    const [srsViewRequest, setSrsViewRequest] = useState(null);

    // === REACT QUERY FETCHING ===
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['adminStats'],
        queryFn: async () => (await api.get('/api/admin/stats')).data,
        enabled: view === 'stats'
    });

    const { data: pendingOrders = [], isLoading: ordersLoading } = useQuery({
        queryKey: ['adminOrders'],
        queryFn: async () => (await api.get('/api/admin/orders')).data,
        enabled: view === 'orders'
    });

    const { data: services = [], isLoading: servicesLoading } = useQuery({
        queryKey: ['services'], // Uses public key for services
        queryFn: async () => (await api.get('/api/services')).data,
        enabled: view === 'services'
    });

    const { data: articles = [], isLoading: articlesLoading } = useQuery({
        queryKey: ['articles'], // Uses public key for articles
        queryFn: async () => (await api.get('/api/articles')).data,
        enabled: view === 'articles'
    });

    const { data: faqs = [], isLoading: faqsLoading } = useQuery({
        queryKey: ['adminFaqs'],
        queryFn: async () => (await api.get('/api/admin/faqs')).data,
        enabled: view === 'faqs'
    });

    const { data: users = [], isLoading: usersLoading } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: async () => (await api.get('/api/admin/users')).data,
        enabled: view === 'users'
    });

    const { data: projectRequests = [], isLoading: projectsLoading } = useQuery({
        queryKey: ['adminProjectRequests'],
        queryFn: async () => (await api.get('/api/admin/project-requests')).data,
        enabled: view === 'projects'
    });

    const isLoading = statsLoading || ordersLoading || servicesLoading || articlesLoading || faqsLoading || usersLoading || projectsLoading;

    // === SEARCH & FILTERING ===
    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) return null;

        const options = { threshold: 0.3, keys: [] };
        let data = [];

        if (view === 'orders') {
            data = pendingOrders;
            options.keys = ['user.email', 'transactionId', 'service.title'];
        } else if (view === 'users') {
            data = users;
            options.keys = ['name', 'email', 'role'];
        } else if (view === 'services') {
            data = services;
            options.keys = ['title', 'category', 'description'];
        } else if (view === 'projects') {
            data = projectRequests;
            options.keys = ['user.email', 'service.title', 'status', 'advance.transactionId', 'fullPayment.transactionId'];
        } else if (view === 'articles') {
            data = articles;
            options.keys = ['title', 'slug'];
        } else if (view === 'faqs') {
            data = faqs;
            options.keys = ['question', 'answer'];
        } else {
            return null;
        }

        const fuse = new Fuse(data, options);
        return fuse.search(searchQuery).map(result => result.item);
    }, [searchQuery, view, pendingOrders, users, services, projectRequests, articles, faqs]);

    const getRenderData = (originalData) => filteredData || originalData;

    // === UTILS ===
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

    // === MUTATIONS (With Optimistic Updates) ===

    // Order Approval
    const approveOrderMutation = useMutation({
        mutationFn: (id) => api.put(`/api/admin/orders/${id}/approve`),
        onMutate: async (id) => {
            setActionLoading({ type: 'approve', id });
            await queryClient.cancelQueries(['adminOrders']);
            const prev = queryClient.getQueryData(['adminOrders']);
            queryClient.setQueryData(['adminOrders'], (old) => old.filter(o => o._id !== id));
            return { prev };
        },
        onError: (err, id, context) => {
            queryClient.setQueryData(['adminOrders'], context.prev);
            toast.error("Failed to approve order.");
        },
        onSettled: () => {
            setActionLoading({ type: null, id: null });
            queryClient.invalidateQueries(['adminOrders']);
            queryClient.invalidateQueries(['adminStats']);
        },
        onSuccess: () => toast.success('Order approved!')
    });

    const rejectOrderMutation = useMutation({
        mutationFn: (id) => api.put(`/api/admin/orders/${id}/reject`),
        onMutate: async (id) => {
            setActionLoading({ type: 'reject', id });
            await queryClient.cancelQueries(['adminOrders']);
            const prev = queryClient.getQueryData(['adminOrders']);
            queryClient.setQueryData(['adminOrders'], (old) => old.filter(o => o._id !== id));
            return { prev };
        },
        onError: (err, id, context) => {
            queryClient.setQueryData(['adminOrders'], context.prev);
            toast.error("Failed to reject order.");
        },
        onSettled: () => {
            setActionLoading({ type: null, id: null });
            queryClient.invalidateQueries(['adminOrders']);
            queryClient.invalidateQueries(['adminStats']);
        },
        onSuccess: () => toast.success('Order rejected!')
    });

    // Service Management
    const deleteServiceMutation = useMutation({
        mutationFn: (id) => api.delete(`/api/services/${id}`),
        onMutate: async (id) => {
            setActionLoading({ type: 'delete-service', id });
            await queryClient.cancelQueries(['services']);
            const prev = queryClient.getQueryData(['services']);
            queryClient.setQueryData(['services'], (old) => old.filter(s => s._id !== id));
            return { prev };
        },
        onError: (err, id, context) => {
            queryClient.setQueryData(['services'], context.prev);
            toast.error("Failed to delete service.");
        },
        onSettled: () => {
            setActionLoading({ type: null, id: null });
            queryClient.invalidateQueries(['services']);
        },
        onSuccess: () => toast.success('Service deleted!')
    });

    // === HANDLERS ===
    const handleEditServiceClick = (service) => { setEditingService(service); setPreviewData(service); };
    const handleCancelEditService = () => { setEditingService(null); setPreviewData(null); };
    
    const handleServiceUpdated = (updated) => { 
        queryClient.setQueryData(['services'], (old) => old.map(s => s._id === updated._id ? updated : s));
        if(previewData?._id === updated._id) setPreviewData(updated);
        handleCancelEditService(); 
    };
    const handleServiceAdded = (added) => { 
        queryClient.setQueryData(['services'], (old) => [added, ...old]);
        setPreviewData(null); 
    };

    const removeOfferHandler = async (id) => {
        if(window.confirm('Remove offer from this service?')) {
            setActionLoading({ type: 'remove-offer', id});
            try {
                const { data } = await api.delete(`/api/admin/services/${id}/offer`);
                toast.success('Offer removed!');
                handleServiceUpdated(data);
            } catch (e) { toast.error("Failed to remove offer."); } 
            finally { setActionLoading({ type: null, id: null }); }
        }
    };

    // Project Request Modals
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
    
    // Project Approval Logic
    const handleApproveRequestClick = async (request) => {
        if (typeof request.service?.advanceAmount === 'number') {
            const confirmationMessage = request.service.advanceAmount > 0
                ? `This service has a fixed advance of ₹${request.service.advanceAmount}. Approve now?`
                : `This service has a fixed advance of ₹0. Approve to start the project immediately?`;
            if(!window.confirm(confirmationMessage)) return;
            setActionLoading({ type: 'approve-req', id: request._id });
            try {
                await api.put(`/api/admin/project-requests/${request._id}/approve-request`);
                toast.success('Request Approved!');
                queryClient.invalidateQueries(['adminProjectRequests']);
            } catch(e) { toast.error("Failed to approve request."); } 
            finally { setActionLoading({ type: null, id: null }); }
        } else {
            setApproveModalInfo({ isOpen: true, requestId: request._id, advanceAmount: '' });
        }
    };
    
    const closeApproveModal = () => {
        setApproveModalInfo({ isOpen: false, requestId: null, advanceAmount: '' });
    };
    
    const handleConfirmApproveRequest = async () => {
        const { requestId, advanceAmount } = approveModalInfo;
        if (advanceAmount.trim() === '' || isNaN(Number(advanceAmount)) || Number(advanceAmount) < 0) {
            return toast.error("Please enter a valid, non-negative advance amount (e.g., 500 or 0).");
        }
        setActionLoading({ type: 'approve-req', id: requestId });
        try {
            await api.put(`/api/admin/project-requests/${requestId}/approve-request`, { advanceAmount: Number(advanceAmount) });
            toast.success('Request Approved!');
            closeApproveModal();
            queryClient.invalidateQueries(['adminProjectRequests']);
        } catch(e) { toast.error("Failed to approve request."); } finally { setActionLoading({ type: null, id: null }); }
    };

    const rejectInitialRequest = async (id) => {
        if(!window.confirm('Are you sure you want to reject this project request?')) return;
        setActionLoading({ type: 'reject-req', id });
        try {
            await api.put(`/api/admin/project-requests/${id}/reject-request`);
            toast.success('Request Rejected!');
            queryClient.invalidateQueries(['adminProjectRequests']);
        } catch(e) { toast.error("Failed to reject request."); } finally { setActionLoading({ type: null, id: null }); }
    };

    const approveProjectPayment = async (id, type) => {
        if(!window.confirm(`Approve this ${type} payment?`)) return;
        const endpoint = type === 'advance' ? 'approve-advance' : 'approve-full';
        setActionLoading({ type: `approve-${type}`, id });
        try {
            await api.put(`/api/admin/project-requests/${id}/${endpoint}`);
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} payment approved!`);
            queryClient.invalidateQueries(['adminProjectRequests']);
            queryClient.invalidateQueries(['adminStats']);
        } catch(e) { toast.error("Approval failed."); } finally { setActionLoading({ type: null, id: null }); }
    };
    
    const rejectProjectPayment = async (id, type) => {
        if(!window.confirm(`REJECT this ${type} payment? The user will be asked to pay again.`)) return;
        setActionLoading({ type: `reject-${type}`, id });
        try {
            await api.put(`/api/admin/project-requests/${id}/reject-payment`, { paymentType: type });
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} payment rejected!`);
            queryClient.invalidateQueries(['adminProjectRequests']);
            queryClient.invalidateQueries(['adminStats']);
        } catch(e) { toast.error("Rejection failed."); } finally { setActionLoading({ type: null, id: null }); }
    };

    // Article Handlers
    const handleEditArticleClick = (article) => { setEditingArticle(article); setPreviewArticle(article); };
    const handleCancelEditArticle = () => { setEditingArticle(null); setPreviewArticle(null); };
    const handleDeleteArticle = async (id) => { 
        if(window.confirm('DELETE this article?')) { 
            setActionLoading({ type: 'delete-article', id }); 
            try { 
                await api.delete(`/api/admin/articles/${id}`); 
                toast.success('Article deleted!'); 
                queryClient.setQueryData(['articles'], old => old.filter(a => a._id !== id));
                if (editingArticle?._id === id) handleCancelEditArticle(); 
            } catch (e) { /* Handled by interceptor */ } 
            finally { setActionLoading({ type: null, id: null }); } 
        } 
    };
    const handleArticleUpdated = (updated) => { 
        queryClient.setQueryData(['articles'], old => old.map(a => a._id === updated._id ? updated : a));
        handleCancelEditArticle(); 
    };
    const handleArticleAdded = (added) => { 
        queryClient.setQueryData(['articles'], old => [added, ...old]);
        setPreviewArticle(null); 
    };

    // FAQ Handlers
    const handleEditFaqClick = (faq) => { setEditingFaq(faq); };
    const handleCancelEditFaq = () => { setEditingFaq(null); };
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
    const handleFaqUpdated = (updated) => { 
        queryClient.setQueryData(['adminFaqs'], old => old.map(f => f._id === updated._id ? updated : f));
        handleCancelEditFaq(); 
    };
    const handleFaqAdded = (added) => { 
        queryClient.setQueryData(['adminFaqs'], old => [added, ...old]);
    };

    return (
      <>
        <SEO title="Admin Dashboard" description="Admin control panel." keywords="admin, dashboard" path={pathname}/>
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 text-left">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h1 className="text-3xl font-bold mb-4 md:mb-0">Admin Dashboard</h1>
            {view !== 'stats' && (
                <div className="relative w-full md:w-64">
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-google-blue focus:outline-none"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
                </div>
            )}
          </div>

          <div className="mb-6 border-b flex flex-wrap overflow-x-auto">
            <button onClick={() => setView('stats')} className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap transition-colors ${view === 'stats' ? 'border-b-2 border-google-blue text-google-blue' : 'text-gray-600 hover:text-gray-900'}`}><FontAwesomeIcon icon={faChartBar} /> Overview</button>
            <button onClick={() => setView('projects')} className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap transition-colors ${view === 'projects' ? 'border-b-2 border-google-blue text-google-blue' : 'text-gray-600 hover:text-gray-900'}`}><FontAwesomeIcon icon={faTools} /> Project Requests</button>
            <button onClick={() => setView('orders')} className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap transition-colors ${view === 'orders' ? 'border-b-2 border-google-blue text-google-blue' : 'text-gray-600 hover:text-gray-900'}`}><FontAwesomeIcon icon={faClipboardList} /> Std Payments</button>
            <button onClick={() => setView('services')} className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap transition-colors ${view === 'services' ? 'border-b-2 border-google-blue text-google-blue' : 'text-gray-600 hover:text-gray-900'}`}><FontAwesomeIcon icon={faLayerGroup} /> Services</button>
            <button onClick={() => setView('articles')} className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap transition-colors ${view === 'articles' ? 'border-b-2 border-google-blue text-google-blue' : 'text-gray-600 hover:text-gray-900'}`}><FontAwesomeIcon icon={faNewspaper} /> Articles</button>
            <button onClick={() => setView('faqs')} className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap transition-colors ${view === 'faqs' ? 'border-b-2 border-google-blue text-google-blue' : 'text-gray-600 hover:text-gray-900'}`}><FontAwesomeIcon icon={faQuestionCircle} /> FAQs</button>
            <button onClick={() => setView('users')} className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap transition-colors ${view === 'users' ? 'border-b-2 border-google-blue text-google-blue' : 'text-gray-600 hover:text-gray-900'}`}><FontAwesomeIcon icon={faUsers} /> Users</button>
          </div>

          {isLoading ? (
              (view === 'services' || view === 'articles' || view === 'faqs') ? <AdminContentSkeleton /> : <AdminTableSkeleton />
          ) : (
            <>
              {/* Stats View */}
              {view === 'stats' && stats && (
                  <div className="space-y-8 animate-fadeIn">
                      
                      {/* 1. UNIFIED PENDING ACTION QUEUE */}
                      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-400">
                          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                              <FontAwesomeIcon icon={faExclamationCircle} className="text-yellow-500" />
                              Action Required: Pending Verifications
                          </h3>
                          {stats.pendingQueue && stats.pendingQueue.length > 0 ? (
                              <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                          <tr>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User & Service</th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">UTR</th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                          </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                          {stats.pendingQueue.map((item) => (
                                              <tr key={`${item.type}-${item.id}`}>
                                                  <td className="px-4 py-3 text-sm">
                                                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.paymentType === 'standard' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                          {item.type}
                                                      </span>
                                                  </td>
                                                  <td className="px-4 py-3 text-sm">
                                                      <p className="font-medium">{item.user}</p>
                                                      <p className="text-xs text-gray-500">{item.service}</p>
                                                  </td>
                                                  <td className="px-4 py-3 text-sm font-bold">₹{item.amount}</td>
                                                  <td className="px-4 py-3 text-sm font-mono">{item.utr}</td>
                                                  <td className="px-4 py-3 text-sm">
                                                      <div className="flex gap-2">
                                                          {item.paymentType === 'standard' ? (
                                                              <>
                                                                  <button onClick={() => approveOrderMutation.mutate(item.id)} disabled={actionLoading.id === item.id} className="text-green-600 hover:bg-green-50 px-2 py-1 rounded font-medium text-xs border border-green-200">Approve</button>
                                                                  <button onClick={() => rejectOrderMutation.mutate(item.id)} disabled={actionLoading.id === item.id} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded font-medium text-xs border border-red-200">Reject</button>
                                                              </>
                                                          ) : (
                                                              <>
                                                                  <button onClick={() => approveProjectPayment(item.id, item.paymentType)} disabled={actionLoading.id === item.id} className="text-green-600 hover:bg-green-50 px-2 py-1 rounded font-medium text-xs border border-green-200">Approve</button>
                                                                  <button onClick={() => rejectProjectPayment(item.id, item.paymentType)} disabled={actionLoading.id === item.id} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded font-medium text-xs border border-red-200">Reject</button>
                                                              </>
                                                          )}
                                                      </div>
                                                  </td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          ) : (
                              <p className="text-gray-500 text-sm">No pending payments! All caught up. 🎉</p>
                          )}
                      </div>

                      {/* 2. Metrics Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
                              <h3 className="text-gray-500 text-sm font-medium uppercase">Total Revenue</h3>
                              <p className="text-3xl font-bold text-gray-800 mt-2">₹{stats.totalRevenue.toLocaleString()}</p>
                          </div>
                          <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100">
                              <h3 className="text-gray-500 text-sm font-medium uppercase">Total Orders</h3>
                              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalOrders}</p>
                          </div>
                          <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-100">
                              <h3 className="text-gray-500 text-sm font-medium uppercase">Project Requests</h3>
                              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalProjectRequests}</p>
                          </div>
                          <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
                              <h3 className="text-gray-500 text-sm font-medium uppercase">Total Users</h3>
                              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalUsers}</p>
                          </div>
                      </div>

                      {/* 3. Revenue Chart */}
                      <div className="bg-white p-6 rounded-lg shadow-sm border">
                          <h3 className="text-lg font-bold mb-4">Revenue Trends</h3>
                          <div className="h-80 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={stats.chartData}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="name" />
                                      <YAxis />
                                      <Tooltip />
                                      <Legend />
                                      <Bar dataKey="revenue" fill="#4285F4" name="Revenue (INR)" />
                                  </BarChart>
                              </ResponsiveContainer>
                          </div>
                      </div>
                  </div>
              )}

              {/* ORDERS TABLE */}
              {view === 'orders' && (<div><h2 className="text-xl font-semibold mb-4">Pending Standard Verifications</h2><div className="bg-white shadow rounded-lg overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UPI Reference ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{getRenderData(pendingOrders).map(order => (<tr key={order._id}><td className="px-6 py-4 whitespace-nowrap text-sm">{order.user?.email}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{order.service?.title}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(order.createdAt).toLocaleString()}</td><td className="px-6 py-4 whitespace-nowrap font-mono text-sm break-all">{order.transactionId}</td><td className="px-6 py-4"><div className="flex items-center gap-2"><button onClick={() => approveOrderMutation.mutate(order._id)} disabled={actionLoading.id === order._id} className="w-24 flex items-center justify-center gap-1 px-3 py-1 bg-green-500 text-white text-xs rounded disabled:bg-green-300 hover:bg-green-600">{actionLoading.type === 'approve' && actionLoading.id === order._id ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faCheck} /> Approve</>}</button><button onClick={() => rejectOrderMutation.mutate(order._id)} disabled={actionLoading.id === order._id} className="w-24 flex items-center justify-center gap-1 px-3 py-1 bg-red-500 text-white text-xs rounded disabled:bg-red-300 hover:bg-red-600">{actionLoading.type === 'reject' && actionLoading.id === order._id ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faTimes} /> Reject</>}</button></div></td></tr>))}</tbody></table></div></div>)}
              
              {/* SERVICES MANAGEMENT */}
              {view === 'services' && (<div className="grid lg:grid-cols-2 gap-8 items-start"><div className="space-y-8"><AddServiceForm key={editingService ? editingService._id : 'new'} serviceToEdit={editingService} onServiceAdded={handleServiceAdded} onServiceUpdated={handleServiceUpdated} onCancelEdit={handleCancelEditService} onFormChange={setPreviewData}/><div className="mt-8"><h2 className="text-xl font-semibold mb-4">Existing Services</h2><div className="space-y-4">{getRenderData(services).map(s => (<div key={s._id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"><div><strong className="block">{s.title}</strong>
                        <span className="text-sm text-gray-600">{s.serviceType === 'custom' ? `Custom (Total: ₹${s.price}, Adv: ₹${s.advanceAmount})` : `Standard (₹${s.price})`}</span>
                        {s.offer?.name && (
                            <div className="text-xs mt-1 p-1.5 bg-green-100 text-green-800 rounded-md">
                                <p><FontAwesomeIcon icon={faTag} /> <strong>{s.offer.name}</strong> @ ₹{s.offer.price}</p>
                                <p><FontAwesomeIcon icon={faCalendarDays} /> {new Date(s.offer.startDate).toLocaleDateString()} - {new Date(s.offer.endDate).toLocaleDateString()}</p>
                            </div>
                        )}
                        </div><div className="flex gap-2 flex-shrink-0 flex-wrap justify-start sm:justify-end">
                            {s.offer?.name ? 
                            <button onClick={() => removeOfferHandler(s._id)} disabled={actionLoading.id === s._id} className="flex items-center gap-1 text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"><FontAwesomeIcon icon={faTimes} /> Remove Offer</button> :
                            <button onClick={() => setOfferModalService(s)} className="flex items-center gap-1 text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"><FontAwesomeIcon icon={faTag} /> Set Offer</button>}
                        <button onClick={() => handleEditServiceClick(s)} className="flex items-center gap-1 text-sm px-3 py-1 bg-yellow-400 text-yellow-900 rounded hover:bg-yellow-500"><FontAwesomeIcon icon={faEdit} /> Edit</button><button onClick={() => deleteServiceMutation.mutate(s._id)} disabled={actionLoading.id === s._id} className="w-20 flex items-center justify-center gap-1 text-sm px-3 py-1 bg-red-500 text-white rounded disabled:bg-red-300 hover:bg-red-600">{actionLoading.type === 'delete-service' && actionLoading.id === s._id ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faTrash} /> Delete</>}</button></div></div>))}</div></div></div><div className="sticky top-20"><div className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-700"><FontAwesomeIcon icon={faEye} />Live Preview</div><div className="border-4 border-gray-200 rounded-xl overflow-hidden bg-white"><div className="bg-gray-800 p-2 flex items-center gap-2"><span className="h-3 w-3 bg-red-500 rounded-full"></span><span className="h-3 w-3 bg-yellow-500 rounded-full"></span><span className="h-3 w-3 bg-green-500 rounded-full"></span></div><div className="max-h-[75vh] overflow-y-auto bg-gray-50">{previewData && previewData.serviceType === 'custom' ? <CustomProjectForm service={previewData} onSubmit={() => toast.info('This is a preview form.')} /> : <ServicePagePreview service={previewData} onPurchase={() => toast.success('Preview Purchase Button Clicked')} />}</div></div></div></div>)}
              
              {view === 'articles' && (
                <div className="grid lg:grid-cols-2 gap-8 items-start">
                    <div className="space-y-8">
                        <AddArticleForm
                            key={editingArticle ? editingArticle._id : 'new-article'}
                            articleToEdit={editingArticle}
                            onArticleAdded={handleArticleAdded}
                            onArticleUpdated={handleArticleUpdated}
                            onCancelEdit={handleCancelEditArticle}
                            onFormChange={setPreviewArticle}
                        />
                        <div className="mt-8">
                            <h2 className="text-xl font-semibold mb-4">Existing Articles</h2>
                            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                {getRenderData(articles).map(article => (
                                    <div key={article._id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div>
                                            <strong className="block">{article.title}</strong>
                                            <span className="text-sm text-gray-500">Published: {new Date(article.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button onClick={() => handleEditArticleClick(article)} className="flex items-center gap-1 text-sm px-3 py-1 bg-yellow-400 text-yellow-900 rounded hover:bg-yellow-500"><FontAwesomeIcon icon={faEdit} /> Edit</button>
                                            <button onClick={() => handleDeleteArticle(article._id)} disabled={actionLoading.id === article._id} className="w-20 flex items-center justify-center gap-1 text-sm px-3 py-1 bg-red-500 text-white rounded disabled:bg-red-300 hover:bg-red-600">
                                                {actionLoading.type === 'delete-article' && actionLoading.id === article._id ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faTrash} /> Delete</>}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="sticky top-20">
                        <div className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-700"><FontAwesomeIcon icon={faEye} />Live Preview</div>
                        <div className="border-4 border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-800 p-2 flex items-center gap-2"><span className="h-3 w-3 bg-red-500 rounded-full"></span><span className="h-3 w-3 bg-yellow-500 rounded-full"></span><span className="h-3 w-3 bg-green-500 rounded-full"></span></div>
                            <div className="max-h-[75vh] overflow-y-auto bg-white p-6">
                                <ArticlePreview article={previewArticle || editingArticle} />
                            </div>
                        </div>
                    </div>
                </div>
              )}

              {/* FAQ View */}
              {view === 'faqs' && (
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
                                  {getRenderData(faqs).map(faq => (
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
              )}

              {view === 'users' && (
                  <div>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">All Users</h2>
                        <button onClick={() => exportToCSV(getRenderData(users), 'users.csv')} className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-2 hover:bg-green-700 transition-colors">
                            <FontAwesomeIcon icon={faDownload} /> Export CSV
                        </button>
                      </div>
                      <div className="bg-white shadow rounded-lg overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th></tr></thead>
                              <tbody className="bg-white divide-y divide-gray-200">{getRenderData(users).map(user => (<tr key={user._id}><td className="px-6 py-4 whitespace-nowrap text-sm">{user.name}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td><td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{user.role}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(user.createdAt).toLocaleDateString()}</td></tr>))}</tbody>
                          </table>
                      </div>
                  </div>
              )}
              
              {view === 'projects' && (
                  <div>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Custom Project Requests</h2>
                        <button onClick={() => exportToCSV(getRenderData(projectRequests).map(p => ({ ...p, srsData: JSON.stringify(p.srsData) })), 'project_requests.csv')} className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-2 hover:bg-green-700 transition-colors">
                            <FontAwesomeIcon icon={faDownload} /> Export CSV
                        </button>
                      </div>
                      <div className="bg-white shadow rounded-lg overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium">User & Service</th><th className="px-6 py-3 text-left text-xs font-medium">Status & Date</th><th className="px-6 py-3 text-left text-xs font-medium">Payment Info</th><th className="px-6 py-3 text-left text-xs font-medium">Actions</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{getRenderData(projectRequests).map(req => (<tr key={req._id}><td className="px-6 py-4 text-sm align-top"><div><p className="font-semibold">{req.user?.email}</p><p className="text-gray-500">{req.service?.title}</p></div></td><td className="px-6 py-4 text-sm align-top"><div className="flex flex-col"><span className="capitalize font-semibold">{req.status.replace(/_/g, ' ')}</span><span className="text-gray-500 text-xs">{new Date(req.createdAt).toLocaleDateString()}</span></div></td>
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
                        </div></td></tr>))}</tbody></table></div></div>)}</>)}
        </div>
        
        <OfferModal isOpen={!!offerModalService} service={offerModalService} onClose={() => setOfferModalService(null)} onOfferSet={handleServiceUpdated}/>
        <SrsViewModal isOpen={!!srsViewRequest} request={srsViewRequest} onClose={() => setSrsViewRequest(null)}/>
        {isRequestModalOpen && selectedRequest && (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={closeRequestModal}><div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}><div className="p-6 border-b"><h3 className="text-xl font-bold">Manage Request: {selectedRequest.service.title}</h3><p className="text-sm text-gray-500">From: {selectedRequest.user?.email || 'User Not Found'}</p></div><div className="p-6 space-y-4 overflow-y-auto"><div className="grid grid-cols-2 gap-4"><div><h4 className="font-semibold text-sm">Advance Payment</h4><p>Amount: ₹{selectedRequest.advance.amount || 'N/A'}</p><p className="break-all">UTR: {selectedRequest.advance.transactionId || 'N/A'}</p><p>Status: <span className='capitalize'>{selectedRequest.advance.status || 'N/A'}</span></p></div><div><h4 className="font-semibold text-sm">Full Payment</h4><p>Amount: ₹{selectedRequest.fullPayment.amount || 'N/A'}</p><p className="break-all">UTR: {selectedRequest.fullPayment.transactionId || 'N/A'}</p><p>Status: <span className='capitalize'>{selectedRequest.fullPayment.status || 'N/A'}</span></p></div></div><h4 className="font-semibold pt-4 border-t">Submitted Requirements (SRS)</h4><div className="bg-gray-50 p-4 rounded-md border space-y-3 max-h-48 overflow-y-auto">{Object.entries(selectedRequest.srsData).map(([key, value]) => (<div key={key}><p className="font-medium text-sm text-gray-800">{key}</p><p className="text-sm text-gray-600 whitespace-pre-wrap">{value}</p></div>))}</div><h4 className="font-semibold pt-4 border-t">Project Management</h4><div><label className="block text-sm font-medium text-gray-700">Full Payment Amount (INR)</label><div className="flex items-center gap-2 mt-1"><FontAwesomeIcon icon={faDollarSign} className="text-gray-400"/><input type="number" placeholder="e.g., 5000" value={fullAmount} onChange={e => setFullAmount(e.target.value)} disabled={selectedRequest.service?.price > 0} className="w-full p-2 border rounded-md disabled:bg-gray-100 focus:ring-2 focus:ring-google-blue focus:outline-none" /></div><p className="text-xs text-gray-500 mt-1">{selectedRequest.service?.price > 0 ? "Amount is auto-calculated from service's fixed price." : "Setting this will request the full payment from the user if the project is 'in progress'."}</p></div><div><label className="block text-sm font-medium text-gray-700">Final Project Content / Deliverables</label><div className="space-y-2 mt-1">{finalContent.map((item, index) => (<div key={index} className="flex items-center gap-2"><input type="text" name="name" placeholder="File Name (e.g., 'Project Report')" value={item.name} onChange={e => handleFinalContentChange(index, e)} className="w-1/2 p-2 border rounded focus:ring-2 focus:ring-google-blue focus:outline-none" /><input type="url" name="url" placeholder="URL" value={item.url} onChange={e => handleFinalContentChange(index, e)} className="w-1/2 p-2 border rounded focus:ring-2 focus:ring-google-blue focus:outline-none" /><button type="button" onClick={() => removeFinalContentField(index)} className="p-2 bg-red-500 text-white rounded font-bold h-fit hover:bg-red-600">&times;</button></div>))}<button type="button" onClick={addFinalContentField} className="text-sm text-google-blue hover:underline mt-2">+ Add More</button></div></div></div><div className="p-4 bg-gray-50 border-t flex justify-end gap-3"><button onClick={closeRequestModal} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button><button onClick={handleUpdateRequest} disabled={actionLoading.id === selectedRequest._id} className="px-4 py-2 bg-google-blue text-white rounded-md disabled:bg-blue-300 hover:bg-blue-700">{actionLoading.type === 'update' ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Save Changes'}</button></div></div></div>)}
      </>
    )
};