'use client';

import { Component, type ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and display errors gracefully
 *
 * Usage:
 * <ErrorBoundary>
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 *
 * Or with custom fallback:
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">&#128533;</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Please try again.
            </p>
            <button
              onClick={this.handleRetry}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Error fallback component for page-level errors
 */
interface PageErrorFallbackProps {
  error?: Error;
  reset?: () => void;
}

export function PageErrorFallback({ error, reset }: PageErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">&#9888;&#65039;</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Oops! Something went wrong
        </h1>
        <p className="text-gray-600 mb-2">
          We&apos;re sorry for the inconvenience. An unexpected error has occurred.
        </p>
        {error && (
          <p className="text-sm text-gray-500 mb-6 font-mono bg-gray-100 p-2 rounded">
            {error.message}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          {reset && (
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Error fallback for sections within a page
 */
interface SectionErrorFallbackProps {
  title?: string;
  retry?: () => void;
}

export function SectionErrorFallback({
  title = 'Error loading this section',
  retry,
}: SectionErrorFallbackProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p className="text-red-800 font-medium mb-3">{title}</p>
      {retry && (
        <button
          onClick={retry}
          className="text-sm text-red-600 hover:text-red-800 underline"
        >
          Click to retry
        </button>
      )}
    </div>
  );
}
