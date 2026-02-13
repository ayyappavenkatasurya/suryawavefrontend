// frontend/src/pages/publicpages.jsx

import React, { useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { SEO, ServiceCard, ServiceCardSkeleton, Spinner, CountdownTimer, PeopleAlsoAsk } from '../components'; 
import { useAuth } from '../context';
import api from '../services';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSpinner, faCheckCircle, faArrowRight, faTag, faTools, faCalendarAlt, faShareNodes } from '@fortawesome/free-solid-svg-icons';
import { NotFoundPage } from './errorpages';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Fuse from 'fuse.js';
import { LazyImage } from '../components/LazyImage';

// ... [ServicePagePreview and CustomProjectForm components remain unchanged] ...
const markdownComponents = {
    ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 space-y-2 text-gray-700 my-4" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 space-y-2 text-gray-700 my-4" {...props} />,
    li: ({node, ...props}) => <li className="pl-1" {...props} />,
    h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-gray-800 mt-5 mb-2" {...props} />,
    p: ({node, ...props}) => <p className="text-gray-700 leading-relaxed mb-4" {...props} />,
    a: ({node, ...props}) => <a className="text-google-blue hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
    strong: ({node, ...props}) => <span className="font-bold text-gray-900" {...props} />,
    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4" {...props} />,
};

// ========== ServicePagePreview Component ==========
export const ServicePagePreview = ({ service, onPurchase, isOwned }) => {
    if (!service) { return <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-lg shadow-lg text-left text-gray-500">Loading service details...</div>; }
    
    const hasOffer = service.price !== service.currentPrice;
    const isFree = service.currentPrice === 0;
    
    const [isPurchasing, setIsPurchasing] = useState(false);
    const navigate = useNavigate();

    const handleButtonClick = async () => {
        if (isOwned) {
            navigate('/dashboard');
        } else {
            setIsPurchasing(true);
            await onPurchase();
            setIsPurchasing(false);
        }
    };
    
    let buttonText = "";
    let buttonClass = "";
    
    if (isOwned) {
        buttonText = "Go to Dashboard";
        buttonClass = "bg-green-600 hover:bg-green-700";
    } else if (isFree) {
        buttonText = "Access Now";
        buttonClass = "bg-purple-600 hover:bg-purple-700";
    } else {
        buttonText = `Purchase Now for ₹${service.currentPrice}`;
        buttonClass = "bg-google-blue hover:bg-blue-700";
    }

    const renderContentBlock = (block, index) => {
      switch (block.type) {
        case 'heading': return <h1 key={index} className="text-3xl md:text-4xl font-bold text-gray-900 mt-8 mb-4">{block.value}</h1>;
        case 'subheading': return <h2 key={index} className="text-2xl font-semibold text-gray-800 mt-6 mb-3">{block.value}</h2>;
        case 'paragraph': return (
            <div key={index} className="text-gray-700 leading-relaxed my-2 prose max-w-none">
                <ReactMarkdown rehypePlugins={[rehypeRaw]} components={markdownComponents}>
                    {block.value}
                </ReactMarkdown>
            </div>
        );
        case 'image': return <LazyImage key={index} src={block.url || 'https://via.placeholder.com/800x400?text=Image+Preview'} alt={block.alt || 'Service Image'} className="my-6 rounded-lg shadow-md w-full h-auto" />;
        case 'file': return (<div key={index} className="my-4 p-4 border rounded-lg bg-gray-50"><a href={block.url || '#'} target="_blank" rel="noopener noreferrer" className="font-medium text-google-blue hover:underline flex items-center gap-3">{block.iconUrl && <img src={block.iconUrl} alt="" className="w-6 h-6 object-contain" />}<span>{block.value || 'Sample File'}</span></a></div>);
        case 'purchaseButton': return (
            <div key={index} className="my-8 text-center">
                {hasOffer && !isFree && !isOwned && (
                    <div className='mb-4'>
                        <p className="text-lg text-gray-500 line-through">Regular Price: ₹{service.price}</p>
                        <p className="text-2xl font-bold text-green-600">{service.offer.name} Price!</p>
                    </div>
                )}
                {!isOwned && (
                    <p className="text-4xl font-extrabold text-gray-900 mb-6">{isFree ? 'Free' : `₹${service.currentPrice}`}</p>
                )}
                <button 
                    onClick={handleButtonClick} 
                    disabled={isPurchasing} 
                    className={`w-full max-w-sm mx-auto py-3 text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2 ${buttonClass}`}
                >
                    {isPurchasing && <FontAwesomeIcon icon={faSpinner} spin />}
                    {isOwned && <FontAwesomeIcon icon={faArrowRight} />}
                    {buttonText}
                </button>
            </div>
        );
        default: return null;
      }
    };

    return (
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-lg shadow-lg text-left">
        {hasOffer && !isFree && !isOwned && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xl font-bold text-green-700 text-center mb-2">{service.offer.name} is LIVE!</p>
            <div className="flex justify-center">
              <CountdownTimer endDate={service.offer.endDate} />
            </div>
          </div>
        )}
        
        {isFree && !isOwned && (
            <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-center gap-2 text-purple-800">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span className="font-bold">This resource is available for FREE!</span>
            </div>
        )}

        {isOwned && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-2 text-green-800">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span className="font-bold">You already own this service.</span>
            </div>
        )}

        {(service.pageContent && service.pageContent.length > 0) ? (
            service.pageContent.map(renderContentBlock)
        ) : (
            <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.title || 'Service Title'}</h1>
                <p className="text-gray-600 mb-6">{service.description || 'Service short description.'}</p>
                <div className="text-center mt-8">
                    {!isOwned && (
                        <p className="text-4xl font-extrabold text-gray-900 mb-6">{isFree ? 'Free' : `₹${service.price || '0'}`}</p>
                    )}
                    <button 
                        onClick={handleButtonClick} 
                        disabled={isPurchasing} 
                        className={`w-full max-w-sm mx-auto py-3 text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2 ${buttonClass}`}
                    >
                        {isPurchasing && <FontAwesomeIcon icon={faSpinner} spin />}
                        {buttonText}
                    </button>
                </div>
            </>
        )}
      </div>
    );
};

