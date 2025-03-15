'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import supabase from '@/utils/supabase/client';

export default function CheckEmail() {
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    // Try to get the email from the session
    const getSessionEmail = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.email) {
        setEmail(data.session.user.email);
      }
    };

    getSessionEmail();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="h-8 w-8 text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            ></path>
          </svg>
        </div>

        <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>

        <p className="text-gray-600 mb-6">
          We&apos;ve sent a confirmation link to
          {email ? (
            <span className="font-semibold block mt-1">{email}</span>
          ) : (
            <span className="block mt-1">your email address</span>
          )}
        </p>

        <p className="text-gray-600 mb-8">
          Please click the link in that email to confirm your account.
          <br />
          If you don&apos;t see it, check your spam folder.
        </p>

        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
          >
            Return to Sign In
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="block w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition"
          >
            I&apos;ve Confirmed My Email
          </button>
        </div>
      </div>
    </div>
  );
}
