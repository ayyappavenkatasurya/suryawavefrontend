// frontend/src/pages/authpages.jsx

import React, { useState, useEffect } from 'react';
// ✅ FIXED: Imported useSearchParams which was missing
import { useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SEO } from '../components';
import { useAuth } from '../context';
import api from '../services';
// ✅ MODIFIED: We only need Popup flow now
import { 
  auth, 
  googleProvider, 
  signInWithPopup
} from '../firebase';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// ✅ FIXED: Imported faKey which was missing for the ResetPasswordPage
import { faEnvelope, faLock, faSpinner, faKey } from '@fortawesome/free-solid-svg-icons';

// ========== LOGIN PAGE ==========
export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordLoginLoading, setPasswordLoginLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const { login, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/dashboard';

    // Redirect if already logged in
    useEffect(() => {
      if (user) {
        navigate(from, { replace: true });
      }
    }, [user, navigate, from]);

    const passwordSubmitHandler = async (e) => {
      e.preventDefault();
      setPasswordLoginLoading(true);
      try {
        const { data } = await api.post('/api/auth/login', { email, password });
        login(data, data.token);
        toast.success('Logged in successfully!');
      } catch (error) {
        // Error handled by interceptor
      } finally {
        setPasswordLoginLoading(false);
      }
    };

    // ✅ FIXED: Robust Google Login using Popup (Works best for PWA/Mobile cross-domain)
    const handleGoogleLogin = async () => {
      setIsGoogleLoading(true);
      const toastId = toast.loading('Opening Google Sign In...');
      
      try {
        // 1. Open Popup (This works on mobile too, opening a secure tab)
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        
        toast.loading('Authenticating with server...', { id: toastId });

        // 2. Get ID Token
        const idToken = await firebaseUser.getIdToken(true);

        // 3. Send to Backend
        const response = await api.post('/api/auth/google', { idToken });

        // 4. Login in Context
        login(response.data, response.data.token);
        
        toast.success('Logged in with Google!', { id: toastId });
        navigate(from, { replace: true });
        
      } catch (error) {
        console.error("Google Login Error:", error);
        
        let errorMsg = 'Google Login Failed';
        if (error.code === 'auth/popup-closed-by-user') {
            errorMsg = 'Login cancelled';
        } else if (error.code === 'auth/network-request-failed') {
            errorMsg = 'Network error. Check your connection.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMsg = 'Popup blocked. Please allow popups for this site.';
        } else if (error.response?.data?.message) {
            errorMsg = error.response.data.message;
        }
        
        // Don't show error toast if user simply closed the popup
        if (error.code !== 'auth/popup-closed-by-user') {
            toast.error(errorMsg, { id: toastId });
        } else {
            toast.dismiss(toastId);
        }
      } finally {
        setIsGoogleLoading(false);
      }
    };
  
    return (
      <>
        <SEO title="Login" description="Sign in to your Surya Wave account." keywords="login, sign in" path={location.pathname} />
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full bg-white p-8 border rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Sign in to your account</h2>
            
            <button 
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 mb-6 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="text-google-blue" />
                    <span>Authenticating...</span>
                  </>
              ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.04-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.2 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Sign in with Google
                  </>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or sign in with email</span></div>
            </div>

            <form onSubmit={passwordSubmitHandler}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                  </div>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-google-blue focus:border-google-blue sm:text-sm"/>
                </div>
              </div>
              <div className="mb-6">
                 <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="text-sm">
                        <Link to="/forgot-password" className="font-medium text-google-blue hover:text-blue-500">
                            Forgot password?
                        </Link>
                    </div>
                </div>
                <div className="mt-1 relative rounded-md shadow-sm">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                  </div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-google-blue focus:border-google-blue sm:text-sm"/>
                </div>
              </div>
              <button type="submit" disabled={passwordLoginLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-google-blue hover:bg-blue-700 disabled:bg-blue-400">
                {passwordLoginLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account? <Link to="/register" className="font-medium text-google-blue hover:text-blue-500">Sign up</Link>
            </p>
          </div>
        </div>
      </>
    );
};

export const RegisterPage = () => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
  
    const registerHandler = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        await api.post('/api/auth/register', { name, email, password });
        toast.success('Registration successful! Please check your email for an OTP.');
        setStep(2);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
  
    const verifyOtpHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/api/auth/verify-registration-otp', { email, otp });
            login(data, data.token);
            toast.success('Account verified successfully! Welcome.');
            navigate('/dashboard');
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };
  
    return (
      <>
        <SEO title="Register" description="Create a new Surya Wave account." keywords="register, sign up, new account" path={location.pathname} />
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full bg-white p-8 border rounded-lg shadow-sm">
            {step === 1 && (
              <>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Create an account</h2>
                <form onSubmit={registerHandler}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md"/>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Email address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md"/>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md"/>
                  </div>
                  <button type="submit" disabled={loading} className="w-full flex justify-center py-2 bg-google-blue text-white rounded-md disabled:bg-blue-400">
                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Register'}
                  </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                  Already have an account? <Link to="/login" className="font-medium text-google-blue hover:text-blue-500">Sign in</Link>
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Verify Your Account</h2>
                <p className="text-center text-sm text-gray-600 mb-6">
                  An OTP has been sent to <strong>{email}</strong>. Please enter it below.
                </p>
                <form onSubmit={verifyOtpHandler}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Verification OTP</label>
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required className="mt-1 block w-full px-3 py-2 border rounded-md text-center tracking-[0.5em]"/>
                  </div>
                  <button type="submit" disabled={loading} className="w-full flex justify-center py-2 bg-green-600 text-white rounded-md disabled:bg-green-400">
                    {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Verify & Continue'}
                  </button>
                </form>
                <button 
                  onClick={() => setStep(1)} 
                  className="mt-3 text-center w-full text-sm text-google-blue hover:underline"
                >
                  Entered wrong details? Go back.
                </button>
              </>
            )}
          </div>
        </div>
      </>
    );
};

export const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/auth/forgot-password', { email });
            toast.success('Password reset OTP sent to your email.');
            navigate(`/reset-password?email=${encodeURIComponent(email)}`);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <SEO title="Forgot Password" description="Reset your Surya Wave account password." keywords="forgot password, reset password" path={location.pathname} />
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full bg-white p-8 border rounded-lg shadow-sm">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Forgot Password</h2>
                    <p className="text-center text-sm text-gray-600 mb-4">Enter your email address and we'll send you an OTP to reset your password.</p>
                    <form onSubmit={submitHandler}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Email address</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                                </div>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="block w-full pl-10 pr-3 py-2 border rounded-md" />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center py-2 bg-google-blue text-white rounded-md disabled:bg-blue-400">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Send OTP'}
                        </button>
                    </form>
                     <p className="mt-4 text-center text-sm text-gray-600">
                        Remember your password? <Link to="/login" className="font-medium text-google-blue hover:text-blue-500">Sign in</Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export const ResetPasswordPage = () => {
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const location = useLocation();

    useEffect(() => {
        if (!email) {
            toast.error('No email provided. Please start the process again.');
            navigate('/forgot-password');
        }
    }, [email, navigate]);

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/auth/reset-password', { email, otp, password });
            toast.success('Password reset successful! You can now log in.');
            navigate('/login');
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <SEO title="Reset Password" description="Reset your Surya Wave account password." keywords="reset password" path={location.pathname}/>
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full bg-white p-8 border rounded-lg shadow-sm">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Reset Your Password</h2>
                    <p className="text-center text-sm text-gray-600 mb-4">An OTP was sent to <strong>{email}</strong>. Please enter it below along with your new password.</p>
                    <form onSubmit={submitHandler} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">OTP</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FontAwesomeIcon icon={faKey} className="text-gray-400" />
                                </div>
                                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required className="block w-full pl-10 pr-3 py-2 border rounded-md"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">New Password</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                                </div>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full pl-10 pr-3 py-2 border rounded-md"/>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center py-2 bg-google-blue text-white rounded-md disabled:bg-blue-400">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Reset Password'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};