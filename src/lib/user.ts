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

  // Este projeto não possui tabela `public.users` no Supabase.
  // Para obter o church_id, usamos o vínculo direto em `churches.owner_id`.
  const { data: church, error: churchError } = await supabase
    .from('churches')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (churchError || !church?.id) {
    return null;
  }

  const profile: UserProfile = {
    id: user.id,
    auth_id: user.id,
    church_id: church.id,
    name: (user.user_metadata as any)?.name || (user.user_metadata as any)?.full_name || '',
    email: user.email || '',
    role: 'owner',
  };

  userProfileCache = profile;
  return profile;
}
