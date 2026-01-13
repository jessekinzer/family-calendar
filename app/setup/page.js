'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Check, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SetupContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check URL params for success/error
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');

    if (success === 'true') {
      setStatus('connected');
      return;
    }

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setStatus('error');
      return;
    }

    // Check auth status
    checkAuthStatus();
  }, [searchParams]);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      
      if (data.authenticated) {
        setStatus('connected');
      } else {
        setStatus('not_connected');
      }
    } catch (err) {
      setStatus('not_connected');
    }
  };

  const handleConnect = () => {
    // Redirect to Google OAuth
    window.location.href = '/api/auth/google';
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
        <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
        <p className="mt-4 text-gray-600">Checking connection...</p>
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl">
            <Check className="w-12 h-12 text-white" strokeWidth={3} />
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">Connected! 🎉</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Google Calendar is now connected. You're all set!
          </p>

          <Button
            onClick={() => window.location.href = '/'}
            className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white shadow-lg"
          >
            Go to Calendar App
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-400 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-4">Connection Failed</h1>
          <p className="text-gray-600 mb-2">Something went wrong:</p>
          <p className="text-rose-500 mb-8 font-medium">{error}</p>

          <Button
            onClick={handleConnect}
            className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white shadow-lg"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Not connected - show setup
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-rose-400 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg">
          <Calendar className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">Setup Required</h1>
        <p className="text-gray-600 mb-8 text-lg">
          Connect your Google Calendar to get started. This only needs to be done once.
        </p>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6 text-left">
          <h2 className="font-semibold text-gray-800 mb-3">What happens next:</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-orange-400 font-bold">1.</span>
              <span>You'll sign in with your Google account</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 font-bold">2.</span>
              <span>Grant permission to add calendar events</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 font-bold">3.</span>
              <span>You'll be redirected back here</span>
            </li>
          </ul>
        </div>

        <Button
          onClick={handleConnect}
          className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Connect with Google
        </Button>

        <p className="text-gray-400 mt-6 text-sm">
          This is a one-time setup. Your wife won't need to do this.
        </p>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
      </div>
    }>
      <SetupContent />
    </Suspense>
  );
}
