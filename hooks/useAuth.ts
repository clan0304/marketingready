import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import supabase from '@/utils/supabase/client'; // Updated import path to match our setup
import { useRouter, usePathname } from 'next/navigation';
import { Profile, Creator, Business } from '@/types'; // Import our types

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<Creator | null>(null);
  const [businessProfile, setBusinessProfile] = useState<Business | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profilesLoading, setProfilesLoading] = useState<boolean>(true);

  const router = useRouter();
  const pathname = usePathname();

  // Function to fetch profiles data
  const fetchProfiles = async (userId: string) => {
    setProfilesLoading(true);
    try {
      // Fetch base profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch creator profile if exists
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!creatorError) {
        setCreatorProfile(creatorData);
      }

      // Fetch business profile if exists
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!businessError) {
        setBusinessProfile(businessData);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setProfilesLoading(false);
    }
  };

  // Check if user needs to complete profile setup
  const checkProfileSetup = async (user: User | null) => {
    if (!user) return false;

    // Skip check if already on auth page
    if (pathname?.includes('/auth')) {
      return false;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

      // If no profile or username is missing, user needs setup
      if (error || !profile || !profile.username) {
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error checking profile:', err);
      return false;
    }
  };

  useEffect(() => {
    let isFirstLoad = true;

    const initAuth = async () => {
      setIsLoading(true);

      try {
        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const currentUser = session?.user || null;
        setUser(currentUser);
        setSession(session);
        setIsSignedIn(!!currentUser);

        // If user is authenticated, fetch profiles
        if (currentUser) {
          // Check if profile setup is needed
          if (isFirstLoad) {
            const needsSetup = await checkProfileSetup(currentUser);
            if (needsSetup) {
              router.push('/auth/complete-profile');
              return;
            }
          }

          // Fetch all profile data
          await fetchProfiles(currentUser.id);
        }

        setIsLoading(false);
        isFirstLoad = false;

        // Set up listener for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event);
            const updatedUser = session?.user || null;

            setUser(updatedUser);
            setSession(session);
            setIsSignedIn(!!updatedUser);

            if (event === 'SIGNED_IN' && updatedUser) {
              const needsSetup = await checkProfileSetup(updatedUser);
              if (needsSetup) {
                router.push('/auth/complete-profile');
                return;
              }

              // Fetch profiles data for new user
              await fetchProfiles(updatedUser.id);
            } else if (event === 'SIGNED_OUT') {
              // Clear profiles data on sign out
              setProfile(null);
              setCreatorProfile(null);
              setBusinessProfile(null);
            }
          }
        );

        // Clean up subscription
        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error in auth initialization:', err);
        setIsLoading(false);
        isFirstLoad = false;
      }
    };

    initAuth();
  }, [pathname, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Function to refresh profiles data
  const refreshProfiles = async () => {
    if (user) {
      await fetchProfiles(user.id);
    }
  };

  return {
    user,
    session,
    profile,
    creatorProfile,
    businessProfile,
    isSignedIn,
    isLoading,
    profilesLoading,
    hasCreatorProfile: !!creatorProfile,
    hasBusinessProfile: !!businessProfile,
    signOut,
    refreshProfiles,
  };
}
