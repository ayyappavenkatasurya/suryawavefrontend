import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch, 
    faTimes, 
    faFilter, 
    faCheck, 
    faLayerGroup, 
    faRocket, 
    faGift,
    faSync
} from '@fortawesome/free-solid-svg-icons';
import Fuse from 'fuse.js';
import api from '../../services';
import { SEO, ServiceCard, ServiceCardSkeleton, PeopleAlsoAsk } from '../../components';

export const ServicesPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("all"); // all, free, standard, advanced
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef(null);
    const { pathname } = useLocation();
  
    // Fetch Services with Live Updates (Every 5 seconds)
    const { data: services = [], isLoading: servicesLoading, isFetching } = useQuery({
        queryKey: ['services'],
        queryFn: async () => {
            const { data } = await api.get('/api/services');
            return data;
        },
        refetchInterval: 5000, // ✅ LIVE: Updates "Ordered Count" every 5 seconds
        staleTime: 1000 * 60 * 5, 
    });

    // Fetch FAQs
    const { data: faqs = [] } = useQuery({
        queryKey: ['faqs'],
        queryFn: async () => {
            const { data } = await api.get('/api/faqs');
            return data;
        },
        staleTime: 1000 * 60 * 30,
    });

    // Handle Click Outside to close filter menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Memoize Filtered Results
    const filteredServices = useMemo(() => {
        let result = services;

        // 1. Apply Search Query (Fuzzy)
        if (searchQuery.trim()) {
            const fuse = new Fuse(result, {
                keys: ['title', 'description', 'category'],
                threshold: 0.4, 
            });
            result = fuse.search(searchQuery).map(res => res.item);
        }

        // 2. Apply Category Filter
        if (activeFilter !== 'all') {
            result = result.filter(service => {
                if (activeFilter === 'free') {
                    return service.currentPrice === 0;
                }
                if (activeFilter === 'standard') {
                    // Standard means readymade notes/files that are NOT free
                    return service.serviceType === 'standard' && service.currentPrice > 0;
                }
                if (activeFilter === 'advanced') {
                    // Custom projects
                    return service.serviceType === 'custom';
                }
                return true;
            });
        }

        return result;
    }, [services, searchQuery, activeFilter]);
  
    // SEO Schemas
    const itemListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'itemListElement': services.map((service, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'url': `https://suryawave.me/services/${service.slug}`,
            'name': service.title,
            'image': service.imageUrl,
            'description': service.description,
            'offers': {
                '@type': 'Offer',
                'price': service.currentPrice,
                'priceCurrency': 'INR'
            }
        }))
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer.replace(/<[^>]+>/g, '') 
            }
        }))
    };

    const filterOptions = [
        { id: 'all', label: 'All Services', icon: faLayerGroup },
        { id: 'free', label: 'Free Resources', icon: faGift },
        { id: 'standard', label: 'Standard', icon: faSearch },
        { id: 'advanced', label: 'Advanced', icon: faRocket },
    ];
  
    return (
        <>
            <SEO 
                title="Our Services" 
                description="Explore our range of Standard (Readymade) and Advanced (Special) digital services. High quality, affordable prices." 
                keywords="services, standard resources, advanced projects, readymade notes, special requests"
                path={pathname}
            >
                <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
                {faqs.length > 0 && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
            </SEO>
            
            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
                <div className="flex justify-center items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">Explore Services</h1>
                    {/* Live Indicator if updating in background */}
                    {isFetching && !servicesLoading && (
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                            <FontAwesomeIcon icon={faSync} spin /> Live
                        </span>
                    )}
                </div>
                
                {/* Search & Filter Bar */}
                <div className="max-w-2xl mx-auto mb-10 relative z-20" ref={filterRef}>
                    <div className="relative shadow-sm rounded-full bg-white border border-gray-300 hover:border-google-blue hover:shadow-md transition-all duration-300 flex items-center">
                        
                        {/* Search Icon */}
                        <div className="pl-5 text-gray-400 text-lg">
                            <FontAwesomeIcon icon={faSearch} />
                        </div>

                        {/* Input Field */}
                        <input 
                            type="text" 
                            placeholder="Search for services..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-grow py-3.5 px-4 bg-transparent border-none outline-none text-gray-700 placeholder-gray-500"
                        />

                        {/* Right Side Actions */}
                        <div className="pr-2 flex items-center gap-2">
                            
                            {/* Clear Search Button */}
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                                    title="Clear search"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            )}

                            {/* Divider */}
                            <div className="h-6 w-px bg-gray-200 mx-1"></div>

                            {/* Filter Button */}
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`p-2.5 rounded-full transition-all duration-200 flex items-center gap-2 text-sm font-medium ${
                                    activeFilter !== 'all' || isFilterOpen 
                                    ? 'bg-blue-50 text-google-blue ring-2 ring-blue-100' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                                title="Filter services"
                            >
                                <FontAwesomeIcon icon={faFilter} />
                                <span className="hidden sm:inline-block">
                                    {activeFilter === 'all' ? 'Filter' : filterOptions.find(f => f.id === activeFilter)?.label}
                                </span>
                            </button>
                        </div>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {isFilterOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 py-1"
                                >
                                    <div className="px-3 py-2 border-b border-gray-50 bg-gray-50/50">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filter By Type</p>
                                    </div>
                                    {filterOptions.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                setActiveFilter(option.id);
                                                setIsFilterOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                                                activeFilter === option.id ? 'bg-blue-50/50 text-google-blue font-medium' : 'text-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 flex justify-center ${activeFilter === option.id ? 'text-google-blue' : 'text-gray-400'}`}>
                                                    <FontAwesomeIcon icon={option.icon} />
                                                </div>
                                                <span>{option.label}</span>
                                            </div>
                                            {activeFilter === option.id && <FontAwesomeIcon icon={faCheck} className="text-google-blue text-sm" />}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Services Grid */}
                <motion.div 
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    <AnimatePresence mode='popLayout'>
                        {servicesLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={`skeleton-${i}`} className="w-full">
                                    <ServiceCardSkeleton />
                                </div>
                            ))
                        ) : filteredServices.length > 0 ? (
                            filteredServices.map((service) => (
                                <motion.div
                                    layout
                                    key={service._id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                    transition={{ 
                                        type: "spring", 
                                        stiffness: 300, 
                                        damping: 25,
                                        mass: 1 
                                    }}
                                    className="h-full"
                                >
                                    <ServiceCard service={service} />
                                </motion.div>
                            ))
                        ) : (
                            <motion.div 
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-gray-200"
                            >
                                <div className="text-gray-300 text-6xl mb-4">
                                    <FontAwesomeIcon icon={faSearch} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">No services found</h3>
                                <p className="text-gray-500 mt-2">
                                    We couldn't find any services matching your criteria.
                                </p>
                                <div className="mt-6 flex justify-center gap-3">
                                    {searchQuery && (
                                        <button 
                                            onClick={() => setSearchQuery('')}
                                            className="px-5 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Clear Search Text
                                        </button>
                                    )}
                                    {activeFilter !== 'all' && (
                                        <button 
                                            onClick={() => setActiveFilter('all')}
                                            className="px-5 py-2 bg-blue-50 text-google-blue font-semibold rounded-lg hover:bg-blue-100 transition-colors"
                                        >
                                            Reset Filters
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
                
                {!servicesLoading && filteredServices.length > 0 && <PeopleAlsoAsk faqs={faqs} />}
            </div>
        </>
    );
};