import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import api from '../../../services';
import { AdminTableSkeleton } from '../AdminComponents';

export const OrdersView = ({ getRenderData, approveOrderMutation, rejectOrderMutation, actionLoading }) => {
    const { data: pendingOrders = [], isLoading } = useQuery({
        queryKey: ['adminOrders'],
        queryFn: async () => (await api.get('/api/admin/orders')).data,
    });

    if (isLoading) return <AdminTableSkeleton />;

    const orders = getRenderData(pendingOrders);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Pending Standard Verifications</h2>
            <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UPI Reference ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map(order => (
                            <tr key={order._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{order.user?.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{order.service?.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(order.createdAt).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm break-all">{order.transactionId}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => approveOrderMutation.mutate(order._id)} disabled={actionLoading.id === order._id} className="w-24 flex items-center justify-center gap-1 px-3 py-1 bg-green-500 text-white text-xs rounded disabled:bg-green-300 hover:bg-green-600">
                                            {actionLoading.type === 'approve' && actionLoading.id === order._id ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faCheck} /> Approve</>}
                                        </button>
                                        <button onClick={() => rejectOrderMutation.mutate(order._id)} disabled={actionLoading.id === order._id} className="w-24 flex items-center justify-center gap-1 px-3 py-1 bg-red-500 text-white text-xs rounded disabled:bg-red-300 hover:bg-red-600">
                                            {actionLoading.type === 'reject' && actionLoading.id === order._id ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faTimes} /> Reject</>}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};