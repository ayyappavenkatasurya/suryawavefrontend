import { lazy } from 'react';

// This barrel file exports all page components with lazy loading.
// This keeps App.jsx clean and handles code-splitting automatically.

// --- Public Pages ---
export const ServicesPage = lazy(() => import('./publicpages').then(module => ({ default: module.ServicesPage })));
export const ServiceDetailPage = lazy(() => import('./publicpages').then(module => ({ default: module.ServiceDetailPage })));
export const AboutPage = lazy(() => import('./publicpages').then(module => ({ default: module.AboutPage })));
export const ContactPage = lazy(() => import('./publicpages').then(module => ({ default: module.ContactPage })));
export const PrivacyPolicyPage = lazy(() => import('./publicpages').then(module => ({ default: module.PrivacyPolicyPage })));
export const TermsOfServicePage = lazy(() => import('./publicpages').then(module => ({ default: module.TermsOfServicePage })));

// --- Auth Pages ---
export const LoginPage = lazy(() => import('./authpages').then(module => ({ default: module.LoginPage })));
export const RegisterPage = lazy(() => import('./authpages').then(module => ({ default: module.RegisterPage })));
export const ForgotPasswordPage = lazy(() => import('./authpages').then(module => ({ default: module.ForgotPasswordPage })));
export const ResetPasswordPage = lazy(() => import('./authpages').then(module => ({ default: module.ResetPasswordPage })));

// --- User Pages ---
export const UserDashboardPage = lazy(() => import('./userpages').then(module => ({ default: module.UserDashboardPage })));
export const ProfilePage = lazy(() => import('./userpages').then(module => ({ default: module.ProfilePage })));

// --- Payment Pages ---
export const PaymentPage = lazy(() => import('./paymentpages').then(module => ({ default: module.PaymentPage })));
export const AdvancePaymentPage = lazy(() => import('./paymentpages').then(module => ({ default: module.AdvancePaymentPage })));
export const FullPaymentPage = lazy(() => import('./paymentpages').then(module => ({ default: module.FullPaymentPage })));
export const PaymentSuccessPage = lazy(() => import('./paymentpages').then(module => ({ default: module.PaymentSuccessPage })));

// --- Blog Pages ---
export const ArticlesPage = lazy(() => import('./blogpages').then(module => ({ default: module.ArticlesPage })));
export const ArticleDetailPage = lazy(() => import('./blogpages').then(module => ({ default: module.ArticleDetailPage })));

// --- Admin Pages ---
// ✅ UPDATED: Points to the new separate file in the admin folder
export const AdminDashboardPage = lazy(() => import('./admin/AdminDashboard').then(module => ({ default: module.AdminDashboardPage })));

// --- Error Pages ---
export const NotFoundPage = lazy(() => import('./errorpages').then(module => ({ default: module.NotFoundPage })));