import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SEO } from '../components';

export const NotFoundPage = () => {
    const { pathname } = useLocation();
    return (
        <>
        <SEO title="404 Not Found" description="The page you are looking for does not exist." keywords="404, not found, error" path={pathname}/>
        <div className="container mx-auto text-center py-20 px-4 sm:px-6 lg:px-8">
            <h1 className="text-6xl font-bold text-google-blue">404</h1>
            <p className="text-2xl mt-4">Page Not Found</p>
            <p className="text-gray-600 mt-2">The page you're looking for doesn't seem to exist.</p>
            <Link to="/" className="inline-block mt-6 px-6 py-2 bg-google-blue text-white rounded">Go to Homepage</Link>
        </div>
        </>
    );
}