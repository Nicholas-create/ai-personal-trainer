'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { PageErrorFallback } from '@/components/ErrorBoundary';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProtectedError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error for debugging
    logger.error('Protected route error:', error);
  }, [error]);

  return <PageErrorFallback error={error} reset={reset} />;
}
