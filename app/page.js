'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar, Check, ChevronDown, ChevronUp, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { format, parse } from 'date-fns';

// PIN Entry Screen Component - iOS Style
function PinScreen({ onSuccess }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handlePinInput = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
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
        // Haptic feedback on iOS
        if (navigator.vibrate) navigator.vibrate(100);
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-amber-50 px-6 safe-area-inset">
      <div className="w-full max-w-xs text-center">
        <div className="mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-rose-400 rounded-[22px] mx-auto mb-5 flex items-center justify-center shadow-lg">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-[28px] font-semibold text-gray-900 mb-2 tracking-tight">Family Calendar</h1>
          <p className="text-[17px] text-gray-500">Enter PIN to continue</p>
        </div>

        <div className="flex justify-center gap-3 mb-8">
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
              className="w-[60px] h-[72px] text-[32px] font-semibold text-center rounded-2xl border-0 bg-white shadow-sm focus:ring-2 focus:ring-orange-400 outline-none transition-all caret-transparent"
              style={{ 
                WebkitAppearance: 'none',
                fontSize: '32px'
              }}
              disabled={loading}
            />
          ))}
        </div>

        {error && (
          <div className="text-rose-500 font-medium text-[15px] mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[15px]">Verifying...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Success Screen Component - iOS Style with Event Details
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
    return `${eventData.startTimeFormatted} - ${eventData.endTimeFormatted}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-teal-50 px-6 safe-area-inset">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full mx-auto flex items-center justify-center shadow-xl">
            <Check className="w-14 h-14 text-white" strokeWidth={3} />
          </div>
        </div>

        <h1 className="text-[28px] font-semibold text-gray-900 mb-6 tracking-tight">Added! 🎉</h1>
        
        {/* Event Details Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 text-left">
          <div className="space-y-4">
            <div>
              <p className="text-[13px] text-gray-500 uppercase tracking-wide mb-1">Event</p>
              <p className="text-[17px] font-semibold text-gray-900">{eventData.title}</p>
            </div>
            <div className="h-px bg-gray-100" />
            <div>
              <p className="text-[13px] text-gray-500 uppercase tracking-wide mb-1">Date</p>
              <p className="text-[17px] text-gray-900">{eventData.dateFormatted}</p>
            </div>
            <div className="h-px bg-gray-100" />
            <div>
              <p className="text-[13px] text-gray-500 uppercase tracking-wide mb-1">Time</p>
              <p className="text-[17px] text-gray-900">{formatEventTime()}</p>
            </div>
            {eventData.notes && (
              <>
                <div className="h-px bg-gray-100" />
                <div>
                  <p className="text-[13px] text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-[15px] text-gray-700">{eventData.notes}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* View in Google Calendar */}
        {eventData.htmlLink && (
          <a
            href={eventData.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-[15px] text-blue-600 font-medium mb-6 active:opacity-70"
          >
            <ExternalLink className="w-4 h-4" />
            View in Google Calendar
          </a>
        )}

        <Button
          onClick={onAddAnother}
          className="w-full h-[54px] text-[17px] font-semibold rounded-2xl bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 active:scale-[0.98] text-white shadow-lg transition-transform"
        >
          Add Another Event
        </Button>

        <p className="text-gray-400 mt-5 text-[13px]">
          Returning in {countdown}s
        </p>
      </div>
    </div>
  );
}

// Reconnect Screen - When Google auth expires
function ReconnectScreen({ onReconnect }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 px-6 safe-area-inset">
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-400 rounded-[22px] mx-auto mb-6 flex items-center justify-center shadow-lg">
          <RefreshCw className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-[24px] font-semibold text-gray-900 mb-3 tracking-tight">Reconnect Required</h1>
        <p className="text-[15px] text-gray-500 mb-8 leading-relaxed">
          Your Google Calendar connection has expired. This happens occasionally for security.
        </p>

        <Button
          onClick={onReconnect}
          className="w-full h-[54px] text-[17px] font-semibold rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white shadow-lg transition-transform"
        >
          Reconnect Google Calendar
        </Button>
      </div>
    </div>
  );
}

// Error Screen Component - iOS Style
function ErrorScreen({ message, onRetry }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-pink-50 px-6 safe-area-inset">
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-400 rounded-[22px] mx-auto mb-6 flex items-center justify-center shadow-lg">
          <span className="text-4xl">😕</span>
        </div>

        <h1 className="text-[24px] font-semibold text-gray-900 mb-3 tracking-tight">Oops!</h1>
        <p className="text-[15px] text-gray-500 mb-8">{message || "Could not add event. Please try again."}</p>

        <Button
          onClick={onRetry}
          className="w-full h-[54px] text-[17px] font-semibold rounded-2xl bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 active:scale-[0.98] text-white shadow-lg transition-transform"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

// Event Form Component - iOS Native Style
function EventForm({ onSuccess, onError, onNeedsReauth }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAllDay, setIsAllDay] = useState(true);
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
        // Reset form
        setTitle('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setIsAllDay(true);
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 safe-area-inset">
      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Header */}
        <div className="text-center pt-8 pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-rose-400 rounded-[18px] mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[24px] font-semibold text-gray-900 tracking-tight">Add Event</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title - iOS Style Input */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <input
              type="text"
              placeholder="What's happening?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-[56px] px-4 text-[17px] text-gray-900 placeholder-gray-400 border-0 focus:ring-0 outline-none"
              style={{ fontSize: '17px' }}
              required
            />
          </div>

          {/* Date - iOS Style */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3">
              <label className="text-[13px] text-gray-500 uppercase tracking-wide">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-[44px] text-[17px] text-gray-900 border-0 focus:ring-0 outline-none bg-transparent"
                style={{ fontSize: '17px' }}
                required
              />
            </div>
            {date && (
              <div className="px-4 pb-3 -mt-1">
                <span className="text-[15px] text-orange-500 font-medium">{dayOfWeek}, {formattedDate}</span>
              </div>
            )}
          </div>

          {/* All Day Toggle - iOS Style */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 h-[56px]">
              <span className="text-[17px] text-gray-900">All day</span>
              <Switch
                checked={isAllDay}
                onCheckedChange={setIsAllDay}
                className="data-[state=checked]:bg-orange-400 scale-110"
              />
            </div>

            {/* Time Pickers - iOS Style */}
            {!isAllDay && (
              <>
                <div className="h-px bg-gray-100 mx-4" />
                <div className="px-4 py-4 space-y-4">
                  <div>
                    <label className="text-[13px] text-gray-500 uppercase tracking-wide block mb-2">Starts</label>
                    <div className="flex items-center justify-between">
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        className="flex-1 h-[44px] text-[17px] text-gray-900 border-0 focus:ring-0 outline-none bg-transparent"
                        style={{ fontSize: '17px' }}
                      />
                      <span className="text-[15px] text-gray-500 ml-4">{formatTime12h(startTime)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[13px] text-gray-500 uppercase tracking-wide block mb-2">Ends</label>
                    <div className="flex items-center justify-between">
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="flex-1 h-[44px] text-[17px] text-gray-900 border-0 focus:ring-0 outline-none bg-transparent"
                        style={{ fontSize: '17px' }}
                      />
                      <span className="text-[15px] text-gray-500 ml-4">{formatTime12h(endTime)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notes - iOS Style Expandable */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="w-full flex items-center justify-between px-4 h-[56px] active:bg-gray-50"
            >
              <span className="text-[17px] text-gray-900">Notes</span>
              {showNotes ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showNotes && (
              <>
                <div className="h-px bg-gray-100 mx-4" />
                <textarea
                  placeholder="Any details?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 text-[17px] text-gray-900 placeholder-gray-400 border-0 focus:ring-0 outline-none resize-none"
                  rows={3}
                  style={{ fontSize: '17px' }}
                />
              </>
            )}
          </div>

          {/* Submit Button - iOS Style */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="w-full h-[56px] text-[17px] font-semibold rounded-2xl bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 active:scale-[0.98] text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-transform"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add to Calendar 📅'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main App Component
export default function FamilyCalendar() {
  const [screen, setScreen] = useState('loading');
  const [authenticated, setAuthenticated] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('family_calendar_auth');
    if (auth) {
      try {
        const { authenticated, expires } = JSON.parse(auth);
        if (authenticated && expires > Date.now()) {
          setAuthenticated(true);
          setScreen('form');
          return;
        }
      } catch (e) {}
    }
    setScreen('pin');
  }, []);

  const handlePinSuccess = () => {
    setAuthenticated(true);
    setScreen('form');
  };

  const handleEventSuccess = (data) => {
    setEventData(data);
    setScreen('success');
  };

  const handleError = (message) => {
    setErrorMessage(message);
    setScreen('error');
  };

  const handleNeedsReauth = () => {
    setScreen('reconnect');
  };

  const handleReconnect = () => {
    window.location.href = '/setup';
  };

  const handleReturnToForm = () => {
    setScreen('form');
    setEventData(null);
    setErrorMessage('');
  };

  if (screen === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-amber-50">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (screen === 'pin') {
    return <PinScreen onSuccess={handlePinSuccess} />;
  }

  if (screen === 'success') {
    return (
      <SuccessScreen
        eventData={eventData}
        onAddAnother={handleReturnToForm}
      />
    );
  }

  if (screen === 'reconnect') {
    return <ReconnectScreen onReconnect={handleReconnect} />;
  }

  if (screen === 'error') {
    return <ErrorScreen message={errorMessage} onRetry={handleReturnToForm} />;
  }

  return <EventForm onSuccess={handleEventSuccess} onError={handleError} onNeedsReauth={handleNeedsReauth} />;
}
