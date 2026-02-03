'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { parseQuickAdd } from '@/lib/quickAddParser';

// Success Screen - Calm Confirmation
function SuccessScreen({ eventData, onAddAnother, onEdit }) {
  const [countdown, setCountdown] = useState(3);

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f4f2] px-5 safe-area-inset">
      <div className="w-full max-w-sm text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-400 mb-4">Added</p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">{eventData.title}</h1>
        <div className="rounded-2xl bg-white/70 border border-white/70 shadow-sm px-5 py-4 mb-6 text-left">
          <p className="text-sm text-gray-600">{eventData.dateFormatted}</p>
          <p className="text-sm text-gray-600 mt-1">{formatEventTime()}</p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={onEdit}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Edit
          </button>
          <Button
            onClick={onAddAnother}
            className="h-11 px-6 text-base font-medium rounded-full bg-gray-900 hover:bg-gray-800 text-white transition-colors"
          >
            Add another
          </Button>
        </div>
        <p className="text-gray-400 mt-4 text-xs">Resetting in {countdown}s</p>
      </div>
    </div>
  );
}

// Reconnect Screen - Calm Style
function ReconnectScreen({ onReconnect }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f4f2] px-6 safe-area-inset">
      <div className="w-full max-w-sm text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-400 mb-3">Connection</p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Reconnect required</h1>
        <p className="text-gray-600 text-sm mb-8">
          Your Google Calendar connection has expired. This happens occasionally for security.
        </p>

        <Button
          onClick={onReconnect}
          className="w-full h-11 text-base font-medium rounded-full bg-gray-900 hover:bg-gray-800 text-white transition-colors"
        >
          Reconnect Google Calendar
        </Button>
      </div>
    </div>
  );
}

// Error Screen - Calm Style
function ErrorScreen({ message, onRetry }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f4f2] px-6 safe-area-inset">
      <div className="w-full max-w-sm text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-400 mb-3">Oops</p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-600 text-sm mb-8">{message || "Could not add event. Please try again."}</p>

        <Button
          onClick={onRetry}
          className="w-full h-11 text-base font-medium rounded-full bg-gray-900 hover:bg-gray-800 text-white transition-colors"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}

