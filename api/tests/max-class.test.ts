import { describe, expect, it } from 'vitest';
import {
  MAX_CLASSES_PER_YEAR,
  computeFloor,
  parseMaxClass,
  toOrdinal
} from '../src/max-class.js';

describe('parseMaxClass', () => {
  it.each([
    ['Year 1, Class 14', { year: 1, class: 14, ordinal: 14, label: 'Year 1, Class 14' }],
    ['Year 1, Class 1', { year: 1, class: 1, ordinal: 1, label: 'Year 1, Class 1' }],
    ['Year 2, Class 38', { year: 2, class: 38, ordinal: 90, label: 'Year 2, Class 38' }],
    ['Year 3, Class 7', { year: 3, class: 7, ordinal: 111, label: 'Year 3, Class 7' }],
    ['Year 3, Class 52', { year: 3, class: 52, ordinal: 156, label: 'Year 3, Class 52' }]
  ])('parses %s', (value, expected) => {
    expect(parseMaxClass(value)).toEqual(expected);
  });

  it('normalizes case and whitespace', () => {
    const parsed = parseMaxClass('  year 1,class   3 ');
    expect(parsed.label).toBe('Year 1, Class 3');
    expect(parsed.ordinal).toBe(3);
  });

  it.each([
    [''],
    ['   '],
    ['Year 1'],
    ['Class 3'],
    ['Year 0, Class 1'],
    ['Year 1, Class 0'],
    ['Year 1, Class 53'],
    ['Year -1, Class 3'],
    ['Year 1, Class 3.5'],
    ['Year one, Class 3'],
    ['Year 1, Class 3 extra']
  ])('rejects %j', (value) => {
    expect(() => parseMaxClass(value)).toThrow('Invalid max class');
  });
});

describe('toOrdinal', () => {
  it('uses 52 classes per year', () => {
    expect(MAX_CLASSES_PER_YEAR).toBe(52);
    expect(toOrdinal(1, 52)).toBe(52);
    expect(toOrdinal(2, 1)).toBe(53);
  });
});

describe('computeFloor', () => {
  it('returns the least experienced attendee', () => {
    const floor = computeFloor([
      parseMaxClass('Year 3, Class 52'),
      parseMaxClass('Year 1, Class 27'),
      parseMaxClass('Year 2, Class 38')
    ]);

    expect(floor).toEqual(parseMaxClass('Year 1, Class 27'));
  });

  it('rejects an empty roster instead of guessing a floor', () => {
    expect(() => computeFloor([])).toThrow('No attendees');
  });
});
