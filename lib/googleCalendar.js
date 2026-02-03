// Google Calendar helper - NO DATABASE VERSION
// Uses environment variable for refresh token

/**
 * Build the Google OAuth URL for the setup flow.
 * @returns {string}
 */
export function getOAuthUrl() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.email',
  ].join(' ');

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');

  return url.toString();
}

/**
 * Exchange OAuth authorization code for access/refresh tokens.
 * @param {string} code
 * @returns {Promise<Object>}
 */
export async function exchangeCodeForTokens(code) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  return data;
}

export function getStoredRefreshToken() {
  // Simply return from environment variable - no database!
  return process.env.GOOGLE_REFRESH_TOKEN || null;
}

/**
 * Exchange refresh token for a short-lived access token.
 * @returns {Promise<string>}
 */
async function getAccessToken() {
  const refreshToken = getStoredRefreshToken();
  
  if (!refreshToken) {
    const error = new Error('NO_REFRESH_TOKEN');
    error.code = 'NO_REFRESH_TOKEN';
    throw error;
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    if (data.error === 'invalid_grant') {
      const error = new Error('TOKEN_EXPIRED');
      error.code = 'TOKEN_EXPIRED';
      throw error;
    }
    throw new Error(data.error_description || data.error);
  }

  return data.access_token;
}

const buildAllDayEvent = (title, date, notes, timeZone) => {
  const startDate = parseISO(date);
  const endDate = format(addDays(startDate, 1), 'yyyy-MM-dd');
  return {
    summary: title,
    description: notes || '',
    start: {
      date,
      timeZone,
    },
    end: {
      date: endDate,
      timeZone,
    },
  };
};

const buildTimedEvent = (title, date, startTime, endTime, notes, timeZone) => {
  return {
    summary: title,
    description: notes || '',
    start: {
      dateTime: `${date}T${startTime}:00`,
      timeZone,
    },
    end: {
      dateTime: `${date}T${endTime}:00`,
      timeZone,
    },
  };
};

/**
 * Create a Google Calendar event with either timed or all-day values.
 * @param {Object} payload
 * @param {string} payload.title
 * @param {string} payload.date
 * @param {string|null} payload.startTime
 * @param {string|null} payload.endTime
 * @param {string} payload.notes
 * @param {boolean} payload.isAllDay
 * @returns {Promise<Object>}
 */
export async function createCalendarEvent({ title, date, startTime, endTime, notes, isAllDay }) {
  const accessToken = await getAccessToken();
  const timeZone = process.env.TIMEZONE || 'America/Chicago';
  const calendarId = process.env.CALENDAR_ID || 'primary';

  let event;

  if (isAllDay) {
    event = {
      summary: title,
      description: notes || '',
      start: { date, timeZone },
      end: { date, timeZone },
    };
  } else {
    event = {
      summary: title,
      description: notes || '',
      start: { dateTime: `${date}T${startTime}:00`, timeZone },
      end: { dateTime: `${date}T${endTime}:00`, timeZone },
    };
  }

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  const data = await response.json();
  
  if (data.error) {
    console.error('Google Calendar API error:', data.error);
    throw new Error(data.error.message || 'Failed to create event');
  }

  return {
    id: data.id,
    htmlLink: data.htmlLink,
    summary: data.summary,
    start: data.start,
    end: data.end,
  };
}
