import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import Fuse from 'fuse.js';
import api from '../../services';
import { SEO, ServiceCard, ServiceCardSkeleton, PeopleAlsoAsk } from '../../components';

export const ServicesPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
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

    const fuse = useMemo(() => {
        return new Fuse(services, {
            keys: ['title', 'description', 'category'],
            threshold: 0.4, 
        });
    }, [services]);

    const filteredServices = useMemo(() => {
        let result = services;

        // Filter by Search Query only
        if (searchQuery.trim()) {
            const fuseResult = new Fuse(result, {
                keys: ['title', 'description', 'category'],
                threshold: 0.4, 
            }).search(searchQuery);
            result = fuseResult.map(res => res.item);
        }

        return result;
    }, [services, searchQuery]);
  
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
                <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">Explore Services</h1>
                
                {/* Search Bar (Centered, Clean) */}
                <div className="max-w-xl mx-auto mb-10 relative z-20">
                    <div className="relative shadow-sm rounded-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-lg" />
                        </div>

                        <input 
                            type="text" 
                            placeholder="Search for services..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-google-blue focus:border-google-blue focus:placeholder-gray-400 sm:text-sm transition-all"
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
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {servicesLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <ServiceCardSkeleton key={i} />
                        ))
                    ) : filteredServices.length > 0 ? (
                        <AnimatePresence mode='popLayout'>
                            {filteredServices.map((service) => (
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
                        <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                            <div className="text-gray-300 text-6xl mb-4">
                                <FontAwesomeIcon icon={faSearch} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">No services found</h3>
                            <p className="text-gray-500 mt-2">
                                We couldn't find any services matching "<strong>{searchQuery}</strong>".
                            </p>
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Clear Search
                            </button>
                        </div>
                    )}
                </div>
                
                {!servicesLoading && filteredServices.length > 0 && <PeopleAlsoAsk faqs={faqs} />}
            </div>
        </>
    );
};