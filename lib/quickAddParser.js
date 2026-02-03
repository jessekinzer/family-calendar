import {
  addDays,
  addMinutes,
  format,
  isBefore,
  isValid,
  parse,
  startOfDay,
} from 'date-fns';

const CLEANUP_PATTERNS = [
  /\b(on|at|from|to|this|next)\b$/i,
  /^[\s,.;:-]+/,
  /[\s,.;:-]+$/,
];

const DATE_FORMATS = [
  'yyyy-MM-dd',
  'MM/dd/yyyy',
  'M/d/yyyy',
  'MM/dd',
  'M/d',
  'MMMM d',
  'MMM d',
  'd MMMM',
  'd MMM',
];

const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const cleanupTitle = (value) => {
  let result = value.trim();
  CLEANUP_PATTERNS.forEach((pattern) => {
    result = result.replace(pattern, '').trim();
  });
  return result;
};

const normalizeWhitespace = (value) => value.replace(/\s{2,}/g, ' ').trim();

const hasExplicitAllDay = (input) => /all\s+day/i.test(input);

/**
 * Parse a time string like "3pm", "15:00", or "3:30 pm" into 24h HH:mm.
 * @param {string} raw
 * @returns {string|null}
 */
const parseTime = (raw) => {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase();
  const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const period = match[3];

  if (period) {
    if (period.toLowerCase() === 'pm' && hours < 12) hours += 12;
    if (period.toLowerCase() === 'am' && hours === 12) hours = 0;
  }

  if (hours > 23 || minutes > 59) return null;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Parse a date token against allowed formats, using the reference date.
 * @param {string} text
 * @param {Date} referenceDate
 * @returns {Date|null}
 */
const parseDateFromMatch = (text, referenceDate) => {
  const now = startOfDay(referenceDate);
  for (const fmt of DATE_FORMATS) {
    const parsed = parse(text, fmt, now);
    if (!isValid(parsed)) continue;
    let candidate = parsed;
    const fmtHasYear = fmt.includes('y');
    if (!fmtHasYear) {
      candidate = parse(`${format(now, 'yyyy')} ${text}`, `yyyy ${fmt}`, now);
      if (isBefore(candidate, now)) {
        candidate = parse(`${format(addDays(now, 365), 'yyyy')} ${text}`, `yyyy ${fmt}`, now);
      }
    }
    if (isValid(candidate)) return candidate;
  }
  return null;
};

/**
 * Resolve the next occurrence of the provided weekday.
 * @param {number} weekdayIndex
 * @param {Date} referenceDate
 * @returns {Date}
 */
const nextWeekday = (weekdayIndex, referenceDate) => {
  const start = startOfDay(referenceDate);
  const currentIndex = start.getDay();
  const delta = (weekdayIndex - currentIndex + 7) % 7 || 7;
  return addDays(start, delta);
};

/**
 * Extract a date from the input string and return the match token.
 * @param {string} input
 * @param {Date} referenceDate
 * @returns {{ date: Date|null, match: RegExp|string|null }}
 */
const extractDate = (input, referenceDate) => {
  const lower = input.toLowerCase();
  if (/\btoday\b/.test(lower) || /\btonight\b/.test(lower)) {
    return { date: startOfDay(referenceDate), match: /\b(today|tonight)\b/i };
  }
  if (/\btomorrow\b/.test(lower)) {
    return { date: addDays(startOfDay(referenceDate), 1), match: /\btomorrow\b/i };
  }

  for (const [index, weekday] of WEEKDAYS.entries()) {
    const regex = new RegExp(`\\b${weekday}\\b`, 'i');
    if (regex.test(lower)) {
      return { date: nextWeekday(index, referenceDate), match: regex };
    }
  }

  const numericDateMatch = input.match(/\b(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/);
  if (numericDateMatch) {
    const parsedDate = parseDateFromMatch(numericDateMatch[1], referenceDate);
    if (parsedDate) {
      return { date: parsedDate, match: numericDateMatch[0] };
    }
  }

  const wordDateMatch = input.match(/\b([A-Za-z]{3,9}\s+\d{1,2}(?:st|nd|rd|th)?)\b/);
  if (wordDateMatch) {
    const cleaned = wordDateMatch[1].replace(/(st|nd|rd|th)$/i, '');
    const parsedDate = parseDateFromMatch(cleaned, referenceDate);
    if (parsedDate) {
      return { date: parsedDate, match: wordDateMatch[0] };
    }
  }

  return { date: null, match: null };
};

/**
 * Extract time range or single time from the input string.
 * @param {string} input
 * @returns {{ start: string|null, end: string|null, match: string|null }}
 */
const extractTimeRange = (input) => {
  const rangeMatch = input.match(
    /\b(?:from\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|–|-)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i,
  );
  if (rangeMatch) {
    const start = parseTime(rangeMatch[1]);
    const end = parseTime(rangeMatch[2]);
    if (start && end) {
      return { start, end, match: rangeMatch[0] };
    }
  }

  const singleMatch = input.match(/\b(?:at\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
  if (singleMatch) {
    const start = parseTime(singleMatch[1]);
    if (start) {
      return { start, end: null, match: singleMatch[0] };
    }
  }

  const twentyFourMatch = input.match(/\b(?:at\s*)?([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (twentyFourMatch) {
    const start = parseTime(`${twentyFourMatch[1]}:${twentyFourMatch[2]}`);
    if (start) {
      return { start, end: null, match: twentyFourMatch[0] };
    }
  }

  return { start: null, end: null, match: null };
};

/**
 * Parse quick-add text into an event payload.
 * @param {string} input
 * @param {Date} [referenceDate]
 * @returns {{ title: string, date: Date|null, startTime: string|null, endTime: string|null, isAllDay: boolean }}
 */
export const parseQuickAdd = (input, referenceDate = new Date()) => {
  const raw = input.trim();
  if (!raw) {
    return {
      title: '',
      date: null,
      startTime: null,
      endTime: null,
      isAllDay: true,
    };
  }

  const { date, match: dateMatch } = extractDate(raw, referenceDate);
  const { start, end, match: timeMatch } = extractTimeRange(raw);
  let title = raw;

  if (dateMatch) {
    title = title.replace(dateMatch, ' ');
  }
  if (timeMatch) {
    title = title.replace(timeMatch, ' ');
  }

  title = normalizeWhitespace(cleanupTitle(title));
  if (!title) {
    title = raw;
  }

  const hasTime = Boolean(start);
  const isAllDay = hasExplicitAllDay(raw) || !hasTime;
  const endTime = start && !end ? format(addMinutes(parse(start, 'HH:mm', referenceDate), 60), 'HH:mm') : end;

  return {
    title: title.trim(),
    date,
    startTime: hasTime ? start : null,
    endTime: hasTime ? endTime : null,
    isAllDay,
  };
};
