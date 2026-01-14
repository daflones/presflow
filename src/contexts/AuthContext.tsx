import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Church } from '../types/database';
import { clearUserDataCache } from '../lib/user';

type UserRole = 'admin' | 'manutencao' | 'consulta';

type UserProfile = {
  id: string;
  auth_id: string;
  church_id: string;
  name: string;
  email: string;
  role: UserRole | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  church: Church | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  isManager: boolean;
  isChurchAdmin: boolean;
  isReadOnly: boolean;
  canWrite: boolean;
  canSendWhatsapp: boolean;
  canEditClients: boolean;
  canEditCalendar: boolean;
  canManageConnections: boolean;
  canManageChurchUsers: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const lastAuthUserIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string, accessToken: string): Promise<UserProfile | null> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/users?auth_id=eq.${userId}&select=*`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data[0] as UserProfile;
      }
      return null;
    } catch {
      return null;
    }
  };

  const fetchChurchByOwnerId = async (userId: string, accessToken: string): Promise<Church | null> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/churches?owner_id=eq.${userId}&select=*`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        return data[0] as Church;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const fetchChurchById = async (churchId: string, accessToken: string): Promise<Church | null> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/churches?id=eq.${churchId}&select=*`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data[0] as Church;
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user && session.access_token) {
          if (lastAuthUserIdRef.current !== session.user.id) {
            clearUserDataCache();
            lastAuthUserIdRef.current = session.user.id;
          }
          const profileData = await fetchProfile(session.user.id, session.access_token);
          setProfile(profileData);

          let churchData: Church | null = null;
          if (profileData?.church_id) {
            churchData = await fetchChurchById(profileData.church_id, session.access_token);
          }
          if (!churchData) {
            churchData = await fetchChurchByOwnerId(session.user.id, session.access_token);
          }

          setChurch(churchData);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user && session.access_token) {
        if (lastAuthUserIdRef.current !== session.user.id) {
          clearUserDataCache();
          lastAuthUserIdRef.current = session.user.id;
        }
        const profileData = await fetchProfile(session.user.id, session.access_token);
        setProfile(profileData);

        let churchData: Church | null = null;
        if (profileData?.church_id) {
          churchData = await fetchChurchById(profileData.church_id, session.access_token);
        }
        if (!churchData) {
          churchData = await fetchChurchByOwnerId(session.user.id, session.access_token);
        }

        setChurch(churchData);
      } else {
        setChurch(null);
        setProfile(null);
        lastAuthUserIdRef.current = null;
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setChurch(null);
    setProfile(null);
    clearUserDataCache();
  };

  const normalizedRole = String(profile?.role ?? '').trim().toLowerCase();
  const isManager = church?.role === 'manager';
  const isOwner = !!church && church.owner_id === user?.id;
  const isChurchAdmin = normalizedRole === 'admin';
  const isMaintenance = normalizedRole === 'manutencao';
  const isChurchManager = normalizedRole === 'gerencia';
  const isReadOnly = !isOwner && normalizedRole === 'consulta';

  // Segurança: se não há profile (ex: RLS bloqueando leitura), negar escrita para não-owner
  const canWrite = isOwner || isChurchAdmin || isMaintenance || isChurchManager;
  const canSendWhatsapp = canWrite;
  const canEditClients = canWrite;
  const canEditCalendar = canWrite;
  const canManageConnections = canWrite;
  const canManageChurchUsers = isOwner || isChurchAdmin;

  const value = {
    session,
    user,
    church,
    profile,
    loading,
    isAuthenticated: !!user,
    isOwner,
    isManager: !!isManager,
    isChurchAdmin,
    isReadOnly,
    canWrite,
    canSendWhatsapp,
    canEditClients,
    canEditCalendar,
    canManageConnections,
    canManageChurchUsers,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
