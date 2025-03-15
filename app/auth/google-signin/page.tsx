'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/utils/supabase/client';

export default function GoogleSignIn() {
  const router = useRouter();

  useEffect(() => {
    const handleGoogleSignIn = async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/oauth-callback`,
        },
      });

      if (error) {
        console.error('Error during Google sign in:', error);
        router.push('/auth/signin?error=Google+sign+in+failed');
      }
    };

    handleGoogleSignIn();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-t-4 border-indigo-600 border-solid rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-lg">Redirecting to Google...</p>
      </div>
    </div>
  );
}
