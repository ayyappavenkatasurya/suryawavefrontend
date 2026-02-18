import React from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShareNodes, faTools } from '@fortawesome/free-solid-svg-icons';
import { SEO } from '../../components';

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
                { '@type': 'ContactPoint', 'contactType': 'customer support', 'email': 'contact@suryawave.me', 'availableLanguage': 'English' },
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
                        <FontAwesomeIcon icon={faShareNodes} className="text-3xl text-google-red mb-3" />
                        <h2 className="text-xl font-semibold mb-2">Email Us</h2>
                        <p className="text-gray-600 mb-3">For any inquiries, support requests, or feedback, please send us an email.</p>
                        <a href="mailto:contact@suryawave.me" className="font-medium text-google-blue hover:underline">contact@suryawave.me</a>
                    </div>
                    <div className="bg-white p-6 rounded-lg border shadow-sm transition-transform hover:-translate-y-1 duration-300">
                        <FontAwesomeIcon icon={faTools} className="text-3xl text-google-green mb-3" />
                        <h2 className="text-xl font-semibold mb-2">Chat with Us</h2>
                        <p className="text-gray-600 mb-3">For quick questions or to discuss a project, chat with us directly on WhatsApp.</p>
                        <a href={`https://wa.me/${import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="inline-block bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">Start Chat</a>
                    </div>
                </div>
            </div>
        </>
    );
};

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