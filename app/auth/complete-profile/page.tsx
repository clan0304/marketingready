/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import supabase from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export default function CompleteProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string>('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean>(true);
  const [usernameChecking, setUsernameChecking] = useState<boolean>(false);

  // Check if user is authenticated and get session
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        router.push('/auth/signin');
        return;
      }

      setUser(data.session.user);

      // Check if user already has a profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (profileData) {
        // User already has a profile, redirect to dashboard
        router.push('/dashboard');
        return;
      }

      // If the user has a Google avatar, set it as the default
      if (data.session.user.user_metadata?.avatar_url) {
        setPhotoPreview(data.session.user.user_metadata.avatar_url);
      }

      // Suggest a username from their email or name
      let suggestedUsername = '';
      if (data.session.user.user_metadata?.full_name) {
        suggestedUsername = data.session.user.user_metadata.full_name
          .toLowerCase()
          .replace(/\s+/g, '')
          .replace(/[^a-z0-9]/g, '');
      } else if (data.session.user.email) {
        suggestedUsername = data.session.user.email.split('@')[0];
      }

      // Ensure username is valid and check availability
      if (suggestedUsername) {
        setUsername(suggestedUsername);
        checkUsername(suggestedUsername);
      }

      setLoading(false);
    };

    checkSession();
  }, [router]);

  // Handle image upload preview
  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setProfilePhoto(file);

      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Check if username is unique
  const checkUsername = async (username: string) => {
    if (username.length < 3) return;

    setUsernameChecking(true);
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    setUsernameChecking(false);
    setUsernameAvailable(!data);
  };

  // Handle username input with debounce
  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);

    // Debounce username check
    if ((window as any).usernameTimer) {
      clearTimeout((window as any).usernameTimer);
    }

    (window as any).usernameTimer = setTimeout(() => {
      checkUsername(value);
    }, 500);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!usernameAvailable) {
      setError('Username is already taken');
      return;
    }

    if (!user) {
      setError('No authenticated user found');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Upload profile photo if selected
      let photoUrl = photoPreview; // Use existing preview if from Google

      if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, profilePhoto);

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);

        photoUrl = urlData.publicUrl;
      }

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          username,
          profile_completed: true,
        },
      });

      if (updateError) throw updateError;

      // Create profile record
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: user.id,
          username,
          profile_photo_url: photoUrl,
          created_at: new Date().toISOString(),
        },
      ]);

      if (profileError) throw profileError;

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing profile:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'An error occurred while completing your profile'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-t-4 border-indigo-600 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Complete Your Profile
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Just a couple more details to get you set up!
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  username.length > 2 && !usernameAvailable
                    ? 'border-red-500 focus:ring-red-500'
                    : username.length > 2 && usernameAvailable
                    ? 'border-green-500 focus:ring-green-500'
                    : 'focus:ring-indigo-500'
                }`}
                value={username}
                onChange={handleUsernameChange}
                minLength={3}
                required
              />
              {usernameChecking && (
                <div className="absolute right-3 top-3">
                  <svg
                    className="animate-spin h-5 w-5 text-indigo-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              )}
              {username.length > 2 && !usernameChecking && (
                <div className="absolute right-3 top-3">
                  {usernameAvailable ? (
                    <svg
                      className="h-5 w-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  )}
                </div>
              )}
            </div>
            {username.length > 2 && !usernameAvailable && (
              <p className="text-red-500 text-sm mt-1">
                This username is already taken
              </p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              This will be your unique identifier on the platform
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Profile Photo</label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center border">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Profile preview"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                )}
              </div>
              <input
                id="profilePhoto"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                onClick={() => document.getElementById('profilePhoto')?.click()}
                className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition"
              >
                {photoPreview ? 'Change Photo' : 'Upload Photo'}
              </button>
            </div>
            {photoPreview && (
              <p className="text-gray-500 text-sm mt-2">
                You can change your profile photo anytime from your settings
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition"
            disabled={submitting || (username.length > 0 && !usernameAvailable)}
          >
            {submitting ? 'Completing Profile...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
