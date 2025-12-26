'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { PageErrorFallback } from '@/components/ErrorBoundary';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error for debugging
    logger.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <PageErrorFallback error={error} reset={reset} />
      </body>
    </html>
  );
}
