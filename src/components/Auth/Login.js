import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { handleError } from '../../utils/errorHandler';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error
    setError('');
    
    // Validate inputs
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    try {
      setLoading(true);
      await login(email, password);
      
      // Navigate to the redirect path
      navigate(from, { replace: true });
    } catch (error) {
      // Use the errorHandler utility
      handleError(error, 'Login attempt', () => {
        // User-friendly error messages
        if (error.code === 'auth/user-not-found') {
          setError('No account found with this email');
        } else if (error.code === 'auth/wrong-password') {
          setError('Incorrect password');
        } else if (error.code === 'auth/invalid-email') {
          setError('Invalid email format');
        } else {
          setError('Failed to log in. Please try again.');
        }
      });
      
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-white dark:bg-ios-dark-bg transition-colors duration-200">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-ios-large-title font-sf-pro mb-2 text-black dark:text-ios-dark-text">Welcome Back</h1>
          <p className="text-ios-subhead text-ios-gray dark:text-ios-dark-text-secondary">Sign in to continue to StudyGroupApp</p>
        </div>
        <div className="bg-white dark:bg-ios-dark-elevated ios-card shadow-sm p-6 mb-4 dark:border-ios-dark-border">
          {error && (
            <div className="bg-red-100 border border-red-200 text-ios-red rounded-ios p-3 mb-4 dark:bg-ios-dark-elevated dark:border-ios-red-dark dark:text-ios-red">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} aria-label="Login form">
            <div className="mb-4">
              <label htmlFor="email" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`ios-input w-full bg-white dark:bg-ios-dark-elevated text-black dark:text-ios-dark-text ${error && error.includes('Email') ? 'border-ios-red' : ''}`}
                placeholder="your.email@example.com"
                disabled={loading}
                aria-invalid={!!error && error.includes('Email')}
                aria-describedby="email-error"
              />
              {error && error.includes('Email') && (
                <p id="email-error" className="text-ios-red text-ios-footnote mt-1">
                  {error}
                </p>
              )}
            </div>
            <div className="mb-6">
              <div className="flex justify-between">
                <label htmlFor="password" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                  Password
                </label>
                <Link to="/forgot-password" className="text-ios-blue text-ios-footnote dark:text-ios-teal">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`ios-input w-full bg-white dark:bg-ios-dark-elevated text-black dark:text-ios-dark-text ${error && error.includes('Password') ? 'border-ios-red' : ''}`}
                placeholder="••••••••"
                disabled={loading}
                aria-invalid={!!error && error.includes('Password')}
                aria-describedby="password-error"
              />
              {error && error.includes('Password') && (
                <p id="password-error" className="text-ios-red text-ios-footnote mt-1">
                  {error}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="ios-button w-full flex items-center justify-center transition-transform duration-150 active:scale-95"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
        <div className="text-center">
          <p className="text-ios-subhead text-ios-gray dark:text-ios-dark-text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="text-ios-blue dark:text-ios-teal">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;