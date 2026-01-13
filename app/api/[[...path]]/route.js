import { NextResponse } from 'next/server';
import { getOAuthUrl, exchangeCodeForTokens, storeRefreshToken, getStoredRefreshToken, createCalendarEvent, clearRefreshToken } from '@/lib/googleCalendar';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Route handler
export async function GET(request, { params }) {
  const path = params?.path?.join('/') || '';
  
  try {
    // Health check
    if (path === 'health') {
      return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() }, { headers: corsHeaders });
    }

    // Check if refresh token exists
    if (path === 'auth/status') {
      const token = await getStoredRefreshToken();
      return NextResponse.json({ 
        authenticated: !!token,
        message: token ? 'Google Calendar is connected!' : 'Setup required'
      }, { headers: corsHeaders });
    }

    // Generate Google OAuth URL
    if (path === 'auth/google') {
      const authUrl = getOAuthUrl();
      return NextResponse.redirect(authUrl);
    }

    // Google OAuth callback
    if (path === 'auth/google/callback') {
      const url = new URL(request.url);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/setup?error=${encodeURIComponent(error)}`);
      }

      if (!code) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/setup?error=no_code`);
      }

      try {
        const tokens = await exchangeCodeForTokens(code);

        if (tokens.refresh_token) {
          await storeRefreshToken(tokens.refresh_token);
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/setup?success=true`);
      } catch (err) {
        console.error('OAuth callback error:', err);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/setup?error=${encodeURIComponent(err.message)}`);
      }
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request, { params }) {
  const path = params?.path?.join('/') || '';

  try {
    // Verify PIN
    if (path === 'verify-pin') {
      const body = await request.json();
      const { pin } = body;
      const correctPin = process.env.APP_PIN || '0312';
      
      if (pin === correctPin) {
        return NextResponse.json({ success: true }, { headers: corsHeaders });
      } else {
        return NextResponse.json(
          { success: false, message: 'Incorrect PIN' },
          { status: 401, headers: corsHeaders }
        );
      }
    }

    // Add calendar event
    if (path === 'add-event') {
      const body = await request.json();
      const { title, date, startTime, endTime, notes, isAllDay } = body;

      // Validate required fields
      if (!title || !date) {
        return NextResponse.json(
          { success: false, message: 'Title and date are required' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Validate time fields if not all-day
      if (!isAllDay && (!startTime || !endTime)) {
        return NextResponse.json(
          { success: false, message: 'Start and end times are required for timed events' },
          { status: 400, headers: corsHeaders }
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

        return NextResponse.json({
          success: true,
          message: 'Event added successfully!',
          event: result,
        }, { headers: corsHeaders });
      } catch (err) {
        console.error('Calendar error:', err);
        
        // Handle specific error codes for auto-reconnect
        if (err.code === 'NO_REFRESH_TOKEN' || err.code === 'TOKEN_EXPIRED') {
          return NextResponse.json(
            { 
              success: false, 
              message: 'Google Calendar connection expired. Please reconnect.',
              needsReauth: true 
            },
            { status: 401, headers: corsHeaders }
          );
        }

        return NextResponse.json(
          { success: false, message: 'Could not add event. Please try again.' },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
