import { createHmac, timingSafeEqual } from 'crypto';

// Family passcode gate. Entering APP_PASSCODE once sets a signed cookie that
// lasts a year. The cookie is an HMAC keyed by the passcode itself, so changing
// APP_PASSCODE in Vercel signs every browser out.

export const SESSION_COOKIE = 'fc_session';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const passcode = () => process.env.APP_PASSCODE || '';

const sessionValue = () =>
  createHmac('sha256', passcode()).update('family-calendar-session-v1').digest('hex');

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
};

export function isPasscodeConfigured() {
  return passcode().length > 0;
}

export function checkPasscode(input) {
  return isPasscodeConfigured() && safeEqual(input || '', passcode());
}

/**
 * True when the request carries a valid session cookie.
 * @param {import('next/server').NextRequest} request
 */
export function isUnlocked(request) {
  if (!isPasscodeConfigured()) return false;
  const value = request.cookies.get(SESSION_COOKIE)?.value;
  return Boolean(value) && safeEqual(value, sessionValue());
}

/**
 * Attach the session cookie to a response.
 * @param {import('next/server').NextResponse} response
 */
export function setSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, sessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
  });
  return response;
}
