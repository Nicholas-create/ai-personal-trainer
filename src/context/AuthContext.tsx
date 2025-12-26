'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthChange, signInWithGoogle, signOut } from '@/lib/firebase/auth';
import { getUser, createUser } from '@/lib/firebase/firestore';
import { logger } from '@/lib/logger';
import type { User } from '@/types/user';

// Cookie helpers for middleware auth detection
// Uses server-side API route to set HttpOnly cookies for security
// This prevents XSS attacks from accessing the auth cookie
async function setAuthCookie(): Promise<void> {
  try {
    await fetch('/api/auth/session', { method: 'POST' });
  } catch {
    // Silently fail - auth will still work client-side via Firebase
  }
}

async function clearAuthCookie(): Promise<void> {
  try {
    await fetch('/api/auth/session', { method: 'DELETE' });
  } catch {
    // Silently fail
  }
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async (fbUser: FirebaseUser) => {
    let userData = await getUser(fbUser.uid);

    if (!userData) {
      // Create new user record
      await createUser(fbUser.uid, {
        email: fbUser.email || '',
        displayName: fbUser.displayName || '',
        photoURL: fbUser.photoURL || undefined,
      });
      userData = await getUser(fbUser.uid);
    }

    setUser(userData);
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Set auth cookie for middleware detection (HttpOnly via server)
        await setAuthCookie();
        await loadUser(fbUser);
      } else {
        await clearAuthCookie();
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const fbUser = await signInWithGoogle();
      await loadUser(fbUser);
    } catch (error) {
      logger.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await clearAuthCookie();
      await signOut();
      setUser(null);
    } catch (error) {
      logger.error('Sign out error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      await loadUser(firebaseUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        signIn: handleSignIn,
        signOut: handleSignOut,
        refreshUser,
      }}
    >
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
