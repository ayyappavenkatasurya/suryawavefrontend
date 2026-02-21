// frontend/src/pages/userpages.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SEO, Spinner, ServiceContentModal, DashboardItemSkeleton, SkeletonPulse } from '../components';
import { useAuth } from '../context';
import api from '../services';
import { requestForToken } from '../firebase.jsx';
import { getSocket } from '../socket.js';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHistory, faSpinner, faFolderOpen, faShareNodes, faBell, faSignOutAlt, faUserShield, faTrashAlt, faBolt
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { LazyImage } from '../components/LazyImage';

// ========== NotificationSettings Component ==========
const NotificationSettings = () => {
    const [permission, setPermission] = useState('Notification' in window ? Notification.permission : 'default');
    const [loading, setLoading] = useState(false);

    const handleEnable = async () => {
        setLoading(true);
        const token = await requestForToken();
        if (token) {
            setPermission('granted');
        } else {
            setPermission(Notification.permission); 
        }
        setLoading(false);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border text-left">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faBell} className="text-google-yellow" />
                Push Notifications
            </h3>
            {permission === 'granted' && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-green-700 font-medium">Notifications are enabled on this device.</p>
                </div>
            )}
            {permission === 'default' && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Get real-time updates.</p>
                    <button 
                        onClick={handleEnable} 
                        disabled={loading}
                        className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center justify-center gap-2 disabled:bg-gray-200"
                    >
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faBell}/>}
                        Enable
                    </button>
                </div>
            )}
            {permission === 'denied' && (
                <p className="text-sm text-red-700 p-2 bg-red-50 rounded-md">
                    Notifications are blocked in your browser settings.
                </p>
            )}
        </div>
    );
};

