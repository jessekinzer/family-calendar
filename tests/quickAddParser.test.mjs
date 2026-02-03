import assert from 'node:assert/strict';
import { parseQuickAdd } from '../lib/quickAddParser.js';

const referenceDate = new Date('2025-02-03T09:00:00Z');

const parsed = parseQuickAdd('Dentist Tuesday at 9am', referenceDate);
assert.equal(parsed.title, 'Dentist');
assert.equal(parsed.startTime, '09:00');
assert.equal(parsed.isAllDay, false);
assert.ok(parsed.date, 'Expected a date to be parsed');

const allDayParsed = parseQuickAdd('Birthday party Sunday', referenceDate);
assert.equal(allDayParsed.isAllDay, true);
assert.ok(allDayParsed.date, 'Expected a date to be parsed');

console.log('quickAddParser tests passed');
