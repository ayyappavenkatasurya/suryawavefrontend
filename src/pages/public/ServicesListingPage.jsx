import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
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
        if (!searchQuery.trim()) return services;
        return fuse.search(searchQuery).map(result => result.item);
    }, [fuse, searchQuery, services]);
  
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
                description="Explore our range of digital services including GATE test series and final year projects. High quality, affordable prices." 
                keywords="services, GATE, projects, B.Tech projects, M.Tech projects, test series"
                path={pathname}
            >
                <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
                {faqs.length > 0 && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
            </SEO>
            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-bold text-left md:text-center mb-6">Our Services</h1>
                
                <div className="max-w-md mx-auto mb-8 relative">
                    <input 
                        type="text" 
                        placeholder="Search for services..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-google-blue focus:outline-none transition-shadow"
                    />
                    <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-4 text-gray-400" />
                </div>

                {/* YouTube Style Loading Implementation */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {servicesLoading ? (
                        // Show skeletons while loading
                        Array.from({ length: 6 }).map((_, i) => (
                            <ServiceCardSkeleton key={i} />
                        ))
                    ) : filteredServices.length > 0 ? (
                        // Animate actual content in
                        <AnimatePresence>
                            {filteredServices.map((service, index) => (
                                <motion.div
                                    key={service._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                >
                                    <ServiceCard service={service} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="col-span-full text-center text-gray-500 py-8">
                            No services found matching "{searchQuery}".
                        </div>
                    )}
                </div>
                
                {!servicesLoading && <PeopleAlsoAsk faqs={faqs} />}
            </div>
        </>
    );
};