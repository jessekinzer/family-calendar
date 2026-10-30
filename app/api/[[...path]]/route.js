import { NextResponse } from 'next/server';
import { getOAuthUrl, exchangeCodeForTokens, getStoredRefreshToken, createCalendarEvent } from '@/lib/googleCalendar';
import { sendSlackNotification } from '@/lib/slackNotification';
import { checkPasscode, isPasscodeConfigured, isUnlocked, setSessionCookie } from '@/lib/passcode';

const WRONG_PASSCODE_DELAY_MS = 1000;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const locked = () => NextResponse.json(
  { success: false, needsUnlock: true, message: 'Enter the family passcode first.' },
  { status: 401 }
);

export async function GET(request, { params }) {
  const path = params?.path?.join('/') || '';

  try {
    // Health check
    if (path === 'health') {
      return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // Whether this browser has entered the passcode
    if (path === 'session') {
      return NextResponse.json({ unlocked: isUnlocked(request), configured: isPasscodeConfigured() });
    }

    // Everything below needs the passcode
    if (!isUnlocked(request)) {
      if (path.startsWith('auth/google')) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return locked();
    }

    // Check if refresh token exists in env
    if (path === 'auth/status') {
      const token = getStoredRefreshToken();
      return NextResponse.json({
        authenticated: !!token,
        message: token ? 'Google Calendar is connected!' : 'Setup required'
      });
    }

    // Generate Google OAuth URL
    if (path === 'auth/google') {
      const authUrl = getOAuthUrl();
      return NextResponse.redirect(authUrl);
    }

    // Google OAuth callback - NOW SHOWS TOKEN TO COPY
    if (path === 'auth/google/callback') {
      const url = new URL(request.url);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      const baseUrl = new URL(request.url).origin;

      if (error) {
        return NextResponse.redirect(`${baseUrl}/setup?error=${encodeURIComponent(error)}`);
      }

      if (!code) {
        return NextResponse.redirect(`${baseUrl}/setup?error=no_code`);
      }

      try {
        const tokens = await exchangeCodeForTokens(code);

        if (tokens.refresh_token) {
          // Redirect to setup page with the token to display
          return NextResponse.redirect(`${baseUrl}/setup?token=${encodeURIComponent(tokens.refresh_token)}`);
        } else {
          return NextResponse.redirect(`${baseUrl}/setup?error=no_refresh_token`);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        return NextResponse.redirect(`${baseUrl}/setup?error=${encodeURIComponent(err.message)}`);
      }
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  const path = params?.path?.join('/') || '';

  try {
    // Check the family passcode and remember this browser
    if (path === 'unlock') {
      if (!isPasscodeConfigured()) {
        return NextResponse.json(
          { success: false, message: 'No passcode is set up yet. Add APP_PASSCODE in Vercel and redeploy.' },
          { status: 503 }
        );
      }

      const { passcode } = await request.json();

      if (!checkPasscode(passcode)) {
        // Slows down guessing
        await wait(WRONG_PASSCODE_DELAY_MS);
        return NextResponse.json(
          { success: false, message: "That passcode didn't work." },
          { status: 401 }
        );
      }

      return setSessionCookie(NextResponse.json({ success: true }));
    }

    // Add calendar event
    if (path === 'add-event') {
      if (!isUnlocked(request)) return locked();

      const body = await request.json();
      const { title, date, startTime, endTime, notes, isAllDay } = body;

      if (!title || !date) {
        return NextResponse.json(
          { success: false, message: 'Title and date are required' },
          { status: 400 }
        );
      }

      if (!isAllDay && (!startTime || !endTime)) {
        return NextResponse.json(
          { success: false, message: 'Start and end times are required for timed events' },
          { status: 400 }
        );
      }

      try {
        const result = await createCalendarEvent({
          title,
          date,
          startTime,
          endTime,
          notes,
          isAllDay,
        });

        // Send Slack notification (non-blocking - don't let notification failure stop event creation)
        sendSlackNotification({
          title,
          date,
          startTime,
          endTime,
          notes,
          isAllDay,
        }, result).catch(err => {
          console.error('Slack notification error (non-blocking):', err);
        });

        return NextResponse.json({
          success: true,
          message: 'Event added successfully!',
          event: result,
        });
      } catch (err) {
        console.error('Calendar error:', err);

        if (err.code === 'NO_REFRESH_TOKEN' || err.code === 'TOKEN_EXPIRED') {
          return NextResponse.json(
            {
              success: false,
              message: 'Google Calendar connection expired. Please reconnect.',
              needsReauth: true
            },
            { status: 401 }
          );
        }

        return NextResponse.json(
          { success: false, message: `Could not add event. Please try again. ${err}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
