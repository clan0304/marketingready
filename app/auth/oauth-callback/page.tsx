'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/utils/supabase/client';

export default function OAuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session info
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!sessionData.session) {
          throw new Error('No session found');
        }

        const user = sessionData.session.user;

        // Check if the user has a profile already
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" error, which we expect for new users
          throw profileError;
        }

        if (profileData) {
          // User has a profile already, redirect to dashboard
          router.push('/dashboard');
        } else {
          // New user, needs to create profile, redirect to profile setup
          router.push('/auth/complete-profile');
        }
      } catch (err) {
        console.error('Error in OAuth callback:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        router.push('/auth/signin?error=Authentication+failed');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {loading ? (
          <>
            <div className="w-16 h-16 border-t-4 border-indigo-600 border-solid rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-lg">Completing authentication...</p>
          </>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            <p>Error: {error}</p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 border-t-4 border-indigo-600 border-solid rounded-full animate-spin mx-auto"></div>
        )}
      </div>
    </div>
  );
}
