// pages/index.js - This is now the login page
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { loginUser, registerUser, getCurrentUser } from '../lib/auth';
import AuthLayout from '../components/Layout/AuthLayout';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';

export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Effect to check if user is already logged in
  useEffect(() => {
    // A quick check on mount to redirect authenticated users
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          router.push('/dashboard'); // Redirect to dashboard if logged in
        }
      } catch (e) {
        // Not logged in, stay on login page
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { email, password, confirmPassword } = formData;

    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      let user;
      if (isLogin) {
        user = await loginUser(email, password);
      } else {
        user = await registerUser(email, password);
      }
      
      if (user) {
        router.push('/dashboard'); // Redirect on successful login or registration
      }
    } catch (err) {
      // Assuming 'err' is an object or string containing the error message
      setError(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="card">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">IP</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? 'Sign in to your inventory account' : 'Get started with your inventory management'}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <Input
            label="Email address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter your email"
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter your password"
            required
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />

          {!isLogin && (
            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm your password"
              required
              autoComplete="new-password"
            />
          )}

          {isLogin && (
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  // You might want to add state management for "Remember me"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-500"
                // You might want to add a navigation handler for "Forgot password"
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button 
            type="submit" 
            loading={loading} 
            className="w-full py-3"
            size="lg"
          >
            {isLogin ? 'Sign in' : 'Create account'}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({
                    email: '',
                    password: '',
                    confirmPassword: '',
                  });
                }}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Demo Access:</h4>
          <p className="text-xs text-blue-600">
            Use any email and password to create an account. First user becomes admin.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}