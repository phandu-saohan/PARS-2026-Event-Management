import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, getCurrentUser, signIn, signOut, onAuthStateChange } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ⚡ Perf: Read cached user synchronously from localStorage before first render
  // This lets the app render immediately without waiting for network auth check
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const storedUser = localStorage.getItem('pars_mock_user');
      if (storedUser) return JSON.parse(storedUser);
    } catch (e) { /* ignore */ }
    return null;
  });
  // ⚡ Perf: If we already have a cached user, skip initial loading state
  const [loading, setLoading] = useState(() => {
    try {
      // If Supabase is NOT configured, we can trust the localStorage cache immediately
      const hasMockUser = !!localStorage.getItem('pars_mock_user');
      if (hasMockUser) return false;
    } catch (e) { /* ignore */ }
    return true;
  });


  useEffect(() => {
    if (!isSupabaseConfigured()) {
      try {
        const storedUser = localStorage.getItem('pars_mock_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Error reading mock user cache:', e);
      }
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then(currUser => {
        setUser(currUser);
      })
      .catch(err => {
        console.error('Error getting initial user in AuthProvider:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    let subscriptionObj: any = null;
    try {
      const { data } = onAuthStateChange(async (event, session) => {
        try {
          if (event === 'SIGNED_OUT') {
            // Explicit logout — clear user state
            setUser(null);
            setLoading(false);
            return;
          }

          if (event === 'TOKEN_REFRESHED') {
            // Token was silently refreshed — no need to re-query DB profile
            // Just ensure loading is false so the app doesn't get stuck
            setLoading(false);
            return;
          }

          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            if (session?.user) {
              const currUser = await getCurrentUser();
              setUser(currUser);
            }
          } else if (!session?.user) {
            setUser(null);
          }
        } catch (err) {
          console.error('Error in auth state change callback in AuthProvider:', err);
        } finally {
          setLoading(false);
        }
      });
      subscriptionObj = data?.subscription;
    } catch (err) {
      console.error('Error setting up auth state listener in AuthProvider:', err);
      setLoading(false);
    }

    return () => {
      if (subscriptionObj) {
        subscriptionObj.unsubscribe();
      }
    };
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      // Mock login check for testing offline app
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail === 'admin@admin.com' && password === '12345678') {
        const mockUser: AuthUser = {
          id: 'mock-admin',
          email: cleanEmail,
          name: 'ADMIN SYSTEM',
          role: 'admin',
          status: 'active'
        };
        setUser(mockUser);
        localStorage.setItem('pars_mock_user', JSON.stringify(mockUser));
        return { success: true, error: null };
      }

      if (
        (cleanEmail === 'chi.pham@pars.org' || 
         cleanEmail === 'duong.dt@pars.org' || 
         cleanEmail === 'minh.tt@pars.org') && 
        password === 'admin123'
      ) {
        const role = cleanEmail.includes('chi.pham') ? 'admin' : cleanEmail.includes('duong') ? 'btc' : 'ctv';
        const mockUser: AuthUser = {
          id: `mock-${cleanEmail.split('@')[0]}`,
          email: cleanEmail,
          name: cleanEmail.split('@')[0].replace('.', ' ').toUpperCase(),
          role: role as any,
          status: 'active'
        };
        setUser(mockUser);
        localStorage.setItem('pars_mock_user', JSON.stringify(mockUser));
        return { success: true, error: null };
      }
      return { success: false, error: 'Đăng nhập thất bại. Tài khoản test: admin@admin.com / mật khẩu: 12345678' };
    }

    const { user: signedUser, error } = await signIn(email, password);
    if (error) {
      return { success: false, error };
    }
    setUser(signedUser);
    return { success: true, error: null };
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) {
      await signOut();
    } else {
      localStorage.removeItem('pars_mock_user');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn: handleSignIn, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
