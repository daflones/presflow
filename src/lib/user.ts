import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  auth_id: string;
  church_id: string;
  name: string;
  email: string;
  role: string;
}

let userProfileCache: UserProfile | null = null;

export async function getUserData(): Promise<UserProfile | null> {
  if (userProfileCache) {
    return userProfileCache;
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  userProfileCache = data;
  return data;
}
