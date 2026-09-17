import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { Profile, UserRole, Business } from '../types/database';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole;
  businessId: string | null;
  loading: boolean;
  isLiveSupabase: boolean;
  authError: string | null;
  clearAuthError: () => void;

  // Real Supabase Auth Actions
  signIn: (email: string, password?: string) => Promise<{ error?: string; user?: User }>;
  signUp: (options: {
    email: string;
    password?: string;
    fullName: string;
    role?: UserRole;
    businessName?: string;
    phone?: string;
  }) => Promise<{ error?: string; user?: User }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string; message?: string }>;
  updateCurrentProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;

  // UI state & rapid persona switching for evaluations
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  selectDemoPersona: (personaRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const LOCAL_AUTH_USER_KEY = 'leadtoquote_auth_user_v2';
const DEFAULT_BUSINESS_ID = 'b-miller-hvac-001';

/**
 * Parses and formats Supabase authentication errors into friendly, actionable messages
 */
export function formatAuthError(err: any): string {
  if (!err) return 'An unexpected authentication error occurred.';
  const raw = typeof err === 'string' ? err : err.message || err.error_description || '';
  const lower = raw.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists') || lower.includes('user_already_exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (lower.includes('password should be at least') || lower.includes('weak_password')) {
    return 'Password must be at least 6 characters long.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Email confirmation is required. Please check your email inbox to verify your account.';
  }
  if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit')) {
    return 'Too many attempts. Please wait a few moments before trying again.';
  }
  if (lower.includes('unable to validate email') || lower.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Unable to reach the authentication service. Please check your internet connection.';
  }
  return raw || 'Authentication failed. Please check your details and try again.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  const isLive = isSupabaseConfigured() && supabase !== null;

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Helper to fetch or bootstrap user profile from Supabase
  const fetchAndSyncProfile = useCallback(
    async (userId: string, userObj?: User | null): Promise<Profile | null> => {
      if (!supabase) return null;

      try {
        // Query profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (data && !error) {
          const loadedProfile = data as Profile;
          setProfile(loadedProfile);
          return loadedProfile;
        }

        // If user exists in Auth but not in profiles table, create the profile
        if (userObj) {
          let defaultBizId = DEFAULT_BUSINESS_ID;
          try {
            const { data: bData } = await supabase.from('businesses').select('id').limit(1);
            if (bData && bData.length > 0) {
              defaultBizId = bData[0].id;
            }
          } catch {
            // Keep default
          }

          const rawRole = (userObj.user_metadata?.role as UserRole) || 'customer';
          // Ensure role matches valid UserRole
          const safeRole: UserRole = ['owner', 'admin', 'technician', 'customer', 'staff'].includes(rawRole)
            ? rawRole
            : 'customer';

          const newProf: Profile = {
            id: userObj.id,
            business_id: userObj.user_metadata?.business_id || defaultBizId,
            full_name:
              userObj.user_metadata?.full_name ||
              userObj.email?.split('@')[0].replace('.', ' ') ||
              'Valued Member',
            email: userObj.email || '',
            phone: userObj.user_metadata?.phone || undefined,
            role: safeRole,
            avatar_url:
              userObj.user_metadata?.avatar_url ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error: insertErr } = await supabase.from('profiles').upsert(newProf, { onConflict: 'id' });
          if (insertErr) {
            console.warn('Profile bootstrap notice:', insertErr.message);
          }
          setProfile(newProf);
          return newProf;
        }
      } catch (err) {
        console.warn('Error fetching Supabase user profile:', err);
      }

      return null;
    },
    []
  );

  // Initialize session and listen for auth state changes
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      setLoading(true);

      if (isLive && supabase) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Supabase getSession returned notice:', error.message);
          }

          if (isMounted && data?.session) {
            setSession(data.session);
            setUser(data.session.user);
            await fetchAndSyncProfile(data.session.user.id, data.session.user);
          } else if (isMounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        } catch (err) {
          console.warn('Supabase auth session fetch failed, checking local state:', err);
        }

        // Real-time auth listener
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (!isMounted) return;
          setSession(newSession);
          setUser(newSession?.user || null);

          if (newSession?.user) {
            await fetchAndSyncProfile(newSession.user.id, newSession.user);
          } else {
            setProfile(null);
          }

          if (event === 'PASSWORD_RECOVERY') {
            setIsAuthModalOpen(true);
          }
        });

        if (isMounted) setLoading(false);
        return () => {
          authListener.subscription.unsubscribe();
        };
      } else {
        // Local simulation recovery
        const saved = localStorage.getItem(LOCAL_AUTH_USER_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.user && parsed.profile) {
              setUser(parsed.user);
              setProfile(parsed.profile);
            }
          } catch (e) {
            console.error('Failed to parse saved auth profile', e);
          }
        }
        if (isMounted) setLoading(false);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, [isLive, fetchAndSyncProfile]);

  // Sign In with email + password
  const signIn = async (email: string, password = ''): Promise<{ error?: string; user?: User }> => {
    setLoading(true);
    setAuthError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      const err = 'Please enter your email address.';
      setAuthError(err);
      setLoading(false);
      return { error: err };
    }
    if (!password) {
      const err = 'Please enter your password.';
      setAuthError(err);
      setLoading(false);
      return { error: err };
    }

    if (isLive && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          const friendlyError = formatAuthError(error);
          setAuthError(friendlyError);
          setLoading(false);
          return { error: friendlyError };
        }

        if (data.user) {
          setUser(data.user);
          setSession(data.session);
          await fetchAndSyncProfile(data.user.id, data.user);
        }

        setLoading(false);
        setIsAuthModalOpen(false);
        return { user: data.user || undefined };
      } catch (err: any) {
        const friendlyError = formatAuthError(err);
        setAuthError(friendlyError);
        setLoading(false);
        return { error: friendlyError };
      }
    }

    // Local / Offline Simulation mode
    const role: UserRole = cleanEmail.includes('tech')
      ? 'technician'
      : cleanEmail.includes('customer') || cleanEmail.includes('client') || cleanEmail.includes('sarah')
      ? 'customer'
      : cleanEmail.includes('admin')
      ? 'admin'
      : 'owner';

    const localProfile: Profile = {
      id: `usr_${Date.now()}`,
      business_id: DEFAULT_BUSINESS_ID,
      full_name: cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email: cleanEmail,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    };

    const mockUser: any = {
      id: localProfile.id,
      email: localProfile.email,
      created_at: localProfile.created_at,
      user_metadata: {
        full_name: localProfile.full_name,
        role: localProfile.role,
      },
    };

    setUser(mockUser);
    setProfile(localProfile);
    localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify({ user: mockUser, profile: localProfile }));

    setLoading(false);
    setIsAuthModalOpen(false);
    return { user: mockUser };
  };

  // Sign Up with email + password (Strictly enforces no self-escalation to owner/admin)
  const signUp = async (options: {
    email: string;
    password?: string;
    fullName: string;
    role?: UserRole;
    businessName?: string;
    phone?: string;
  }): Promise<{ error?: string; user?: User }> => {
    setLoading(true);
    setAuthError(null);

    const cleanEmail = options.email.trim();
    const fullName = options.fullName.trim();
    const pwd = options.password || '';

    if (!cleanEmail || !fullName) {
      const err = 'Full name and email address are required.';
      setAuthError(err);
      setLoading(false);
      return { error: err };
    }

    if (!pwd || pwd.length < 6) {
      const err = 'Password must be at least 6 characters long.';
      setAuthError(err);
      setLoading(false);
      return { error: err };
    }

    // REQUIREMENT 6: New users must NOT be able to choose or escalate themselves to owner/admin.
    // Self-serve signups are restricted to 'customer' or 'technician'.
    const safeRole: UserRole = options.role === 'technician' ? 'technician' : 'customer';

    if (isLive && supabase) {
      try {
        // Resolve business ID
        let resolvedBizId: string = DEFAULT_BUSINESS_ID;
        try {
          const { data: bData } = await supabase.from('businesses').select('id').limit(1);
          if (bData && bData.length > 0) {
            resolvedBizId = bData[0].id;
          }
        } catch {
          // Keep default
        }

        // Call Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: pwd,
          options: {
            data: {
              full_name: fullName,
              role: safeRole,
              phone: options.phone?.trim() || null,
              business_id: resolvedBizId,
            },
          },
        });

        if (error) {
          const friendly = formatAuthError(error);
          setAuthError(friendly);
          setLoading(false);
          return { error: friendly };
        }

        if (data.user) {
          setUser(data.user);
          setSession(data.session);

          // REQUIREMENT 3 & 4: Create user's profile in the profiles table containing id, full_name, email, role, business_id
          const newProf: Profile = {
            id: data.user.id,
            business_id: resolvedBizId,
            full_name: fullName,
            email: cleanEmail,
            phone: options.phone?.trim() || undefined,
            role: safeRole,
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          try {
            const { error: profErr } = await supabase.from('profiles').upsert(newProf, { onConflict: 'id' });
            if (profErr) {
              console.warn('Profile direct upsert notice:', profErr.message);
            }
          } catch (e) {
            console.warn('Profile write exception:', e);
          }

          setProfile(newProf);
        }

        setLoading(false);
        setIsAuthModalOpen(false);
        return { user: data.user || undefined };
      } catch (err: any) {
        const friendly = formatAuthError(err);
        setAuthError(friendly);
        setLoading(false);
        return { error: friendly };
      }
    }

    // Local simulation registration
    const newId = `usr_${Date.now()}`;
    const localProfile: Profile = {
      id: newId,
      business_id: DEFAULT_BUSINESS_ID,
      full_name: fullName,
      email: cleanEmail,
      phone: options.phone || '(555) 300-8800',
      role: safeRole,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockUser: any = {
      id: newId,
      email: cleanEmail,
      created_at: localProfile.created_at,
      user_metadata: {
        full_name: fullName,
        role: safeRole,
      },
    };

    setUser(mockUser);
    setProfile(localProfile);
    localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify({ user: mockUser, profile: localProfile }));

    setLoading(false);
    setIsAuthModalOpen(false);
    return { user: mockUser };
  };

  // Sign Out
  const signOut = async () => {
    setLoading(true);
    if (isLive && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out notice:', e);
      }
    }
    localStorage.removeItem(LOCAL_AUTH_USER_KEY);
    setUser(null);
    setSession(null);
    setProfile(null);
    setAuthError(null);
    setLoading(false);
  };

  // Password Reset / Forgot Password
  const resetPassword = async (email: string): Promise<{ error?: string; message?: string }> => {
    setLoading(true);
    setAuthError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      const err = 'Please provide your account email address.';
      setAuthError(err);
      setLoading(false);
      return { error: err };
    }

    if (isLive && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
        });

        if (error) {
          const friendly = formatAuthError(error);
          setAuthError(friendly);
          setLoading(false);
          return { error: friendly };
        }

        setLoading(false);
        return { message: `Password reset link sent to ${cleanEmail}. Check your inbox.` };
      } catch (err: any) {
        const friendly = formatAuthError(err);
        setAuthError(friendly);
        setLoading(false);
        return { error: friendly };
      }
    }

    // Local mode feedback
    setLoading(false);
    return { message: `Simulated reset: Link sent to ${cleanEmail}.` };
  };

  // Set new password (e.g. after recovery link)
  const updatePassword = async (newPassword: string): Promise<{ error?: string; message?: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { error: 'New password must be at least 6 characters long.' };
    }

    if (isLive && supabase) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          return { error: formatAuthError(error) };
        }
        return { message: 'Password updated successfully!' };
      } catch (err: any) {
        return { error: formatAuthError(err) };
      }
    }

    return { message: 'Password updated in local test session.' };
  };

  // Update profile
  const updateCurrentProfile = async (updates: Partial<Profile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates, updated_at: new Date().toISOString() };
    setProfile(updated);

    if (isLive && supabase && user) {
      try {
        await supabase.from('profiles').update(updates).eq('id', user.id);
      } catch (e) {
        console.warn('Profile sync notice:', e);
      }
    } else {
      localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify({ user, profile: updated }));
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchAndSyncProfile(user.id, user);
    }
  };

  // Fast Persona Switcher for evaluation & demonstrations
  const selectDemoPersona = (personaRole: UserRole) => {
    if (personaRole === 'owner' || personaRole === 'admin') {
      const p: Profile = {
        id: 'p-david-owner',
        business_id: DEFAULT_BUSINESS_ID,
        full_name: 'David Miller',
        email: 'david@millerhvac.com',
        phone: '(555) 019-2834',
        role: personaRole,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(p);
      const mockUser = { id: p.id, email: p.email, user_metadata: { role: p.role, full_name: p.full_name } } as any;
      setUser(mockUser);
      localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify({ user: mockUser, profile: p }));
    } else if (personaRole === 'technician') {
      const p: Profile = {
        id: 'p-marcus-tech',
        business_id: DEFAULT_BUSINESS_ID,
        full_name: 'Marcus Reed',
        email: 'marcus@millerhvac.com',
        phone: '(555) 019-5821',
        role: 'technician',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(p);
      const mockUser = { id: p.id, email: p.email, user_metadata: { role: p.role, full_name: p.full_name } } as any;
      setUser(mockUser);
      localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify({ user: mockUser, profile: p }));
    } else {
      const p: Profile = {
        id: 'p-sarah-customer',
        business_id: DEFAULT_BUSINESS_ID,
        full_name: 'Sarah Jenkins',
        email: 'sarah.j@residential.com',
        phone: '(555) 482-1920',
        role: 'customer',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(p);
      const mockUser = { id: p.id, email: p.email, user_metadata: { role: p.role, full_name: p.full_name } } as any;
      setUser(mockUser);
      localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify({ user: mockUser, profile: p }));
    }
  };

  const activeRole: UserRole = profile?.role || 'owner';
  const activeBusinessId = profile?.business_id || DEFAULT_BUSINESS_ID;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role: activeRole,
        businessId: activeBusinessId,
        loading,
        isLiveSupabase: isLive,
        authError,
        clearAuthError,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        updateCurrentProfile,
        refreshProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isOnboardingOpen,
        setIsOnboardingOpen,
        selectDemoPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
