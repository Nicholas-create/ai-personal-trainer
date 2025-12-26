'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pb-24 lg:pb-0">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Mobile Bottom Navigation - Hidden on desktop */}
      <div className="lg:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