// ========== PROFILE PAGE COMPONENT ==========
export const ProfilePage = () => {
    const { user, logout, loading } = useAuth();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = useState(false);

    const getInitials = (email) => {
        if (!email) return '';
        return email.substring(0, 2).toUpperCase();
    };
    
    const handleLogout = () => {
        logout();
        toast.success("Logged out successfully.");
        navigate('/login');
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Are you sure? This will PERMANENTLY delete your account and all associated data.")) {
            return;
        }
        
        setIsDeleting(true);
        try {
            await api.delete('/api/auth/delete');
            toast.success("Account deleted successfully.");
            logout(); 
            navigate('/');
        } catch (error) {
            toast.error("Failed to delete account.");
            console.error("Delete account error:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <Spinner />;
    if (!user) return null;

    return (
        <>
            <SEO title="My Profile" description="Manage your profile, settings, and notifications." keywords="profile, settings, account" path={pathname} />
            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-left max-w-xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="h-24 w-24 rounded-full bg-gray-800 flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-md">
                        {getInitials(user.email)}
                    </div>
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <p className="text-gray-600">{user.email}</p>
                </div>

                <div className="space-y-6">
                    <NotificationSettings />

                    {user.role === 'admin' && (
                        <Link to="/admin" className="block w-full text-left bg-white p-4 rounded-lg shadow-sm border hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <FontAwesomeIcon icon={faUserShield} className="text-google-red" />
                                    Admin Panel
                                </h3>
                                <span className="text-gray-400">&rarr;</span>
                            </div>
                        </Link>
                    )}

                    <button
                        onClick={handleLogout}
                        className="w-full bg-white p-4 rounded-lg shadow-sm border hover:bg-gray-50 transition-colors text-blue-600 font-semibold flex items-center gap-3"
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} />
                        Logout
                    </button>

                    <div className="pt-4 border-t">
                        <button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="w-full bg-red-50 p-4 rounded-lg shadow-sm border border-red-200 hover:bg-red-100 transition-colors text-red-700 font-semibold flex items-center gap-3 justify-center"
                        >
                            {isDeleting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTrashAlt} />}
                            Delete My Account
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

// ========== DashboardItem Component ==========
const DashboardItem = React.memo(({ item, openContentModal }) => {
    const [isSharing, setIsSharing] = useState(false);

    const getStatusBadge = (status) => {
        const normalizedStatus = status.toLowerCase().replace(/_/g, ' ');
        switch (normalizedStatus) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in progress': return 'bg-blue-100 text-blue-800';
            case 'payment pending': return 'bg-orange-100 text-orange-800';
            case 'pending':
            case 'advance pending':
            case 'final payment pending':
            case 'pending advance':
                return 'bg-yellow-100 text-yellow-800';
            case 'submitted': return 'bg-indigo-100 text-indigo-800';
            case 'rejected':
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const handleShare = async () => {
      const service = item.rawItem.service;
      
      if (!service || !service.slug) {
        toast.error('Service link not available.');
        return;
      }
      
      setIsSharing(true);
      const shareData = {
          title: service.title,
          text: service.description || service.title,
          url: `${window.location.origin}/services/${service.slug}`,
      };

      try {
          if (navigator.share) {
              await navigator.share(shareData);
          } else {
              await navigator.clipboard.writeText(shareData.url);
              toast.success('Link copied to clipboard!');
          }
      } catch (error) {
          if (error.name !== 'AbortError') {
              toast.error('Could not share.');
          }
      } finally {
          setIsSharing(false);
      }
    };

    const handleOpen = () => {
        if (item.type === 'standard') {
            openContentModal(item.rawItem.service);
        } else if (item.type === 'custom') {
            const modalData = {
                ...item.rawItem.service,
                contentUrls: item.rawItem.finalProjectContent || []
            };
            openContentModal(modalData);
        }
    };

    const statusText = item.status.replace(/_/g, ' ');

    return (
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border flex flex-row gap-4 transition-transform hover:shadow-md animate-fadeIn">
            <LazyImage src={item.imageUrl} alt={item.title} className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-md flex-shrink-0" containerClassName="rounded-md" />
            <div className="flex-grow text-left">
                <div className="flex flex-wrap gap-2 items-center mb-1">
                    <span className={`capitalize text-xs font-medium px-2 py-1 rounded-full ${getStatusBadge(item.status)}`}>{statusText}</span>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {item.type === 'custom' ? 'Advanced' : item.type}
                    </span>
                </div>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-1 mb-3">Last updated: {new Date(item.date).toLocaleString()}</p>
                
                {(() => {
                    const utr = item.rawItem.transactionId || 
                                item.rawItem.fullPayment?.transactionId || 
                                item.rawItem.advance?.transactionId;
                    if (utr) {
                        return (
                            <p className="text-xs text-gray-500 break-all mb-3">
                                UTR: <span className="font-mono">{utr}</span>
                            </p>
                        );
                    }
                    return null;
                })()}

                <div className="flex flex-wrap gap-2 items-center">
                    {/* STANDARD COMPLETED */}
                    {item.type === 'standard' && item.status === 'completed' && (
                        <>
                            <button onClick={handleOpen} className="px-3 py-1.5 text-sm bg-google-blue text-white rounded-md hover:bg-blue-700 flex items-center gap-2"><FontAwesomeIcon icon={faFolderOpen}/> Open</button>
                            <button onClick={handleShare} disabled={isSharing} className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2 disabled:bg-gray-400">
                                {isSharing ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faShareNodes}/>}
                                Share
                            </button>
                            <a href="https://g.page/r/CSFWx7NoCT-iEBM/review" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm bg-yellow-400 text-yellow-900 rounded-md hover:bg-yellow-500 flex items-center gap-2">
                                <FontAwesomeIcon icon={faGoogle} /> Review
                            </a>
                        </>
                    )}

                    {/* CUSTOM PROJECT STATUSES */}
                    {item.type === 'custom' && item.status === 'submitted' && <p className="text-sm text-indigo-700 p-2 bg-indigo-100 rounded-md text-center">Request under review</p>}
                    
                    {item.type === 'custom' && item.status === 'pending_advance' && (
                        <>
                            {item.rawItem.advance.status === 'failed' && <p className="text-sm text-red-700 w-full text-center font-semibold">Verification failed. Please try again.</p>}
                            <a href={`https://wa.me/${import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2 justify-center"><FontAwesomeIcon icon={faWhatsapp}/> Chat</a>
                            <Link to={`/request-advance-payment/${item.id}`} className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-center">
                                {item.rawItem.advance.status === 'failed' ? 'Retry Payment' : 'Pay Advance'} (₹{item.rawItem.advance.amount})
                            </Link>
                        </>
                    )}
                    
                    {item.type === 'custom' && item.status === 'in_progress' && <a href={`https://wa.me/${import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2 justify-center"><FontAwesomeIcon icon={faWhatsapp}/> Chat with Developer</a>}
                    
                    {item.type === 'custom' && item.status === 'payment_pending' && (
                        <>
                             {item.rawItem.fullPayment.status === 'failed' && <p className="text-sm text-red-700 w-full text-center font-semibold">Verification failed. Please try again.</p>}
                            <Link to={`/request-full-payment/${item.id}`} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 text-center">
                                {item.rawItem.fullPayment.status === 'failed' ? 'Retry Final Payment' : 'Pay Final Amount'} (₹{item.rawItem.fullPayment.amount})
                            </Link>
                        </>
                    )}
                    
                    {item.type === 'custom' && (item.status === 'advance_pending' || item.status === 'final_payment_pending') && <p className="text-sm text-yellow-700 p-2 bg-yellow-100 rounded-md text-center">Verification Pending</p>}
                    
                    {/* CUSTOM COMPLETED */}
                    {item.type === 'custom' && item.status === 'completed' && (
                        <>
                            <button onClick={handleOpen} className="px-3 py-1.5 text-sm bg-google-blue text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                                <FontAwesomeIcon icon={faFolderOpen}/> Open
                            </button>
                             <button onClick={handleShare} disabled={isSharing} className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2 disabled:bg-gray-400">
                                {isSharing ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faShareNodes}/>}
                                Share
                            </button>
                            <a href="https://g.page/r/CSFWx7NoCT-iEBM/review" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm bg-yellow-400 text-yellow-900 rounded-md hover:bg-yellow-500 flex items-center gap-2">
                                <FontAwesomeIcon icon={faGoogle} /> Review
                            </a>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});
DashboardItem.displayName = 'DashboardItem';

// --- PaymentSubmissionHistory Component ---
const PaymentSubmissionHistory = ({ requests, orders }) => {
    const paymentHistory = useMemo(() => {
        const history = [];

        requests.forEach(req => {
            if (req.advance && req.advance.transactionId) {
                history.push({
                    type: 'Advance',
                    service: req.service?.title || 'Unknown',
                    amount: req.advance.amount,
                    transactionId: req.advance.transactionId,
                    status: req.advance.status || (req.status === 'advance_pending' ? 'pending' : 'unknown'),
                    date: req.updatedAt,
                });
            }
            if (req.fullPayment && req.fullPayment.transactionId) {
                history.push({
                    type: 'Final',
                    service: req.service?.title || 'Unknown',
                    amount: req.fullPayment.amount,
                    transactionId: req.fullPayment.transactionId,
                    status: req.fullPayment.status || (req.status === 'final_payment_pending' ? 'pending' : 'unknown'),
                    date: req.updatedAt,
                });
            }
        });

        orders.forEach(order => {
            history.push({
                type: 'Standard',
                service: order.service?.title || 'Unknown Service',
                amount: order.amount,
                transactionId: order.transactionId,
                status: order.status,
                date: order.createdAt
            });
        });

        return history.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [requests, orders]);

    if (paymentHistory.length === 0) {
        return <p className="text-sm text-gray-600 text-center bg-gray-50 p-4 rounded-lg border">No payment submissions found.</p>;
    }

    const getStatusBadge = (status) => {
        const normalizedStatus = status.toLowerCase();
        switch (normalizedStatus) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-3">
            {paymentHistory.map((payment, index) => (
                <div key={index} className="bg-white p-3 rounded-lg shadow-sm border animate-fadeIn flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`capitalize px-2 py-0.5 text-[10px] font-bold rounded-sm ${getStatusBadge(payment.status)}`}>
                                {payment.status === 'pending' ? 'Verification Pending' : payment.status}
                            </span>
                            <span className="text-xs text-gray-500 font-medium border px-1.5 rounded">{payment.type}</span>
                        </div>
                        <p className="font-semibold text-sm line-clamp-1">{payment.service}</p>
                        <p className="text-xs text-gray-500 mt-1">UTR: <span className="font-mono bg-gray-50 px-1 rounded border">{payment.transactionId}</span></p>
                    </div>
                    <div className="sm:text-right flex flex-row sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                         <span className="font-bold text-lg text-gray-800">₹{payment.amount}</span>
                         <p className="text-[10px] text-gray-400 font-medium">{new Date(payment.date).toLocaleString()}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ========== USER DASHBOARD PAGE ==========
export const UserDashboardPage = () => {
    const { user, loading: userLoading } = useAuth();
    const { pathname } = useLocation();
    const queryClient = useQueryClient();
    
    // ✅ FIX: Strict socket listener management
    useEffect(() => {
        const socket = getSocket();
        
        const handleUpdate = () => {
            console.log("⚡ Real-time update received!");
            toast.success("Dashboard updated!", { id: 'live-update', duration: 2000, icon: '⚡' });
            queryClient.invalidateQueries({ queryKey: ['myOrders'] });
            queryClient.invalidateQueries({ queryKey: ['myProjectRequests'] });
        };

        socket.on('order_updated', handleUpdate);
        socket.on('project_updated', handleUpdate);

        return () => {
            socket.off('order_updated', handleUpdate);
            socket.off('project_updated', handleUpdate);
        };
    }, [queryClient]);

    const { data: orders = [], isLoading: ordersLoading } = useQuery({
        queryKey: ['myOrders'],
        queryFn: async () => {
            const { data } = await api.get('/api/orders/myorders');
            return data;
        },
        enabled: !!user,
        staleTime: Infinity, 
    });

    const { data: projectRequests = [], isLoading: requestsLoading } = useQuery({
        queryKey: ['myProjectRequests'],
        queryFn: async () => {
            const { data } = await api.get('/api/project-requests/my-requests');
            return data;
        },
        enabled: !!user,
        staleTime: Infinity, 
    });

    const dataLoading = ordersLoading || requestsLoading;
    
    const [isContentModalOpen, setContentModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
  
    const openContentModal = (service) => { setSelectedService(service); setContentModalOpen(true); };
  
    const dashboardItems = useMemo(() => {
        if (!orders || !projectRequests) return [];

        const customItems = projectRequests.map(req => ({
            id: req._id,
            type: 'custom',
            date: req.updatedAt,
            title: req.service?.title || 'Unknown',
            imageUrl: req.service?.imageUrl || '/logo.png',
            status: req.status,
            rawItem: req,
        }));
        
        const standardItems = orders.map(order => ({
            id: order._id,
            type: 'standard',
            date: order.updatedAt,
            title: order.service?.title || 'Unknown',
            imageUrl: order.service?.imageUrl || '/logo.png',
            status: order.status,
            rawItem: order,
        }));

        return [...customItems, ...standardItems].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [projectRequests, orders]);

    if (userLoading) return <Spinner />;
  
    return (
      <>
        <SEO title="Dashboard" description="Manage your account, services, and projects." keywords="dashboard, account, my services, my projects" path={pathname}/>
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-left">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="flex items-center w-fit gap-2 text-xs text-google-green font-medium bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                <FontAwesomeIcon icon={faBolt} className="animate-pulse" /> Live Connection Active
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* MY SERVICES & PROJECTS SECTION */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">My Purchases</h2>
                <div className="space-y-4">
                    {dataLoading ? (
                        Array.from({ length: 3 }).map((_, i) => <DashboardItemSkeleton key={i} />)
                    ) : dashboardItems.length > 0 ? (
                        dashboardItems.map(item => (
                            <DashboardItem 
                                key={`${item.type}-${item.id}`}
                                item={item}
                                openContentModal={openContentModal}
                            />
                        ))
                    ) : (
                        <div className="bg-white p-8 rounded-lg border border-dashed border-gray-300 text-center">
                            <p className="text-gray-500 mb-4">You have not purchased any services or requested any projects yet.</p>
                            <Link to="/services" className="inline-block px-6 py-2 bg-google-blue text-white rounded-md font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                                Explore Services
                            </Link>
                        </div>
                    )}
                </div>
              </div>
              
              {/* PAYMENT HISTORY SECTION */}
              <div className="lg:col-span-1">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
                  <FontAwesomeIcon icon={faHistory} className="text-gray-400" />
                  Transactions
                </h2>
                {dataLoading ? (
                    <div className="space-y-3">
                        <SkeletonPulse className="h-24 w-full rounded-lg" />
                        <SkeletonPulse className="h-24 w-full rounded-lg" />
                    </div>
                ) : (
                    <PaymentSubmissionHistory requests={projectRequests} orders={orders} />
                )}
              </div>
          </div>

        </div>

        <ServiceContentModal service={selectedService} isOpen={isContentModalOpen} onClose={() => setContentModalOpen(false)} />
      </>
    );
};