import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Church } from '../types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  church: Church | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  isManager: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Função para buscar a igreja do usuário pelo owner_id
  const fetchChurch = async (userId: string): Promise<Church | null> => {
    console.log('Buscando igreja para userId:', userId);
    
    // Usar fetch direto para evitar problemas com o client Supabase
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/churches?owner_id=eq.${userId}&select=*`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Erro HTTP ao buscar igreja:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('Igreja encontrada:', data);
      
      if (data && data.length > 0) {
        return data[0] as Church;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar igreja:', error);
      return null;
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const churchData = await fetchChurch(session.user.id);
          setChurch(churchData);
        }
      } catch (error) {
        console.error('Erro ao obter sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const churchData = await fetchChurch(session.user.id);
        setChurch(churchData);
      } else {
        setChurch(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Função de logout
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setChurch(null);
  };

  // Verificar se o usuário tem role 'manager' na igreja
  const isManager = church?.role === 'manager';

  const value = {
    session,
    user,
    church,
    loading,
    isAuthenticated: !!user,
    isOwner: !!church && church.owner_id === user?.id,
    isManager: !!isManager,
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
