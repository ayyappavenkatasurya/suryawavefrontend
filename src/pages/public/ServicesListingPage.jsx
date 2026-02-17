import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faFilter, faLayerGroup, faRocket, faTag, faGift } from '@fortawesome/free-solid-svg-icons';
import Fuse from 'fuse.js';
import api from '../../services';
import { SEO, ServiceCard, ServiceCardSkeleton, PeopleAlsoAsk } from '../../components';

export const ServicesPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("all"); // 'all', 'free', 'standard', 'custom'
    const { pathname } = useLocation();
  
    const { data: services = [], isLoading: servicesLoading } = useQuery({
        queryKey: ['services'],
        queryFn: async () => {
            const { data } = await api.get('/api/services');
            return data;
        },
        staleTime: 1000 * 60 * 5, 
    });

    const { data: faqs = [] } = useQuery({
        queryKey: ['faqs'],
        queryFn: async () => {
            const { data } = await api.get('/api/faqs');
            return data;
        },
        staleTime: 1000 * 60 * 30,
    });

    // Memoize the filtered and searched results
    const processedServices = useMemo(() => {
        let result = services;

        // 1. Apply Category/Type Filter
        if (activeFilter !== 'all') {
            result = result.filter(service => {
                if (activeFilter === 'free') return service.currentPrice === 0;
                if (activeFilter === 'standard') return service.serviceType === 'standard';
                if (activeFilter === 'custom') return service.serviceType === 'custom';
                return true;
            });
        }

        // 2. Apply Search Query (if exists)
        if (searchQuery.trim()) {
            const fuse = new Fuse(result, {
                keys: ['title', 'description', 'category', 'tags'], // Added tags if available
                threshold: 0.4,
            });
            result = fuse.search(searchQuery).map(res => res.item);
        }

        return result;
    }, [services, searchQuery, activeFilter]);
  
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

    // Filter Button Configuration
    const filters = [
        { id: 'all', label: 'All', icon: faLayerGroup },
        { id: 'free', label: 'Free', icon: faGift },
        { id: 'standard', label: 'Standard', icon: faTag },
        { id: 'custom', label: 'Advanced', icon: faRocket },
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
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Services</h1>
                </div>
                
                {/* Search & Filter Container */}
                <div className="max-w-2xl mx-auto mb-10 space-y-6">
                    
                    {/* Search Bar */}
                    <div className="relative shadow-sm rounded-full bg-white z-20 group hover:shadow-md transition-shadow">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-lg group-focus-within:text-google-blue transition-colors" />
                        </div>

                        <input 
                            type="text" 
                            placeholder="Search for services, projects, or notes..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-full leading-5 bg-transparent placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue focus:placeholder-gray-400 sm:text-sm transition-all"
                        />

                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                title="Clear search"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                        {filters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform active:scale-95 border
                                    ${activeFilter === filter.id 
                                        ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                    }
                                `}
                            >
                                <FontAwesomeIcon icon={filter.icon} className={activeFilter === filter.id ? 'text-white' : 'text-gray-400'} />
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {servicesLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <ServiceCardSkeleton key={i} />
                        ))
                    ) : processedServices.length > 0 ? (
                        <AnimatePresence mode='popLayout'>
                            {processedServices.map((service) => (
                                <motion.div
                                    key={service._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ServiceCard service={service} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-gray-200 mx-4">
                            <div className="text-gray-300 text-6xl mb-4">
                                <FontAwesomeIcon icon={activeFilter !== 'all' ? faFilter : faSearch} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">No services found</h3>
                            <p className="text-gray-500 mt-2">
                                {searchQuery 
                                    ? <span>No matches for "<strong>{searchQuery}</strong>" in {activeFilter === 'all' ? 'all services' : `${activeFilter} category`}.</span>
                                    : <span>No services available in the <strong>{filters.find(f => f.id === activeFilter)?.label}</strong> category yet.</span>
                                }
                            </p>
                            <div className="mt-6 flex gap-3 justify-center">
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="px-5 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Clear Search
                                    </button>
                                )}
                                {activeFilter !== 'all' && (
                                    <button 
                                        onClick={() => setActiveFilter('all')}
                                        className="px-5 py-2 bg-google-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        View All
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                {!servicesLoading && processedServices.length > 0 && <PeopleAlsoAsk faqs={faqs} />}
            </div>
        </>
    );
};