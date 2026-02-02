import { MongoClient } from 'mongodb';
import { addDays, format, parseISO } from 'date-fns';

const uri = process.env.MONGO_URL;
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.DB_NAME || 'family_calendar');
  
  cachedClient = client;
  cachedDb = db;
  
  return { client, db };
}

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

export async function getStoredRefreshToken() {
  const { db } = await connectToDatabase();
  const config = await db.collection('config').findOne({ key: 'google_auth' });
  return config?.refreshToken || null;
}

export async function storeRefreshToken(refreshToken) {
  const { db } = await connectToDatabase();
  await db.collection('config').updateOne(
    { key: 'google_auth' },
    { 
      $set: { 
        refreshToken,
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
}

export async function clearRefreshToken() {
  const { db } = await connectToDatabase();
  await db.collection('config').deleteOne({ key: 'google_auth' });
}

async function getAccessToken() {
  const refreshToken = await getStoredRefreshToken();
  
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
    // Token is invalid or expired - clear it and throw specific error
    if (data.error === 'invalid_grant') {
      await clearRefreshToken();
      const error = new Error('TOKEN_EXPIRED');
      error.code = 'TOKEN_EXPIRED';
      throw error;
    }
    throw new Error(data.error_description || data.error);
  }

  return data.access_token;
}

export async function createCalendarEvent({ title, date, startTime, endTime, notes, isAllDay }) {
  const accessToken = await getAccessToken();
  const timeZone = process.env.TIMEZONE || 'America/Chicago';
  const calendarId = process.env.CALENDAR_ID || 'primary';

  let event;

  if (isAllDay) {
    const startDate = parseISO(date);
    const endDate = format(addDays(startDate, 1), 'yyyy-MM-dd');
    event = {
      summary: title,
      description: notes || '',
      start: {
        date: date,
        timeZone,
      },
      end: {
        date: endDate,
        timeZone,
      },
    };
  } else {
    event = {
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

export { connectToDatabase };
