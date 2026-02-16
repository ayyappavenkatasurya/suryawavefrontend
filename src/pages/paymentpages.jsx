// frontend/src/pages/paymentpages.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SEO, Spinner, PaymentComponent } from '../components';
import api from '../services';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

// ✅ NEW: Centralized hook for the entire payment flow logic
const usePaymentFlow = (paymentType, id) => {
    const [intent, setIntent] = useState(null);
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const initiate = async () => {
            if (!id) return;
            try {
                // Step 1: Initiate payment on the backend to get a secure intentId
                const { data } = await api.post('/api/payments/initiate', {
                    paymentType,
                    refId: id,
                });
                setIntent(data);

                // Fetch service/project details for display
                let detailsUrl = '';
                if (paymentType === 'standard_service') {
                    detailsUrl = `/api/services/by-id/${id}`;
                } else {
                    detailsUrl = `/api/project-requests/${id}`;
                }
                const { data: detailsData } = await api.get(detailsUrl);
                setDetails(detailsData);
            } catch (err) {
                // err is already toasted by the interceptor
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        initiate();
    }, [id, paymentType, navigate]);

    const handleSubmit = async (transactionId) => {
        setSubmitLoading(true);
        try {
            let submitUrl = '';
            let payload = { intentId: intent.intentId, transactionId };

            switch(paymentType) {
                case 'standard_service':
                    submitUrl = '/api/orders';
                    break;
                case 'project_advance':
                    submitUrl = `/api/project-requests/${id}/pay-advance`;
                    break;
                case 'project_full':
                    submitUrl = `/api/project-requests/${id}/pay-full`;
                    break;
                default:
                    throw new Error('Invalid payment type');
            }
            
            await api.post(submitUrl, payload);
            toast.success('Submission successful! Your payment is being verified.');
            navigate('/payment-success');
        } catch (error) {
            // Error is handled by interceptor
        } finally {
            setSubmitLoading(false);
        }
    };
    
    return { intent, details, loading, submitLoading, handleSubmit };
};

// ========== ✅ REFACTORED: PAYMENT PAGE ==========
export const PaymentPage = () => {
    const { id } = useParams();
    const { pathname } = useLocation();
    const { intent, details, loading, submitLoading, handleSubmit } = usePaymentFlow('standard_service', id);
  
    if (loading || !details || !intent) return <Spinner />;
  
    return (
        <>
            <SEO title={`Payment for ${details.title}`} description="Complete your payment using UPI." keywords="payment, upi, purchase" path={pathname}/>
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <PaymentComponent
                    title="Complete Your Payment"
                    description={<>To purchase "{details.title}" for <span className="font-bold">₹{intent.amount}</span></>}
                    amount={intent.amount} 
                    upiId={import.meta.env.VITE_UPI_ID}
                    upiName={import.meta.env.VITE_UPI_NAME}
                    // ✅ CHANGED: Use the secure backend-generated intentId for the transaction note
                    upiNote={intent.intentId}
                    onSubmit={handleSubmit}
                    loading={submitLoading}
                />
            </div>
        </>
    );
};

// ========== ✅ REFACTORED: ADVANCE PAYMENT PAGE ==========
export const AdvancePaymentPage = () => {
    const { id } = useParams();
    const { pathname } = useLocation();
    const { intent, details, loading, submitLoading, handleSubmit } = usePaymentFlow('project_advance', id);
  
    if (loading || !details || !intent) return <Spinner />;
  
    return (
        <>
            <SEO title={`Advance Payment for ${details.service.title}`} description="Complete your advance payment using UPI." keywords="payment, upi, purchase, advance" path={pathname} />
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <PaymentComponent
                    title="Advance Payment"
                    description={<>For Advanced project "{details.service.title}" an advance of <span className="font-bold">₹{intent.amount}</span> is required.</>}
                    amount={intent.amount}
                    upiId={import.meta.env.VITE_UPI_ID}
                    upiName={import.meta.env.VITE_UPI_NAME}
                    // ✅ CHANGED: Use the secure backend-generated intentId
                    upiNote={intent.intentId}
                    onSubmit={handleSubmit}
                    loading={submitLoading}
                />
            </div>
        </>
    );
};

// ========== ✅ REFACTORED: FULL PAYMENT PAGE ==========
export const FullPaymentPage = () => {
    const { id } = useParams();
    const { pathname } = useLocation();
    const { intent, details, loading, submitLoading, handleSubmit } = usePaymentFlow('project_full', id);
  
    if (loading || !details || !intent) return <Spinner />;
  
    return (
        <>
            <SEO title={`Full Payment for ${details.service.title}`} description="Complete your full payment using UPI." keywords="payment, upi, purchase, full payment" path={pathname} />
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
                 <PaymentComponent
                    title="Final Payment"
                    description={<>For Advanced project "{details.service.title}" the final payment is <span className="font-bold">₹{intent.amount}</span>.</>}
                    amount={intent.amount}
                    upiId={import.meta.env.VITE_UPI_ID}
                    upiName={import.meta.env.VITE_UPI_NAME}
                    // ✅ CHANGED: Use the secure backend-generated intentId
                    upiNote={intent.intentId}
                    onSubmit={handleSubmit}
                    loading={submitLoading}
                />
            </div>
        </>
    );
};

// ========== PAYMENT SUCCESS PAGE (Unchanged) ==========
export const PaymentSuccessPage = () => {
    const { pathname } = useLocation();

    return (
        <>
            <SEO 
                title="Payment Submitted" 
                description="Thank you for your purchase. Your payment is currently under verification."
                keywords="payment success, thank you, order confirmation"
                path={pathname}
            />
            <div className="container mx-auto py-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh]">
                <div className="max-w-lg mx-auto bg-white p-8 sm:p-10 rounded-lg shadow-lg border text-center">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-6xl mb-4" />
                    <h1 className="text-3xl font-bold text-gray-800 mb-3">Thank You!</h1>
                    <p className="text-gray-600 mb-6">
                        Your payment submission has been received. We are now verifying your transaction. 
                        This process usually takes up to 20 minutes.
                    </p>
                    <p className="text-sm text-gray-500 mb-8 bg-gray-50 p-3 rounded-md">
                        You will receive an email confirmation once the verification is complete. 
                        After confirmation, you can access your purchased services from your dashboard.
                    </p>
                    <Link 
                        to="/dashboard" 
                        className="inline-block bg-google-blue text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
                    >
                        Go to My Dashboard
                    </Link>
                </div>
            </div>
        </>
    );
};