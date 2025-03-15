'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import supabase from '@/utils/supabase/client';

interface SignUpFormProps {
  onError: (error: string | null) => void;
}

export default function SignUpForm({ onError }: SignUpFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean>(true);
  const [usernameChecking, setUsernameChecking] = useState<boolean>(false);

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

  // Check if username is unique with debounce
  useEffect(() => {
    if (username.length < 3) return;

    const timer = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .single();

        setUsernameAvailable(!data);
      } catch (err) {
        console.log(err);
        setUsernameAvailable(true);
      } finally {
        setUsernameChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!usernameAvailable) {
      onError('Username is already taken');
      return;
    }

    try {
      setLoading(true);
      onError(null);

      // 1. Create the user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // 2. Upload profile photo if selected
      let photoUrl: string | null = null;
      if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${authData.user.id}-${Math.random()
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

      // 3. Create profile record
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: authData.user.id,
          username,
          profile_photo_url: photoUrl,
          created_at: new Date().toISOString(),
        },
      ]);

      if (profileError) throw profileError;

      // Redirect to confirmation page
      router.push('/auth/check-email');
    } catch (error) {
      console.error('Error during sign up:', error);
      onError(
        error instanceof Error
          ? error.message
          : 'An error occurred during sign up'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    router.push('/auth/google-signin');
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="signup-email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <div className="mt-1">
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="mt-1">
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Must be at least 8 characters
          </p>
        </div>

        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700"
          >
            Username
          </label>
          <div className="mt-1 relative">
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm ${
                username.length > 2 && !usernameAvailable
                  ? 'border-red-500 focus:ring-red-500'
                  : username.length > 2 && usernameAvailable
                  ? 'border-green-500 focus:ring-green-500'
                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
            {usernameChecking && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
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
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
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
            <p className="mt-1 text-sm text-red-600">
              This username is already taken
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Profile Photo
          </label>
          <div className="mt-1 flex items-center space-x-4">
            <div className="h-16 w-16 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center border">
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Profile preview"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  className="h-8 w-8 text-gray-400"
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
              className="px-3 py-1.5 bg-gray-100 text-sm rounded-md text-gray-700 hover:bg-gray-200 transition"
            >
              {photoPreview ? 'Change' : 'Upload Photo'}
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
            I agree to the{' '}
            <a href="#" className="text-indigo-600 hover:text-indigo-500">
              Terms
            </a>{' '}
            and{' '}
            <a href="#" className="text-indigo-600 hover:text-indigo-500">
              Privacy Policy
            </a>
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || !usernameAvailable}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"
              />
              <path
                fill="#34A853"
                d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"
              />
              <path
                fill="#4A90E2"
                d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"
              />
              <path
                fill="#FBBC05"
                d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"
              />
            </svg>
            Google
          </button>
        </div>
      </div>
    </div>
  );
}
