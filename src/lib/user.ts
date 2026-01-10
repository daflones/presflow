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

export function clearUserDataCache() {
  userProfileCache = null;
}

export async function getUserData(): Promise<UserProfile | null> {
  if (userProfileCache) {
    return userProfileCache;
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Tentar buscar perfil do funcionário em public.users (se existir)
  const { data: employeeProfile, error: employeeError } = await supabase
    .from('users')
    .select('id,auth_id,church_id,name,email,role')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (!employeeError && employeeProfile?.church_id) {
    const profile: UserProfile = {
      id: employeeProfile.id,
      auth_id: employeeProfile.auth_id,
      church_id: employeeProfile.church_id,
      name: employeeProfile.name || '',
      email: employeeProfile.email || user.email || '',
      role: employeeProfile.role || '',
    };

    userProfileCache = profile;
    return profile;
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
