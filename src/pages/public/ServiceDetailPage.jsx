import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { SEO, Spinner } from '../../components';
import { useAuth } from '../../context';
import api from '../../services';
import { NotFoundPage } from '../errorpages';
import { ServicePagePreview } from '../../components/service/ServicePagePreview';
import { CustomProjectForm } from '../../components/service/CustomProjectForm';

export const ServiceDetailPage = () => {
    const { slug } = useParams();
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
  
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