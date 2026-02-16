import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import api from '../../../services';
import { AdminTableSkeleton } from '../AdminComponents';

export const UsersView = ({ getRenderData }) => {
    const { data: users = [], isLoading } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: async () => (await api.get('/api/admin/users')).data,
    });

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

    const displayedUsers = getRenderData(users);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">All Users</h2>
                <button onClick={() => exportToCSV(displayedUsers, 'users.csv')} className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-2 hover:bg-green-700 transition-colors">
                    <FontAwesomeIcon icon={faDownload} /> Export CSV
                </button>
            </div>
            <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">{displayedUsers.map(user => (<tr key={user._id}><td className="px-6 py-4 whitespace-nowrap text-sm">{user.name}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td><td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{user.role}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(user.createdAt).toLocaleDateString()}</td></tr>))}</tbody>
                </table>
            </div>
        </div>
    );
};