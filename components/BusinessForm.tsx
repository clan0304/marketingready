'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import supabase from '@/utils/supabase/client';
import { Business } from '@/types';

// Define zod schema for form validation
const businessSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  address: z.string().min(1, { message: 'Address is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  email: z.string().email({ message: 'Invalid email format' }),
  location: z.string().min(1, { message: 'Location is required' }),
  instagram_url: z
    .string()
    .min(1, { message: 'Instagram URL is required' })
    .refine((val) => val.includes('instagram.com'), {
      message: 'Invalid Instagram URL',
    }),
});

// Type inference from zod schema
type BusinessFormData = z.infer<typeof businessSchema>;

interface BusinessFormProps {
  initialData?: Business;
  isEditing?: boolean;
}

export default function BusinessForm({
  initialData,
  isEditing = false,
}: BusinessFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize react-hook-form with zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: initialData || {
      name: '',
      address: '',
      description: '',
      email: '',
      location: '',
      instagram_url: '',
    },
  });

  // Get user ID and check for existing business profile
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError) throw userError;

        setUserId(userData.user.id);

        // If editing, we don't need to check for existing profile
        if (isEditing) return;

        // Check if user already has a business profile
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', userData.user.id)
          .single();

        if (businessError && businessError.code !== 'PGRST116') {
          throw businessError;
        }

        if (businessData) {
          // User already has a business profile, redirect to edit page
          router.push('/account/edit-business');
        }

        // Fetch user profile data to pre-fill email
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userData.user.id)
          .single();

        if (profileError) throw profileError;

        if (profileData) {
          reset({ ...initialData, email: profileData.email });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      }
    };

    fetchUserData();
  }, [isEditing, initialData, router, reset]);

  // Handle form submission
  const onSubmit = async (data: BusinessFormData) => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const businessData = {
        id: userId,
        ...data,
      };

      // Insert or update business profile
      const { error: upsertError } = isEditing
        ? await supabase
            .from('businesses')
            .update(businessData)
            .eq('id', userId)
        : await supabase.from('businesses').insert(businessData);

      if (upsertError) throw upsertError;

      // Redirect to success page or profile
      router.push('/account/profile');
    } catch (error) {
      console.error('Error saving business profile:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to save business profile'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle business deletion
  const handleDelete = async () => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    if (
      !window.confirm('Are you sure you want to delete your business profile?')
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('businesses')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

      router.push('/account');
    } catch (error) {
      console.error('Error deleting business profile:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to delete business profile'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Update Business Profile' : 'Create Business Profile'}
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Business Name*
          </label>
          <input
            id="name"
            {...register('name')}
            className={`mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              errors.name ? 'border-red-500' : ''
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email Address*
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={`mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              errors.email ? 'border-red-500' : ''
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700"
          >
            Address*
          </label>
          <input
            id="address"
            {...register('address')}
            className={`mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              errors.address ? 'border-red-500' : ''
            }`}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">
              {errors.address.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700"
          >
            Location*
          </label>
          <input
            id="location"
            {...register('location')}
            className={`mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              errors.location ? 'border-red-500' : ''
            }`}
            placeholder="City, Country"
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-600">
              {errors.location.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="instagram_url"
            className="block text-sm font-medium text-gray-700"
          >
            Instagram URL*
          </label>
          <input
            id="instagram_url"
            type="url"
            {...register('instagram_url')}
            className={`mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              errors.instagram_url ? 'border-red-500' : ''
            }`}
            placeholder="https://instagram.com/yourbusiness"
          />
          {errors.instagram_url && (
            <p className="mt-1 text-sm text-red-600">
              {errors.instagram_url.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description*
          </label>
          <textarea
            id="description"
            {...register('description')}
            rows={4}
            className={`mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              errors.description ? 'border-red-500' : ''
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete
            </button>
          )}

          <button
            type="button"
            onClick={() => router.push('/account')}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading
              ? isEditing
                ? 'Updating...'
                : 'Creating...'
              : isEditing
              ? 'Update'
              : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
