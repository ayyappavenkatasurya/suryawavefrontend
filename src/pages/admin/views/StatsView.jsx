import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../../services';
import { SkeletonPulse } from '../../../components';

export const StatsView = ({ approveOrderMutation, rejectOrderMutation, approveProjectPayment, rejectProjectPayment, actionLoading }) => {
    
    const { data: stats, isLoading } = useQuery({
        queryKey: ['adminStats'],
        queryFn: async () => (await api.get('/api/admin/stats')).data,
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-4 gap-4 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>)}
            </div>
        );
    }

    if (!stats) return null;

    return (
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
    );
};