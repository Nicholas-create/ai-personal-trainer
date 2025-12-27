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
async function setAuthCookie(idToken: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });
    if (!response.ok) {
      logger.error('Failed to set auth cookie:', response.status, await response.text().catch(() => 'unknown error'));
      return false;
    }
    return true;
  } catch (error) {
    // Log but don't block auth - client-side auth still works via Firebase
    logger.error('Error setting auth cookie:', error);
    return false;
  }
}

async function clearAuthCookie(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session', { method: 'DELETE' });
    if (!response.ok) {
      logger.error('Failed to clear auth cookie:', response.status);
      return false;
    }
    return true;
  } catch (error) {
    logger.error('Error clearing auth cookie:', error);
    return false;
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
        // Get fresh ID token and set auth cookie for middleware detection
        const idToken = await fbUser.getIdToken();
        await setAuthCookie(idToken);
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
      // Set auth cookie with token binding
      const idToken = await fbUser.getIdToken();
      await setAuthCookie(idToken);
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
