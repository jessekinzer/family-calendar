'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Check, Loader2, AlertCircle, Copy, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SetupContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');
    const tokenParam = searchParams.get('token');

    if (tokenParam) {
      setToken(tokenParam);
      setStatus('show_token');
      return;
    }

    if (success === 'true') {
      setStatus('connected');
      return;
    }

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setStatus('error');
      return;
    }

    checkAuthStatus();
  }, [searchParams]);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setStatus(data.authenticated ? 'connected' : 'not_connected');
    } catch (err) {
      setStatus('not_connected');
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/auth/google';
  };

  const copyToken = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        <p className="mt-3 text-sm text-gray-500">Checking connection...</p>
      </div>
    );
  }

  // Show token for user to copy
  if (status === 'show_token') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-full mx-auto mb-5 flex items-center justify-center">
            <Check className="w-6 h-6 text-emerald-600" strokeWidth={2.5} />
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-2">Almost done!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Copy this token and add it to your Vercel environment variables.
          </p>

          {/* Token display */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-2">GOOGLE_REFRESH_TOKEN</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-gray-700 break-all text-left bg-white p-2 rounded border">
                {token}
              </code>
              <Button
                onClick={copyToken}
                variant="outline"
                size="sm"
                className="flex-shrink-0"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left border border-blue-100">
            <p className="text-xs font-medium text-blue-800 mb-2">Next steps:</p>
            <ol className="text-sm text-blue-700 space-y-1.5 list-decimal list-inside">
              <li>Go to Vercel → Project Settings → Environment Variables</li>
              <li>Add variable: <code className="bg-blue-100 px-1 rounded">GOOGLE_REFRESH_TOKEN</code></li>
              <li>Paste the token above as the value</li>
              <li>Redeploy your app</li>
            </ol>
          </div>

          <Button
            onClick={() => window.location.href = '/'}
            className="w-full h-11 text-base font-medium rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            Done - Go to app
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-full mx-auto mb-5 flex items-center justify-center">
            <Check className="w-6 h-6 text-emerald-600" strokeWidth={2.5} />
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-2">Connected</h1>
          <p className="text-gray-500 text-sm mb-8">
            Google Calendar is ready. Your wife can now add events.
          </p>

          <Button
            onClick={() => window.location.href = '/'}
            className="w-full h-11 text-base font-medium rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            Open calendar
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full mx-auto mb-5 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>

          <h1 className="text-xl font-semibold text-gray-900 mb-2">Connection failed</h1>
          <p className="text-gray-500 text-sm mb-2">Something went wrong:</p>
          <p className="text-red-500 text-sm mb-8">{error}</p>

          <Button
            onClick={handleConnect}
            className="w-full h-11 text-base font-medium rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // Not connected - show setup
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-5 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-gray-600" />
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-2">Connect Google Calendar</h1>
        <p className="text-gray-500 text-sm mb-8">
          One-time setup to enable adding events.
        </p>

        <Button
          onClick={handleConnect}
          className="w-full h-11 text-base font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Connect with Google
        </Button>

        <p className="text-xs text-gray-400 mt-6">
          You'll get a token to add to your Vercel settings.
        </p>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    }>
      <SetupContent />
    </Suspense>
  );
}
