'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/utils/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get query parameters from URL
        const queryParams = new URL(window.location.href).searchParams;

        // If no parameters, redirect to sign in
        if (
          !queryParams.get('error') &&
          !queryParams.get('error_description') &&
          !queryParams.get('access_token')
        ) {
          router.push('/auth/signin');
          return;
        }

        // Check for errors from Supabase auth redirect
        if (queryParams.get('error')) {
          throw new Error(
            queryParams.get('error_description') || 'Authentication error'
          );
        }

        // Exchange code for session
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;
        if (!data.session) {
          throw new Error('Authentication failed - no session found');
        }

        // Redirect based on profile status
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        if (
          profileError &&
          (profileError as PostgrestError).code !== 'PGRST116'
        ) {
          // PGRST116 is "no rows returned" error
          throw profileError;
        }

        if (profileData) {
          // Profile exists, redirect to dashboard
          router.push('/dashboard');
        } else {
          // Profile doesn't exist, need to complete profile
          router.push('/auth/complete-profile');
        }
      } catch (err) {
        console.error('Error during auth callback:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setLoading(false);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-6 max-w-sm mx-auto">
        {loading ? (
          <>
            <div className="w-16 h-16 border-t-4 border-indigo-600 border-solid rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-lg">Verifying your account...</p>
          </>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Return to Sign In
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
