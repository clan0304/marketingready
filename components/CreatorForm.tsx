'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import supabase from '@/utils/supabase/client';
import { Creator } from '@/types';

// Define zod schema for form validation
const creatorSchema = z.object({
  description: z.string().min(1, { message: 'Description is required' }),
  instagram_url: z
    .string()
    .min(1, { message: 'Instagram URL is required' })
    .refine((val) => val.includes('instagram.com'), {
      message: 'Invalid Instagram URL',
    }),
  tiktok_url: z
    .string()
    .min(1, { message: 'TikTok URL is required' })
    .refine((val) => val.includes('tiktok.com'), {
      message: 'Invalid TikTok URL',
    }),
  youtube_url: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.includes('youtube.com') || val.includes('youtu.be'),
      { message: 'Invalid YouTube URL' }
    ),
  location: z.string().min(1, { message: 'Location is required' }),
  languages: z
    .array(z.string())
    .min(1, { message: 'At least one language is required' }),
});

// Type inference from zod schema
type CreatorFormData = z.infer<typeof creatorSchema>;

interface CreatorFormProps {
  initialData?: Creator;
  isEditing?: boolean;
}

export default function CreatorForm({
  initialData,
  isEditing = false,
}: CreatorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [languageInput, setLanguageInput] = useState('');

  // Initialize react-hook-form with zod resolver
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatorFormData>({
    resolver: zodResolver(creatorSchema),
    defaultValues: initialData || {
      description: '',
      instagram_url: '',
      tiktok_url: '',
      youtube_url: '',
      location: '',
      languages: [],
    },
  });

  const languages = watch('languages');

  // Get user ID and check for existing creator profile
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError) throw userError;

        setUserId(userData.user.id);

        // If editing, we don't need to check for existing profile
        if (isEditing) return;

        // Check if user already has a creator profile
        const { data: creatorData, error: creatorError } = await supabase
          .from('creators')
          .select('*')
          .eq('id', userData.user.id)
          .single();

        if (creatorError && creatorError.code !== 'PGRST116') {
          throw creatorError;
        }

        if (creatorData) {
          // User already has a creator profile, redirect to edit page
          router.push('/account/edit-creator');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      }
    };

    fetchUserData();
  }, [isEditing, router]);

  // Handle adding a new language
  const addLanguage = () => {
    if (languageInput.trim() && !languages.includes(languageInput.trim())) {
      setValue('languages', [...languages, languageInput.trim()]);
      setLanguageInput('');
    }
  };

  // Handle removing a language
  const removeLanguage = (index: number) => {
    setValue(
      'languages',
      languages.filter((_, i) => i !== index)
    );
  };

  // Handle form submission
  const onSubmit = async (data: CreatorFormData) => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const creatorData = {
        id: userId,
        ...data,
      };

      // Insert or update creator profile
      const { error: upsertError } = isEditing
        ? await supabase.from('creators').update(creatorData).eq('id', userId)
        : await supabase.from('creators').insert(creatorData);

      if (upsertError) throw upsertError;

      // Redirect to success page or profile
      router.push('/account/profile');
    } catch (error) {
      console.error('Error saving creator profile:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to save creator profile'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle creator deletion
  const handleDelete = async () => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    if (
      !window.confirm('Are you sure you want to delete your creator profile?')
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('creators')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

      router.push('/account');
    } catch (error) {
      console.error('Error deleting creator profile:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to delete creator profile'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Update Creator Profile' : 'Create Creator Profile'}
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            placeholder="https://instagram.com/username"
          />
          {errors.instagram_url && (
            <p className="mt-1 text-sm text-red-600">
              {errors.instagram_url.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="tiktok_url"
            className="block text-sm font-medium text-gray-700"
          >
            TikTok URL*
          </label>
          <input
            id="tiktok_url"
            type="url"
            {...register('tiktok_url')}
            className={`mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              errors.tiktok_url ? 'border-red-500' : ''
            }`}
            placeholder="https://tiktok.com/@username"
          />
          {errors.tiktok_url && (
            <p className="mt-1 text-sm text-red-600">
              {errors.tiktok_url.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="youtube_url"
            className="block text-sm font-medium text-gray-700"
          >
            YouTube URL (Optional)
          </label>
          <input
            id="youtube_url"
            type="url"
            {...register('youtube_url')}
            className={`mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              errors.youtube_url ? 'border-red-500' : ''
            }`}
            placeholder="https://youtube.com/c/channelname"
          />
          {errors.youtube_url && (
            <p className="mt-1 text-sm text-red-600">
              {errors.youtube_url.message}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Languages*
          </label>
          <div className="flex">
            <input
              type="text"
              value={languageInput}
              onChange={(e) => setLanguageInput(e.target.value)}
              className="flex-grow mr-2 rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter a language"
            />
            <button
              type="button"
              onClick={addLanguage}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Add
            </button>
          </div>

          <Controller
            control={control}
            name="languages"
            render={({ field: { onChange } }) => (
              <div className="mt-2">
                {languages.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {languages.map((lang, index) => (
                      <div
                        key={index}
                        className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded flex items-center"
                      >
                        {lang}
                        <button
                          type="button"
                          onClick={() => {
                            removeLanguage(index);
                            onChange(languages.filter((_, i) => i !== index));
                          }}
                          className="ml-2 text-indigo-500 hover:text-indigo-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mt-1">
                    No languages added yet
                  </p>
                )}
              </div>
            )}
          />
          {errors.languages && (
            <p className="mt-1 text-sm text-red-600">
              {errors.languages.message}
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
