// frontend/src/pages/admin/AdminDashboard.jsx

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'; // Added useQuery
import { SEO } from '../../components';
import api from '../../services';
import Fuse from 'fuse.js';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faClipboardList, faUsers, faLayerGroup, 
    faTools, faNewspaper, faQuestionCircle, faChartBar, faSearch, faSync
} from '@fortawesome/free-solid-svg-icons';

import { StatsView } from './views/StatsView';
import { OrdersView } from './views/OrdersView';
import { ServicesView } from './views/ServicesView';
import { ArticlesView } from './views/ArticlesView';
import { FaqsView } from './views/FaqsView';
import { UsersView } from './views/UsersView';
import { ProjectRequestsView } from './views/ProjectRequestsView';

export const AdminDashboardPage = () => {
    const [view, setView] = useState('stats');
    const [searchQuery, setSearchQuery] = useState('');
    const { pathname } = useLocation();
    const queryClient = useQueryClient();

    // Global loading state for mutations
    const [actionLoading, setActionLoading] = useState({ type: null, id: null });

    // === REAL-TIME DATA FETCHING (Polling Stats) ===
    // We fetch stats here to show the "pending count" or live revenue, passing data down or relying on cached query key in StatsView
    const { isFetching: isStatsFetching } = useQuery({
        queryKey: ['adminStats'],
        queryFn: async () => (await api.get('/api/admin/stats')).data,
        refetchInterval: 5000, // Poll every 5s for new orders
    });

    // === MUTATIONS (With Optimistic Updates) ===

    // Order Approval
    const approveOrderMutation = useMutation({
        mutationFn: (id) => api.put(`/api/admin/orders/${id}/approve`),
        onMutate: async (id) => {
            setActionLoading({ type: 'approve', id });
            await queryClient.cancelQueries(['adminOrders']);
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
        onSettled: () => {
            setActionLoading({ type: null, id: null });
            queryClient.invalidateQueries(['services']);
        },
        onSuccess: () => toast.success('Service deleted!')
    });

    // Project Actions
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
        }
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

    const handleServiceUpdated = (updated) => { 
        queryClient.setQueryData(['services'], (old) => old.map(s => s._id === updated._id ? updated : s));
    };
    const handleServiceAdded = (added) => { 
        queryClient.setQueryData(['services'], (old) => [added, ...old]);
    };

    // Filter Logic Wrapper
    const getRenderData = (data) => {
        if (!searchQuery.trim()) return data;
        
        let keys = [];
        if (view === 'orders') keys = ['user.email', 'transactionId', 'service.title'];
        else if (view === 'users') keys = ['name', 'email', 'role'];
        else if (view === 'services') keys = ['title', 'category', 'description'];
        else if (view === 'projects') keys = ['user.email', 'service.title', 'status', 'advance.transactionId', 'fullPayment.transactionId'];
        else if (view === 'articles') keys = ['title', 'slug'];
        else if (view === 'faqs') keys = ['question', 'answer'];
        else return data;

        const fuse = new Fuse(data, { keys, threshold: 0.3 });
        return fuse.search(searchQuery).map(result => result.item);
    };

    return (
      <>
        <SEO title="Admin Dashboard" description="Admin control panel." keywords="admin, dashboard" path={pathname}/>
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 text-left">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                {isStatsFetching && (
                    <span className="text-xs font-medium text-google-blue bg-blue-50 px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                        <FontAwesomeIcon icon={faSync} spin /> Live
                    </span>
                )}
            </div>
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

          <div className="min-h-[400px]">
            {view === 'stats' && <StatsView 
                approveOrderMutation={approveOrderMutation} 
                rejectOrderMutation={rejectOrderMutation}
                approveProjectPayment={approveProjectPayment}
                rejectProjectPayment={rejectProjectPayment}
                actionLoading={actionLoading}
            />}
            {view === 'orders' && <OrdersView 
                getRenderData={getRenderData} 
                approveOrderMutation={approveOrderMutation} 
                rejectOrderMutation={rejectOrderMutation} 
                actionLoading={actionLoading}
            />}
            {view === 'services' && <ServicesView 
                getRenderData={getRenderData} 
                deleteServiceMutation={deleteServiceMutation} 
                actionLoading={actionLoading}
                handleServiceAdded={handleServiceAdded}
                handleServiceUpdated={handleServiceUpdated}
            />}
            {view === 'articles' && <ArticlesView 
                getRenderData={getRenderData} 
                actionLoading={actionLoading}
                setActionLoading={setActionLoading}
            />}
            {view === 'faqs' && <FaqsView 
                getRenderData={getRenderData}
                actionLoading={actionLoading}
                setActionLoading={setActionLoading}
            />}
            {view === 'users' && <UsersView 
                getRenderData={getRenderData} 
            />}
            {view === 'projects' && <ProjectRequestsView 
                getRenderData={getRenderData}
                actionLoading={actionLoading}
                setActionLoading={setActionLoading}
                handleApproveRequestClick={handleApproveRequestClick}
                rejectInitialRequest={rejectInitialRequest}
                approveProjectPayment={approveProjectPayment}
                rejectProjectPayment={rejectProjectPayment}
            />}
          </div>
        </div>
      </>
    )
};