// ========== CustomProjectForm Component ==========
export const CustomProjectForm = ({ service, onSubmit }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const hasOffer = service.price !== service.currentPrice;

    const handleChange = (label, value) => {
        setFormData(prev => ({ ...prev, [label]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-lg shadow-lg text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{service.title}</h1>
            <p className="text-gray-600 mb-6">Please fill out the requirements form below. We will review your submission and contact you for the next steps.</p>
            
            {hasOffer && (
              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xl font-bold text-green-700 text-center mb-2">{service.offer.name} is LIVE!</p>
                <div className="flex justify-center">
                  <CountdownTimer endDate={service.offer.endDate} />
                </div>
              </div>
            )}

            {service.price > 0 && (
                <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">Project Pricing</h3>
                    {hasOffer && service.offer.name && (
                         <p className="text-sm font-semibold text-green-700 bg-green-100 inline-block px-2 py-0.5 rounded-md mb-2">{service.offer.name} Active!</p>
                    )}
                    <p className="text-gray-700">
                        The total fixed price for this project is{' '}
                        {hasOffer && <span className="line-through text-gray-500">₹{service.price}</span>}{' '}
                        <span className="font-semibold text-xl text-gray-900">₹{service.currentPrice}</span>.
                    </p>
                    {service.advanceAmount > 0 && <p className="text-gray-700 mt-1">An advance payment of <span className="font-semibold">₹{service.advanceAmount}</span> will be required to start.</p>}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {service.srsForm.map((field, index) => (
                    <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.fieldType === 'text' && <input type="text" onChange={(e) => handleChange(field.label, e.target.value)} required={field.required} className="w-full p-2 border rounded-md focus:ring-google-blue focus:border-google-blue"/>}
                        {field.fieldType === 'textarea' && <textarea rows="5" onChange={(e) => handleChange(field.label, e.target.value)} required={field.required} className="w-full p-2 border rounded-md focus:ring-google-blue focus:border-google-blue"/>}
                        {field.fieldType === 'file' && (
                            <div>
                                <input type="text" placeholder="Enter link to your file (Google Drive, Dropbox, etc.)" onChange={(e) => handleChange(field.label, e.target.value)} required={field.required} className="w-full p-2 border rounded-md focus:ring-google-blue focus:border-google-blue"/>
                                <p className="text-xs text-gray-500 mt-1">Please provide a shareable link to your document/file.</p>
                            </div>
                        )}
                    </div>
                ))}
                <button type="submit" disabled={loading} className={`w-full py-3 bg-google-blue text-white rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors`}>
                    {loading ? 'Submitting...' : 'Submit Request'}
                </button>
            </form>
        </div>
    );
};

// ========== SERVICES PAGE ==========
export const ServicesPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const { pathname } = useLocation();
  
    // Fetch Services using React Query
    const { data: services = [], isLoading: servicesLoading } = useQuery({
        queryKey: ['services'],
        queryFn: async () => {
            const { data } = await api.get('/api/services');
            return data;
        },
        staleTime: 1000 * 60 * 5, 
    });

    // Fetch FAQs using React Query
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

    // ✅ FIXED: Enhanced FAQ Schema for better Google indexing (People Also Ask)
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer.replace(/<[^>]+>/g, '') // Strip HTML for schema
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {servicesLoading ? (
                        Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)
                    ) : filteredServices.length > 0 ? (
                        filteredServices.map((service, index) => (
                            <motion.div
                                key={service._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                            >
                                <ServiceCard service={service} />
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-500 py-8">
                            No services found matching "{searchQuery}".
                        </div>
                    )}
                </div>
                
                <PeopleAlsoAsk faqs={faqs} />
            </div>
        </>
    );
};

// ... [ServiceDetailPage, AboutPage, ContactPage, PrivacyPolicyPage, TermsOfServicePage unchanged] ...
// ========== SERVICE DETAIL PAGE ==========
export const ServiceDetailPage = () => {
    const { slug } = useParams();
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
  
    // Fetch Service Detail with React Query
    const { data: service, isLoading, isError } = useQuery({
        queryKey: ['service', slug],
        queryFn: async () => {
            const { data } = await api.get(`/api/services/${slug}`);
            return data;
        },
        retry: 1,
    });

    if (isError) return <NotFoundPage />;
    if (isLoading) return <Spinner />;
    if (!service) return <NotFoundPage />; 

    const isOwned = user?.purchasedServices?.some(s => (s._id === service._id) || (s === service._id)) ?? false;
  
    const handlePurchase = async () => {
      if (!user) {
        toast.error("Please log in first.");
        return navigate('/login');
      }

      if (service.currentPrice === 0) {
          try {
              await api.post('/api/orders/claim-free', { serviceId: service._id });
              toast.success(`Successfully claimed "${service.title}"!`);
              await refreshUser();
              navigate('/dashboard');
          } catch (error) {
              console.error(error); 
          }
      } else {
          navigate(`/payment/${service._id}`);
      }
    };
  
    const handleCustomProjectSubmit = async (srsData) => {
      if (!user) {
        toast.error("Please log in to submit a request.");
        return navigate('/login');
      }
      try {
          await api.post('/api/project-requests', { serviceId: service._id, srsData });
          toast.success('Your project request has been submitted successfully!');
          navigate('/dashboard');
      } catch (error) {
          // Error toast handled by interceptor
      }
    };
  
    const hasOffer = service.price !== service.currentPrice;
    const validUntilDate = hasOffer && service.offer.endDate
        ? new Date(service.offer.endDate).toISOString().split('T')[0]
        : `${new Date().getFullYear() + 1}-12-31`;

    const dynamicOgImage = `${import.meta.env.VITE_API_URL}/api/services/${service.slug}/og-image.png`;
    const finalImage = service.imageUrl ? service.imageUrl : dynamicOgImage;

    const productSchema = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      'name': service.title,
      'image': [ finalImage ],
      'description': service.description,
      'sku': service._id,
      'mpn': service._id,
      'brand': { '@type': 'Brand', 'name': 'Surya Wave', 'logo': 'https://suryawave.me/logo.png' },
      ...((service.numReviews > 0) ? {
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': service.rating,
          'reviewCount': service.numReviews
        }
      } : {}),
      'review': {
          '@type': 'Review',
          'reviewRating': { '@type': 'Rating', 'ratingValue': '5', 'bestRating': '5' },
          'author': { '@type': 'Person', 'name': 'Surya Wave Team' }
      },
      ...((service.serviceType === 'standard' || service.price > 0) && {
          'offers': {
              '@type': 'Offer',
              'url': `https://suryawave.me/services/${service.slug}`,
              'priceCurrency': 'INR',
              'price': service.currentPrice,
              'priceValidUntil': validUntilDate,
              'availability': 'https://schema.org/InStock',
              'image': finalImage,
              'itemCondition': 'https://schema.org/NewCondition',
              'hasMerchantReturnPolicy': {
                '@type': 'MerchantReturnPolicy',
                'applicableCountry': 'IN',
                'returnPolicyCategory': 'https://schema.org/MerchantReturnNotPermitted'
              },
              'shippingDetails': {
                '@type': 'OfferShippingDetails',
                'shippingRate': { '@type': 'MonetaryAmount', 'value': '0', 'currency': 'INR' },
                'shippingDestination': { '@type': 'DefinedRegion', 'addressCountry': 'IN' },
                'deliveryTime': {
                    '@type': 'ShippingDeliveryTime',
                    'handlingTime': { '@type': 'QuantitativeValue', 'minValue': 0, 'maxValue': 0, 'unitCode': 'DAY' },
                    'transitTime': { '@type': 'QuantitativeValue', 'minValue': 0, 'maxValue': 0, 'unitCode': 'DAY' }
                }
              }
          }
      }),
    };
  
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://suryawave.me/' },
            { '@type': 'ListItem', 'position': 2, 'name': 'Services', 'item': 'https://suryawave.me/services' },
            { '@type': 'ListItem', 'position': 3, 'name': service.title }
        ]
    };
  
    return (
      <>
        <SEO 
          title={service.title} 
          description={service.description} 
          keywords={service.category}
          path={pathname}
          image={finalImage}
        >
          <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
          <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        </SEO>
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="container mx-auto py-12 px-4 sm:px-6 lg:px-8"
        >
          {service.serviceType === 'custom' ? (
              <CustomProjectForm service={service} onSubmit={handleCustomProjectSubmit} />
          ) : (
              <ServicePagePreview 
                service={service} 
                onPurchase={handlePurchase} 
                isOwned={isOwned} 
              />
          )}
        </motion.div>
      </>
    );
};

