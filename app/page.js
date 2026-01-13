'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar, Check, ChevronDown, ChevronUp, Loader2, RefreshCw, ExternalLink, Clock } from 'lucide-react';
import { format, parse } from 'date-fns';

// PIN Entry Screen - Notion Style
function PinScreen({ onSuccess }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handlePinInput = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError('');

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 3 && newPin.every(d => d !== '')) {
      verifyPin(newPin.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyPin = async (pinCode) => {
    setLoading(true);
    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinCode }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('family_calendar_auth', JSON.stringify({
          authenticated: true,
          expires: Date.now() + (7 * 24 * 60 * 60 * 1000)
        }));
        onSuccess();
      } else {
        setError('Incorrect PIN');
        setPin(['', '', '', '']);
        inputRefs.current[0]?.focus();
        if (navigator.vibrate) navigator.vibrate(100);
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 safe-area-inset">
      <div className="w-full max-w-xs text-center">
        <div className="mb-10">
          <div className="w-14 h-14 bg-gray-100 rounded-xl mx-auto mb-5 flex items-center justify-center">
            <Calendar className="w-7 h-7 text-gray-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Family Calendar</h1>
          <p className="text-gray-500">Enter your PIN</p>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={pin[index]}
              onChange={(e) => handlePinInput(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-14 h-16 text-2xl font-semibold text-center rounded-lg border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              style={{ WebkitAppearance: 'none', fontSize: '24px' }}
              disabled={loading}
            />
          ))}
        </div>

        {error && (
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Verifying...</span>
          </div>
        )}
      </div>
    </div>
  );
}

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

// Event Form - Notion Style
function EventForm({ onSuccess, onError, onNeedsReauth }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAllDay, setIsAllDay] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedDate = parse(date, 'yyyy-MM-dd', new Date());
  const dayOfWeek = format(selectedDate, 'EEEE');
  const formattedDate = format(selectedDate, 'MMMM d, yyyy');

  const handleStartTimeChange = (newStartTime) => {
    setStartTime(newStartTime);
    const [hours, minutes] = newStartTime.split(':').map(Number);
    const endHours = (hours + 1) % 24;
    setEndTime(`${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
  };

  const formatTime12h = (time24) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/add-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          date,
          startTime: isAllDay ? null : startTime,
          endTime: isAllDay ? null : endTime,
          notes: notes.trim(),
          isAllDay,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess({
          title: title.trim(),
          date,
          dateFormatted: `${dayOfWeek}, ${formattedDate}`,
          isAllDay,
          startTimeFormatted: formatTime12h(startTime),
          endTimeFormatted: formatTime12h(endTime),
          notes: notes.trim(),
          htmlLink: data.event?.htmlLink,
        });
        setTitle('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setIsAllDay(false);
        setStartTime('09:00');
        setEndTime('10:00');
        setNotes('');
        setShowNotes(false);
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

  return (
    <div className="min-h-screen bg-white safe-area-inset">
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Header */}
        <div className="pt-8 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-gray-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">New event</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <input
              type="text"
              placeholder="Event name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-12 px-3 text-base text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              style={{ fontSize: '16px' }}
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Date</label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-12 px-3 text-base text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                style={{ fontSize: '16px' }}
                required
              />
            </div>
            {date && (
              <p className="text-sm text-blue-600 mt-1.5">{dayOfWeek}, {formattedDate}</p>
            )}
          </div>

          {/* Time Section */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Time</label>
            
            {!isAllDay && (
              <div className="grid grid-cols-2 gap-3">
                {/* Start Time */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Starts</p>
                  <label className="relative block cursor-pointer">
                    <div className="flex items-center justify-between h-12 px-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-base font-medium text-gray-900">{formatTime12h(startTime)}</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </div>

                {/* End Time */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Ends</p>
                  <label className="relative block cursor-pointer">
                    <div className="flex items-center justify-between h-12 px-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-base font-medium text-gray-900">{formatTime12h(endTime)}</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* All Day Toggle */}
            <div className="flex items-center justify-between h-12 px-3 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-base text-gray-700">All day</span>
              <Switch
                checked={isAllDay}
                onCheckedChange={setIsAllDay}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showNotes ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {showNotes ? 'Hide notes' : 'Add notes'}
            </button>

            {showNotes && (
              <textarea
                placeholder="Add details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full mt-2 px-3 py-3 text-base text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none transition-all"
                rows={3}
                style={{ fontSize: '16px' }}
              />
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading || !title.trim()}
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
    const auth = localStorage.getItem('family_calendar_auth');
    if (auth) {
      try {
        const { authenticated, expires } = JSON.parse(auth);
        if (authenticated && expires > Date.now()) {
          setScreen('form');
          return;
        }
      } catch (e) {}
    }
    setScreen('pin');
  }, []);

  const handlePinSuccess = () => setScreen('form');
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

  if (screen === 'pin') return <PinScreen onSuccess={handlePinSuccess} />;
  if (screen === 'success') return <SuccessScreen eventData={eventData} onAddAnother={handleReturnToForm} />;
  if (screen === 'reconnect') return <ReconnectScreen onReconnect={handleReconnect} />;
  if (screen === 'error') return <ErrorScreen message={errorMessage} onRetry={handleReturnToForm} />;

  return <EventForm onSuccess={handleEventSuccess} onError={handleError} onNeedsReauth={handleNeedsReauth} />;
}
