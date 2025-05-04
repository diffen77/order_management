import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: AuthError | null, user: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to refresh session
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Unexpected error during session refresh:', err);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    // Set up session refresh interval (every 30 minutes)
    const refreshInterval = setInterval(refreshSession, 30 * 60 * 1000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    return () => {
      clearInterval(refreshInterval);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (!error && data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setIsAuthenticated(true);
      }
      
      return { error };
    } catch (err) {
      console.error('Unexpected error during sign in:', err);
      return { error: new AuthError('An unexpected error occurred') };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });
      
      return { user: data.user, error };
    } catch (err) {
      console.error('Unexpected error during sign up:', err);
      return { user: null, error: new AuthError('An unexpected error occurred') };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      return { error };
    } catch (err) {
      console.error('Error resetting password:', err);
      return { error: new AuthError('An unexpected error occurred') };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      return { error };
    } catch (err) {
      console.error('Error updating password:', err);
      return { error: new AuthError('An unexpected error occurred') };
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 