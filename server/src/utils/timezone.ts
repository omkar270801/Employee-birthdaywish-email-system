const IST_TIME_ZONE = 'Asia/Kolkata';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface CalendarDateParts {
  year: number;
  month: number;
  day: number;
}

export const getDatePartsInTimeZone = (date: Date, timeZone = IST_TIME_ZONE): CalendarDateParts => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
};

export const getIstDayBounds = (date = new Date()) => {
  const { year, month, day } = getDatePartsInTimeZone(date);
  const start = new Date(Date.UTC(year, month - 1, day) - IST_OFFSET_MS);

  return {
    start,
    end: new Date(start.getTime() + DAY_MS),
  };
};

export const createUtcDateOnly = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month - 1, day, 12));

export const getNextIstRun = (hours: number, minutes: number, now = new Date()): Date => {
  const { year, month, day } = getDatePartsInTimeZone(now);
  let nextRun = Date.UTC(year, month - 1, day, hours, minutes) - IST_OFFSET_MS;

  if (nextRun <= now.getTime()) {
    nextRun += DAY_MS;
  }

  return new Date(nextRun);
};