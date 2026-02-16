// frontend/src/components/FeedbackComponents.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context';

// --- Skeletons ---

export const SkeletonPulse = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

export const ServiceCardSkeleton = () => (
  <div className="border rounded-lg overflow-hidden shadow-sm bg-white flex flex-col h-full">
    <SkeletonPulse className="w-full h-48" />
    <div className="p-4 md:p-6 flex flex-col flex-grow space-y-4">
      <SkeletonPulse className="h-6 w-3/4" />
      <SkeletonPulse className="h-4 w-1/2" />
      <div className="space-y-2 flex-grow">
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-2/3" />
      </div>
      <div className="pt-4 border-t flex justify-between items-center">
        <SkeletonPulse className="h-8 w-24" />
        <SkeletonPulse className="h-10 w-32" />
      </div>
    </div>
  </div>
);

export const ArticleCardSkeleton = () => (
  <div className="border rounded-lg overflow-hidden shadow-sm bg-white flex flex-col h-full">
    <SkeletonPulse className="w-full h-48" />
    <div className="p-6 flex flex-col flex-grow space-y-4">
      <SkeletonPulse className="h-6 w-full" />
      <SkeletonPulse className="h-4 w-1/3" />
      <div className="space-y-2 flex-grow">
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-5/6" />
        <SkeletonPulse className="h-4 w-4/6" />
      </div>
      <div className="pt-4 border-t">
        <SkeletonPulse className="h-4 w-24" />
      </div>
    </div>
  </div>
);

export const DashboardItemSkeleton = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-row gap-4 animate-pulse">
        <div className="w-24 h-24 bg-gray-200 rounded-md flex-shrink-0"></div>
        <div className="flex-grow space-y-3 py-1">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
    </div>
);

// --- Spinner ---

export const Spinner = () => (
  <div className="flex justify-center items-center h-full min-h-[300px]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-google-blue"></div>
  </div>
);

// --- Route Protection ---

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

export const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  return user && user.role === 'admin' ? children : <Navigate to="/" state={{ from: location }} replace />;
};