'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Check, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react';
import { format, addHours, parse } from 'date-fns';

// PIN Entry Screen Component
function PinScreen({ onSuccess }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinInput = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when complete
    if (value && index === 3 && newPin.every(d => d !== '')) {
      verifyPin(newPin.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
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
        // Remember for 7 days
        localStorage.setItem('family_calendar_auth', JSON.stringify({
          authenticated: true,
          expires: Date.now() + (7 * 24 * 60 * 60 * 1000)
        }));
        onSuccess();
      } else {
        setError('Incorrect PIN. Try again!');
        setPin(['', '', '', '']);
        document.getElementById('pin-0')?.focus();
      }
    } catch (err) {
      setError('Something went wrong. Try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-rose-400 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Family Calendar</h1>
          <p className="text-gray-500 text-lg">Enter your PIN to continue</p>
        </div>

        <div className="flex justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((index) => (
            <input
              key={index}
              id={`pin-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={pin[index]}
              onChange={(e) => handlePinInput(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-16 h-20 text-3xl font-bold text-center rounded-2xl border-2 border-gray-200 bg-white shadow-sm focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all"
              disabled={loading}
            />
          ))}
        </div>

        {error && (
          <div className="text-rose-500 font-medium mb-4 animate-pulse">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Checking...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Success Screen Component
function SuccessScreen({ eventTitle, eventDate, onAddAnother }) {
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 relative">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full mx-auto flex items-center justify-center shadow-xl animate-bounce">
            <Check className="w-12 h-12 text-white" strokeWidth={3} />
          </div>
          {/* Confetti-like decorations */}
          <div className="absolute top-0 left-1/4 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
          <div className="absolute top-8 right-1/4 w-2 h-2 bg-rose-400 rounded-full animate-ping delay-100" />
          <div className="absolute bottom-0 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping delay-200" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">Added! 🎉</h1>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <p className="text-gray-600 mb-2">Successfully added:</p>
          <p className="text-xl font-semibold text-gray-800">{eventTitle}</p>
          <p className="text-orange-500 font-medium mt-1">{eventDate}</p>
        </div>

        <Button
          onClick={onAddAnother}
          className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white shadow-lg"
        >
          Add Another Event
        </Button>

        <p className="text-gray-400 mt-4 text-sm">
          Returning to form in {countdown}s...
        </p>
      </div>
    </div>
  );
}

// Error Screen Component
function ErrorScreen({ message, onRetry }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 p-6">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-400 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg">
          <span className="text-4xl">😕</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">Oops!</h1>
        <p className="text-gray-600 mb-8 text-lg">{message || "Couldn't add that event."}</p>

        <Button
          onClick={onRetry}
          className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white shadow-lg"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

// Event Form Component
function EventForm({ onSuccess, onError }) {
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

  // Update end time when start time changes
  const handleStartTimeChange = (newStartTime) => {
    setStartTime(newStartTime);
    // Set end time to 1 hour after start
    const [hours, minutes] = newStartTime.split(':').map(Number);
    const endHours = (hours + 1) % 24;
    setEndTime(`${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
  };

  // Convert 24h to 12h format for display
  const formatTime12h = (time24) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return;
    }

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
        onSuccess(title, `${dayOfWeek}, ${formattedDate}`);
        // Reset form
        setTitle('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setIsAllDay(true);
        setStartTime('09:00');
        setEndTime('10:00');
        setNotes('');
        setShowNotes(false);
      } else {
        onError(data.message);
      }
    } catch (err) {
      onError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 pb-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center pt-6 pb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-rose-400 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Add Event</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-medium text-gray-700">
              What's happening?
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g., Doctor appointment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-14 text-lg rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 bg-white"
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-base font-medium text-gray-700">
              When?
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-14 text-lg rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 bg-white"
              required
            />
            {date && (
              <p className="text-orange-500 font-medium pl-1">
                {dayOfWeek}, {formattedDate}
              </p>
            )}
          </div>

          {/* All Day Toggle */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-100">
            <div className="flex items-center justify-between">
              <Label htmlFor="allDay" className="text-base font-medium text-gray-700 cursor-pointer">
                All day event
              </Label>
              <Switch
                id="allDay"
                checked={isAllDay}
                onCheckedChange={setIsAllDay}
                className="data-[state=checked]:bg-orange-400"
              />
            </div>

            {/* Time Pickers (shown when not all day) */}
            {!isAllDay && (
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm font-medium text-gray-600">
                    Start time
                  </Label>
                  <div className="relative">
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className="h-12 text-lg rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 bg-white"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                      {formatTime12h(startTime)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-sm font-medium text-gray-600">
                    End time
                  </Label>
                  <div className="relative">
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="h-12 text-lg rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 bg-white"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                      {formatTime12h(endTime)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes (Expandable) */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showNotes ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span className="text-base font-medium">
                {showNotes ? 'Hide notes' : 'Add notes'}
              </span>
            </button>

            {showNotes && (
              <Textarea
                placeholder="Any details?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px] text-lg rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 bg-white resize-none"
              />
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full h-16 text-xl font-semibold rounded-2xl bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                Add to Calendar 📅
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

// Main App Component
export default function FamilyCalendar() {
  const [screen, setScreen] = useState('loading');
  const [authenticated, setAuthenticated] = useState(false);
  const [successData, setSuccessData] = useState({ title: '', date: '' });
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if already authenticated
    const auth = localStorage.getItem('family_calendar_auth');
    if (auth) {
      try {
        const { authenticated, expires } = JSON.parse(auth);
        if (authenticated && expires > Date.now()) {
          setAuthenticated(true);
          setScreen('form');
          return;
        }
      } catch (e) {
        // Invalid auth data
      }
    }
    setScreen('pin');
  }, []);

  const handlePinSuccess = () => {
    setAuthenticated(true);
    setScreen('form');
  };

  const handleEventSuccess = (title, date) => {
    setSuccessData({ title, date });
    setScreen('success');
  };

  const handleError = (message) => {
    setErrorMessage(message);
    setScreen('error');
  };

  const handleReturnToForm = () => {
    setScreen('form');
    setSuccessData({ title: '', date: '' });
    setErrorMessage('');
  };

  if (screen === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (screen === 'pin') {
    return <PinScreen onSuccess={handlePinSuccess} />;
  }

  if (screen === 'success') {
    return (
      <SuccessScreen
        eventTitle={successData.title}
        eventDate={successData.date}
        onAddAnother={handleReturnToForm}
      />
    );
  }

  if (screen === 'error') {
    return <ErrorScreen message={errorMessage} onRetry={handleReturnToForm} />;
  }

  return <EventForm onSuccess={handleEventSuccess} onError={handleError} />;
}