// ========== ABOUT PAGE ==========
export const AboutPage = () => {
    const { pathname } = useLocation();
    const aboutPageSchema = {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        'url': 'https://suryawave.me/about',
        'name': 'About Surya Wave',
        'description': "Learn about SuryaWave's mission to provide high-quality, budget-friendly digital services.",
        'mainEntity': {
            '@type': 'Organization',
            'name': 'Surya Wave',
            'url': 'https://suryawave.me'
        }
    };
    return (
        <>
            <SEO 
                title="About Us" 
                description="Learn about SuryaWave's mission to provide high-quality, budget-friendly digital services for students and tech enthusiasts."
                keywords="about suryawave, surya nallamothu, tech education, student projects"
                path={pathname}
            >
                <script type="application/ld+json">{JSON.stringify(aboutPageSchema)}</script>
            </SEO>
            <div className="bg-white">
                <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 text-left max-w-4xl">
                    <h1 className="text-4xl font-extrabold text-gray-800 mb-6 text-center">About SuryaWave</h1>
                    <p className="text-lg text-gray-600 mb-8 text-center">Empowering the next wave of innovators.</p>
                    
                    <div className="space-y-10 text-gray-700 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-google-blue mb-3">Our Mission</h2>
                            <p>
                                SuryaWave is a growing online tech company founded by Surya Nallamothu, dedicated to providing high-quality digital services at budget-friendly prices. Our mission is to make technology, learning, and innovation accessible to every student and tech enthusiast. We believe in breaking down financial barriers to quality education and project development.
                            </p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-bold text-google-blue mb-3">What We Do</h2>
                            <p>
                                We specialize in creating resources and providing services that cater directly to the needs of engineering students and aspiring tech professionals. Whether you're preparing for competitive exams like GATE or embarking on your final year project, we're here to support you with expertly crafted materials and comprehensive guidance.
                            </p>
                            <ul className="list-disc list-inside mt-4 space-y-2">
                                <li><strong>GATE DA Test Papers:</strong> Sharpen your preparation with test series designed to reflect the latest exam patterns and difficulty levels.</li>
                                <li><strong>Final Year Projects:</strong> From ideation to implementation, we assist students (B.Tech, M.Tech, and more) in developing meaningful and impressive final year projects.</li>
                            </ul>
                        </section>
                        <section>
                            <h2 className="text-2xl font-bold text-google-blue mb-3">Our Vision</h2>
                            <p>
                                We envision a world where every student with a passion for technology has the tools and support they need to succeed. SuryaWave aims to be a trusted partner in their academic and professional journey, fostering a community of skilled and confident individuals ready to tackle the challenges of the digital age.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
};

// ========== CONTACT PAGE ==========
export const ContactPage = () => {
    const { pathname } = useLocation();
    const contactPageSchema = {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        'url': 'https://suryawave.me/contact',
        'name': 'Contact Surya Wave',
        'description': "Get in touch with SuryaWave.",
        'mainEntity': {
            '@type': 'Organization',
            'name': 'Surya Wave',
            'url': 'https://suryawave.me',
            'contactPoint': [
                { '@type': 'ContactPoint', 'contactType': 'customer support', 'email': 'suryawaveofficial@gmail.com', 'availableLanguage': 'English' },
                { '@type': 'ContactPoint', 'contactType': 'technical support', 'telephone': `+${import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER}`, 'contactOption': 'TollFree', 'areaServed': 'IN', 'availableLanguage': 'English' }
            ]
        }
    };
    return (
        <>
            <SEO 
                title="Contact Us" 
                description="Get in touch with SuryaWave via email or WhatsApp."
                keywords="contact suryawave, customer support, help, project inquiry"
                path={pathname}
            >
                <script type="application/ld+json">{JSON.stringify(contactPageSchema)}</script>
            </SEO>
            <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center max-w-2xl">
                <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Get in Touch</h1>
                <p className="text-lg text-gray-600 mb-10">We're here to help and answer any question you might have. We look forward to hearing from you!</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="bg-white p-6 rounded-lg border shadow-sm transition-transform hover:-translate-y-1 duration-300">
                        <FontAwesomeIcon icon={faShareNodes} className="text-3xl text-google-red mb-3" /> {/* Placeholder icon */}
                        <h2 className="text-xl font-semibold mb-2">Email Us</h2>
                        <p className="text-gray-600 mb-3">For any inquiries, support requests, or feedback, please send us an email.</p>
                        <a href="mailto:suryawaveofficial@gmail.com" className="font-medium text-google-blue hover:underline">suryawaveofficial@gmail.com</a>
                    </div>
                    <div className="bg-white p-6 rounded-lg border shadow-sm transition-transform hover:-translate-y-1 duration-300">
                        {/* faWhatsapp is usually brand icon, imported in component header */}
                        <FontAwesomeIcon icon={faTools} className="text-3xl text-google-green mb-3" /> {/* Placeholder */}
                        <h2 className="text-xl font-semibold mb-2">Chat with Us</h2>
                        <p className="text-gray-600 mb-3">For quick questions or to discuss a project, chat with us directly on WhatsApp.</p>
                        <a href={`https://wa.me/${import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="inline-block bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">Start Chat</a>
                    </div>
                </div>
            </div>
        </>
    );
};

// ========== PRIVACY POLICY PAGE ==========
export const PrivacyPolicyPage = () => {
    const { pathname } = useLocation();
    const lastUpdated = "October 24, 2025";
    return (
        <>
            <SEO title="Privacy Policy" description="Read the Privacy Policy for SuryaWave." keywords="privacy policy, data protection" path={pathname} />
            <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 text-left max-w-4xl prose lg:prose-lg">
                <h1>Privacy Policy</h1>
                <p className="lead">Last updated: {lastUpdated}</p>
                <p>SuryaWave operates the https://suryawave.me website. This page informs you of our policies regarding the collection, use, and disclosure of personal data.</p>
                <h2>Information Collection and Use</h2>
                <p>We collect information to provide and improve our Service, including Personal Data (Email, Name) and Usage Data.</p>
                <h2>Use of Data</h2>
                <p>SuryaWave uses data to provide the Service, notify about changes, provide support, and analyze usage.</p>
                <h2>Data Security</h2>
                <p>We strive to use commercially acceptable means to protect your Personal Data but cannot guarantee absolute security.</p>
                <h2>Contact Us</h2>
                <p>If you have any questions, please contact us.</p>
            </div>
        </>
    );
};

// ========== TERMS OF SERVICE PAGE ==========
export const TermsOfServicePage = () => {
    const { pathname } = useLocation();
    const lastUpdated = "October 24, 2025";
    return (
        <>
            <SEO title="Terms of Service" description="Read the Terms of Service for SuryaWave." keywords="terms of service, user agreement" path={pathname} />
            <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 text-left max-w-4xl prose lg:prose-lg">
                <h1>Terms of Service</h1>
                <p className="lead">Last updated: {lastUpdated}</p>
                <h2>1. Agreement to Terms</h2>
                <p>By using our website, you agree to these Terms.</p>
                <h2>2. Services</h2>
                <p>SuryaWave provides digital educational content for personal use only.</p>
                <h2>3. User Accounts</h2>
                <p>You are responsible for your account security.</p>
                <h2>4. Payments and Refunds</h2>
                <p>All sales are final due to the digital nature of our products.</p>
                <h2>5. Intellectual Property</h2>
                <p>Content is property of SuryaWave.</p>
                <h2>6. Limitation of Liability</h2>
                <p>SuryaWave is not liable for indirect damages.</p>
                <h2>7. Contact Us</h2>
                <p>If you have questions, please contact us.</p>
            </div>
        </>
    );
};