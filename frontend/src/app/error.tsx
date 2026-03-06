'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error);
    }
  }, [error]);

  // Don't show error UI for fetch errors in development
  const isFetchError = error.message.includes('fetch') || error.message.includes('Failed to fetch');

  if (isFetchError && process.env.NODE_ENV === 'development') {
    // Silently handle fetch errors - these are usually from API unavailability
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          出现错误
        </h2>

        <p className="text-slate-600 dark:text-slate-400 mb-6">
          应用程序遇到了一个问题。您可以尝试刷新页面或返回首页。
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-left">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              错误详情：
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>

          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            首页
          </Link>
        </div>
      </div>
    </div>
  );
}
