import { addMinutes, format, parse, startOfDay } from 'date-fns';
import * as chrono from 'chrono-node';

const CLEANUP_PATTERNS = [
  /\b(on|at|from|to|this|next)\b$/i,
  /^[\s,.;:-]+/,
  /[\s,.;:-]+$/,
];

const cleanupTitle = (value) => {
  let result = value.trim();
  CLEANUP_PATTERNS.forEach((pattern) => {
    result = result.replace(pattern, '').trim();
  });
  return result;
};

const normalizeWhitespace = (value) => value.replace(/\s{2,}/g, ' ').trim();

const toTimeString = (dateValue, referenceDate) => {
  if (!dateValue) return null;
  return format(dateValue, 'HH:mm');
};

/**
 * Parse quick-add text into an event payload.
 * @param {string} input
 * @param {Date} [referenceDate]
 * @returns {{ title: string, date: Date|null, startTime: string|null, endTime: string|null, isAllDay: boolean, matchText: string|null }}
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
      matchText: null,
    };
  }

  const results = chrono.parse(raw, referenceDate);
  const firstResult = results[0];
  const parsedDate = firstResult ? firstResult.start?.date() : null;
  const startDate = firstResult ? firstResult.start?.date() : null;
  const endDate = firstResult ? firstResult.end?.date() : null;
  const hasTime = firstResult?.start?.isCertain('hour') ?? false;
  const matchText = firstResult?.text ?? null;
  let title = raw;

  if (matchText) {
    title = title.replace(matchText, ' ');
  }

  title = normalizeWhitespace(cleanupTitle(title));
  if (!title) {
    title = raw;
  }

  const isAllDay = !hasTime;
  const startTime = hasTime ? toTimeString(startDate, referenceDate) : null;
  const inferredEndTime = startTime
    ? format(addMinutes(parse(startTime, 'HH:mm', referenceDate), 60), 'HH:mm')
    : null;
  const endTime = endDate ? toTimeString(endDate, referenceDate) : inferredEndTime;

  return {
    title: title.trim(),
    date: parsedDate ? startOfDay(parsedDate) : null,
    startTime,
    endTime: hasTime ? endTime : null,
    isAllDay,
    matchText,
  };
};
