'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Check, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { parseQuickAdd } from '@/lib/quickAddParser';

// Success Screen - Notion Style
function SuccessScreen({ eventData, onAddAnother }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onAddAnother();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onAddAnother]);

  const formatEventTime = () => {
    if (eventData.isAllDay) return 'All day';
    return `${eventData.startTimeFormatted} – ${eventData.endTimeFormatted}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-5 safe-area-inset">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-full mx-auto flex items-center justify-center">
            <Check className="w-6 h-6 text-emerald-600" strokeWidth={2.5} />
          </div>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-6">Event added</h1>
        
        {/* Event Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-5 text-left border border-gray-100">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Event</p>
              <p className="text-base font-medium text-gray-900">{eventData.title}</p>
            </div>
            <div className="h-px bg-gray-200" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Date</p>
              <p className="text-base text-gray-900">{eventData.dateFormatted}</p>
            </div>
            <div className="h-px bg-gray-200" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Time</p>
              <p className="text-base text-gray-900">{formatEventTime()}</p>
            </div>
            {eventData.notes && (
              <>
                <div className="h-px bg-gray-200" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Notes</p>
                  <p className="text-sm text-gray-700">{eventData.notes}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {eventData.htmlLink && (
          <a
            href={eventData.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mb-5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View in Google Calendar
          </a>
        )}

        <Button
          onClick={onAddAnother}
          className="w-full h-11 text-base font-medium rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
        >
          Add another event
        </Button>

        <p className="text-gray-400 mt-4 text-xs">
          Returning in {countdown}s
        </p>
      </div>
    </div>
  );
}

// Reconnect Screen - Notion Style
function ReconnectScreen({ onReconnect }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 safe-area-inset">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-amber-100 rounded-full mx-auto mb-5 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-amber-600" />
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-2">Reconnect required</h1>
        <p className="text-gray-500 text-sm mb-8">
          Your Google Calendar connection has expired. This happens occasionally for security.
        </p>

        <Button
          onClick={onReconnect}
          className="w-full h-11 text-base font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          Reconnect Google Calendar
        </Button>
      </div>
    </div>
  );
}

// Error Screen - Notion Style
function ErrorScreen({ message, onRetry }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 safe-area-inset">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full mx-auto mb-5 flex items-center justify-center">
          <span className="text-xl">×</span>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-500 text-sm mb-8">{message || "Could not add event. Please try again."}</p>

        <Button
          onClick={onRetry}
          className="w-full h-11 text-base font-medium rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}

// Quick Add Form - Notion Style
function QuickAddForm({ onSuccess, onError, onNeedsReauth }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInstallTip, setShowInstallTip] = useState(false);
  const inputRef = useRef(null);
  const parsed = parseQuickAdd(input);

  const formatTime12h = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formattedDate = parsed.date
    ? format(parsed.date, 'EEEE, MMMM d')
    : 'Add a date (e.g., Sunday or Feb 8)';
  const formattedTime = parsed.isAllDay
    ? 'All day'
    : parsed.startTime
      ? `${formatTime12h(parsed.startTime)}${parsed.endTime ? ` – ${formatTime12h(parsed.endTime)}` : ''}`
      : 'Add a time (optional)';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parsed.title || !parsed.date) return;

    setLoading(true);

    try {
      const res = await fetch('/api/add-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: parsed.title,
          date: format(parsed.date, 'yyyy-MM-dd'),
          startTime: parsed.isAllDay ? null : parsed.startTime,
          endTime: parsed.isAllDay ? null : parsed.endTime,
          notes: '',
          isAllDay: parsed.isAllDay,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess({
          title: parsed.title,
          date: format(parsed.date, 'yyyy-MM-dd'),
          dateFormatted: format(parsed.date, 'EEEE, MMMM d, yyyy'),
          isAllDay: parsed.isAllDay,
          startTimeFormatted: formatTime12h(parsed.startTime),
          endTimeFormatted: formatTime12h(parsed.endTime),
          notes: '',
          htmlLink: data.event?.htmlLink,
        });
        setInput('');
      } else if (data.needsReauth) {
        onNeedsReauth();
      } else {
        onError(data.message);
      }
    } catch (err) {
      onError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const shouldFocus = params.get('focus') === '1';
    if (shouldFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const dismissed = window.localStorage.getItem('family_calendar_install_tip');
    if (dismissed) return;

    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    if (isIos && !isStandalone) {
      setShowInstallTip(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white safe-area-inset">
      <div className="max-w-lg mx-auto px-4 pb-10">
        {showInstallTip && (
          <div className="mt-6 mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">Add to Home Screen</p>
                <p className="text-blue-800">
                  Tap Share in Safari, then “Add to Home Screen” for one‑tap access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.localStorage.setItem('family_calendar_install_tip', '1');
                  setShowInstallTip(false);
                }}
                className="text-blue-700 hover:text-blue-900"
                aria-label="Dismiss add to home screen tip"
              >
                ×
              </button>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="pt-8 pb-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-gray-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">New event</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Quick Add Input */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Quick add</label>
            <textarea
              placeholder="Cousins' birthday party on Sunday at 8pm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              ref={inputRef}
              className="w-full min-h-[140px] px-4 py-4 text-xl font-semibold text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
              style={{ fontSize: '20px', lineHeight: '1.4' }}
              autoFocus
              required
            />
            <p className="text-xs text-gray-400 mt-2">Try: “Dentist next Tuesday at 9am” or “School pickup tomorrow”</p>
          </div>

          {/* Parsed Preview */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Preview</p>
            <p className="text-base font-semibold text-gray-900">
              {parsed.title || 'Add an event description'}
            </p>
            <p className={`text-sm mt-1 ${parsed.date ? 'text-gray-700' : 'text-amber-600'}`}>
              {formattedDate}
            </p>
            <p className={`text-sm ${parsed.isAllDay ? 'text-gray-700' : parsed.startTime ? 'text-gray-700' : 'text-gray-400'}`}>
              {formattedTime}
            </p>
          </div>

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              disabled={loading || !parsed.title || !parsed.date}
              className="w-full h-12 text-base font-medium rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 text-white transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add to calendar'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main App
export default function FamilyCalendar() {
  const [screen, setScreen] = useState('loading');
  const [eventData, setEventData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setScreen('form');
  }, []);

  const handleEventSuccess = (data) => { setEventData(data); setScreen('success'); };
  const handleError = (message) => { setErrorMessage(message); setScreen('error'); };
  const handleNeedsReauth = () => setScreen('reconnect');
  const handleReconnect = () => { window.location.href = '/setup'; };
  const handleReturnToForm = () => { setScreen('form'); setEventData(null); setErrorMessage(''); };

  if (screen === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (screen === 'success') return <SuccessScreen eventData={eventData} onAddAnother={handleReturnToForm} />;
  if (screen === 'reconnect') return <ReconnectScreen onReconnect={handleReconnect} />;
  if (screen === 'error') return <ErrorScreen message={errorMessage} onRetry={handleReturnToForm} />;

  return <QuickAddForm onSuccess={handleEventSuccess} onError={handleError} onNeedsReauth={handleNeedsReauth} />;
}