// Quick Add Form - Single Purpose
function QuickAddForm({ onSuccess, onError, onNeedsReauth }) {
  const quotes = [
    `"Life's short, talk fast." - Lorelai`,
    '"Oy with the poodles already!" - Lorelai',
    '"I smell snow." - Lorelai',
    '"Nothing excites me before 11:00." - Rory',
    '"Coffee first, talk later." - Lorelai',
    '"People can live for a hundred years without living a minute." - Logan',
    '"I need caffeine in any form." - Lorelai',
    '"Who cares if I\'m pretty if I fail my finals?" - Rory',
    '"It depends on what I have going on that week." - Rory',
    '"I don\'t like Mondays." - Lorelai',
    '"The room smells like guilt and Chanel No. 5." - Lorelai',
    '"Everything in my life has something to do with coffee." - Lorelai',
    '"In omnia paratus." - Logan',
    '"Every relationship is just a big honking leap of faith." - Lorelai',
    '"You\'ve got wings, baby." - Lorelai',
  ];
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const inputRef = useRef(null);
  const parsed = parseQuickAdd(input);
  const placeholder = useState(() => quotes[Math.floor(Math.random() * quotes.length)])[0];

  const formatTime12h = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const renderHighlightedText = (value) => {
    if (!value) return null;
    const matchText = parsed.matchText;
    if (!matchText) {
      return <span>{value}</span>;
    }

    const lowerValue = value.toLowerCase();
    const lowerMatch = matchText.toLowerCase();
    const matchIndex = lowerValue.indexOf(lowerMatch);
    if (matchIndex === -1) {
      return <span>{value}</span>;
    }

    const before = value.slice(0, matchIndex);
    const highlighted = value.slice(matchIndex, matchIndex + matchText.length);
    const after = value.slice(matchIndex + matchText.length);

    return (
      <>
        {before && <span>{before}</span>}
        <span className="rounded-[6px] bg-[#80BBEC] px-1 py-0.5 text-white">
          {highlighted}
        </span>
        {after && <span>{after}</span>}
      </>
    );
  };

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
    if (window.location.hash !== '#focus') return;
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#focus') return;
    const focusInput = () => inputRef.current?.focus({ preventScroll: true });
    const focusDelay = window.setTimeout(focusInput, 150);
    return () => window.clearTimeout(focusDelay);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    const updateInset = () => {
      const visualHeight = viewport.height + viewport.offsetTop;
      const inset = Math.max(0, window.innerHeight - visualHeight);
      setKeyboardInset(inset);
    };

    updateInset();
    viewport.addEventListener('resize', updateInset);
    viewport.addEventListener('scroll', updateInset);

    return () => {
      viewport.removeEventListener('resize', updateInset);
      viewport.removeEventListener('scroll', updateInset);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--keyboard-inset', `${keyboardInset}px`);
    return () => {
      document.documentElement.style.setProperty('--keyboard-inset', '0px');
    };
  }, [keyboardInset]);

  return (
    <div className="min-h-screen bg-[#f6f4f2] safe-area-inset">
      <div className="w-full px-4 sm:px-6 pb-6 min-h-screen flex flex-col">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6 pt-6 sm:pt-8">
          <div className="flex-1 relative">
            <Button
              type="submit"
              disabled={loading || !parsed.title || !parsed.date}
              aria-label={loading ? 'Adding event' : 'Add event'}
              className="fixed right-6 z-30 h-[60px] w-[60px] text-base font-medium rounded-full bg-gray-950 hover:bg-gray-900 disabled:bg-gray-200 disabled:text-gray-500 text-white transition-colors shadow-sm bottom-[calc(var(--keyboard-inset,0px)+env(keyboard-inset-height,0px)+16px)] sm:absolute sm:right-8 sm:top-6 sm:bottom-auto sm:z-10"
            >
              <Calendar className="h-6 w-6" aria-hidden="true" />
            </Button>
            <textarea
              placeholder={placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              ref={inputRef}
              className={`w-full h-full min-h-[65vh] sm:min-h-[480px] px-5 sm:px-7 py-8 sm:py-10 pr-24 sm:pr-32 text-[2rem] sm:text-[2.5rem] lg:text-[2.75rem] leading-[1.4] font-semibold placeholder:text-[#A5A5A5] placeholder:font-semibold placeholder:text-[2rem] sm:placeholder:text-[2.5rem] lg:placeholder:text-[2.75rem] placeholder:leading-[1.4] bg-[#EBEBEB] border-none rounded-[28px] sm:rounded-[32px] shadow-none focus:bg-[#EBEBEB] focus:ring-0 outline-none transition-all resize-none ${input ? 'text-transparent caret-gray-900' : 'text-gray-900'}`}
              required
              aria-label="Describe your event in plain language"
            />
            {input && (
              <div
                className="pointer-events-none absolute inset-0 px-5 sm:px-7 py-8 sm:py-10 pr-24 sm:pr-28 text-[2rem] sm:text-[2.5rem] lg:text-[2.75rem] leading-[1.4] font-semibold text-gray-900 whitespace-pre-wrap break-words"
              >
                {renderHighlightedText(input)}
              </div>
            )}
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
      <div className="min-h-screen flex items-center justify-center bg-[#f6f4f2]">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (screen === 'success') {
    return (
      <SuccessScreen
        eventData={eventData}
        onAddAnother={handleReturnToForm}
        onEdit={handleReturnToForm}
      />
    );
  }
  if (screen === 'reconnect') return <ReconnectScreen onReconnect={handleReconnect} />;
  if (screen === 'error') return <ErrorScreen message={errorMessage} onRetry={handleReturnToForm} />;

  return <QuickAddForm onSuccess={handleEventSuccess} onError={handleError} onNeedsReauth={handleNeedsReauth} />;
}
