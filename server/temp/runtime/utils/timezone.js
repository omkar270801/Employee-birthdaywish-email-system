"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextIstRun = exports.createUtcDateOnly = exports.getIstDayBounds = exports.getDatePartsInTimeZone = void 0;
const IST_TIME_ZONE = 'Asia/Kolkata';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const getDatePartsInTimeZone = (date, timeZone = IST_TIME_ZONE) => {
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
exports.getDatePartsInTimeZone = getDatePartsInTimeZone;
const getIstDayBounds = (date = new Date()) => {
    const { year, month, day } = (0, exports.getDatePartsInTimeZone)(date);
    const start = new Date(Date.UTC(year, month - 1, day) - IST_OFFSET_MS);
    return {
        start,
        end: new Date(start.getTime() + DAY_MS),
    };
};
exports.getIstDayBounds = getIstDayBounds;
const createUtcDateOnly = (year, month, day) => new Date(Date.UTC(year, month - 1, day, 12));
exports.createUtcDateOnly = createUtcDateOnly;
const getNextIstRun = (hours, minutes, now = new Date()) => {
    const { year, month, day } = (0, exports.getDatePartsInTimeZone)(now);
    let nextRun = Date.UTC(year, month - 1, day, hours, minutes) - IST_OFFSET_MS;
    if (nextRun <= now.getTime()) {
        nextRun += DAY_MS;
    }
    return new Date(nextRun);
};
exports.getNextIstRun = getNextIstRun;
