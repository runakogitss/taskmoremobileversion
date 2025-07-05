import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  createUserProfile: (userId: string, userData: { name: string; profilePic?: string | null }) => Promise<void>;
  signingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);

        // If user signs in, create/update their profile
        if (event === 'SIGNED_IN' && session?.user) {
          await handleUserSignIn(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSignIn = async (user: User) => {
    try {
      // Check if user profile exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      const googleName = user.user_metadata?.full_name;
      const googlePic = user.user_metadata?.avatar_url;

      if (!existingProfile) {
        // Create new user profile with Google data
        await supabase.from('users').insert([
            {
              id: user.id,
            name: googleName || user.email?.split('@')[0] || 'User',
            profilePic: googlePic || null,
            }
          ]);
      } else {
        // Only update if the user hasn't set a custom name or picture
        const updates: { name?: string; profilePic?: string | null } = {};
        if ((!existingProfile.name || existingProfile.name === user.email?.split('@')[0] || existingProfile.name === 'User') && googleName) {
          updates.name = googleName;
        }
        if ((!existingProfile.profilePic || existingProfile.profilePic === null) && googlePic) {
          updates.profilePic = googlePic;
        }
        if (Object.keys(updates).length > 0) {
          await supabase.from('users').update(updates).eq('id', user.id);
        }
      }
    } catch (error) {
      console.error('Error handling user sign in:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null); // Clear user context
      window.location.reload(); // Force reload to clear all state
    } catch (error) {
      setSigningOut(false);
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const createUserProfile = async (userId: string, userData: { name: string; profilePic?: string | null }) => {
    try {
      const { error } = await supabase
        .from('users')
        .insert([{ id: userId, ...userData }]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signOut,
      createUserProfile,
      signingOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 