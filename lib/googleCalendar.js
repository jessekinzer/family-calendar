import { google } from 'googleapis';
import { MongoClient } from 'mongodb';

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

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
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

export async function getCalendarClient() {
  const refreshToken = await getStoredRefreshToken();
  
  if (!refreshToken) {
    throw new Error('NO_REFRESH_TOKEN');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function createCalendarEvent({ title, date, startTime, endTime, notes, isAllDay }) {
  const calendar = await getCalendarClient();
  const timeZone = process.env.TIMEZONE || 'America/Chicago';
  const calendarId = process.env.CALENDAR_ID || 'primary';

  let event;

  if (isAllDay) {
    // All-day event uses date only (no time)
    event = {
      summary: title,
      description: notes || '',
      start: {
        date: date, // Format: YYYY-MM-DD
        timeZone,
      },
      end: {
        date: date, // Same day for single-day all-day event
        timeZone,
      },
    };
  } else {
    // Timed event
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

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return {
    id: response.data.id,
    htmlLink: response.data.htmlLink,
    summary: response.data.summary,
  };
}

export { connectToDatabase };
