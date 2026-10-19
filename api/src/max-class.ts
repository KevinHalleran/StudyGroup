export const MAX_CLASSES_PER_YEAR = 52;

export interface MaxClass {
  year: number;
  class: number;
  ordinal: number;
  label: string;
}

export function toOrdinal(year: number, classNumber: number): number {
  return (year - 1) * MAX_CLASSES_PER_YEAR + classNumber;
}

export function formatMaxClass(year: number, classNumber: number): string {
  return `Year ${year}, Class ${classNumber}`;
}

const MAX_CLASS_PATTERN = /^year\s+(\d+)\s*,\s*class\s+(\d+)$/i;

export function parseMaxClass(value: string): MaxClass {
  const match = MAX_CLASS_PATTERN.exec((value ?? '').trim());
  const year = match ? Number(match[1]) : NaN;
  const classNumber = match ? Number(match[2]) : NaN;

  if (!match || year < 1 || classNumber < 1 || classNumber > MAX_CLASSES_PER_YEAR) {
    throw new Error(`Invalid max class: ${JSON.stringify(value)}. Expected "Year N, Class M" with M from 1 to ${MAX_CLASSES_PER_YEAR}.`);
  }

  return {
    year,
    class: classNumber,
    ordinal: toOrdinal(year, classNumber),
    label: formatMaxClass(year, classNumber)
  };
}

export function computeFloor(attendees: MaxClass[]): MaxClass {
  if (attendees.length === 0) {
    throw new Error('No attendees: cannot compute a floor for an empty roster');
  }
  return attendees.reduce((lowest, current) => (current.ordinal < lowest.ordinal ? current : lowest));
}
