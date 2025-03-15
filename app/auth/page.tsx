'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';
import supabase from '@/utils/supabase/client';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push('/dashboard');
      }
    };

    // Check for error in URL (e.g. from OAuth redirects)
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }

    // Check if we should start in signup mode
    const authMode = searchParams.get('mode');
    if (authMode === 'signup') {
      setMode('signup');
    }

    checkAuth();
  }, [router, searchParams]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/branding section */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {mode === 'signin'
              ? 'Sign in to your account'
              : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'signin'
              ? 'Enter your credentials to access your account'
              : 'Fill out the form to get started'}
          </p>
        </div>

        {/* Display errors */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Auth form toggle */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button
            className={`flex-1 py-3 font-medium ${
              mode === 'signin'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setMode('signin')}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-3 font-medium ${
              mode === 'signup'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* Auth forms */}
        <div className="mt-8">
          {mode === 'signin' ? (
            <SignInForm onError={setError} />
          ) : (
            <SignUpForm onError={setError} />
          )}
        </div>
      </div>
    </main>
  );
}
