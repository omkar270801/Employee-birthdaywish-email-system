"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduler = exports.runBirthdayJob = void 0;
const birthday_service_1 = require("../services/birthday.service");
const developer_metrics_1 = require("../services/developer-metrics");
const timezone_1 = require("../utils/timezone");
const runBirthdayJob = async () => {
    return (0, birthday_service_1.birthdayJob)();
};
exports.runBirthdayJob = runBirthdayJob;
const startScheduler = () => {
    const checkTime = process.env.BIRTHDAY_CHECK_TIME || '08:00';
    const timeParts = checkTime.match(/^(\d{1,2}):(\d{2})$/);
    const hours = timeParts ? Number(timeParts[1]) : NaN;
    const minutes = timeParts ? Number(timeParts[2]) : NaN;
    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.error(`Invalid BIRTHDAY_CHECK_TIME "${checkTime}". Expected HH:MM.`);
        return;
    }
    const scheduleNextRun = () => {
        const now = new Date();
        const scheduled = (0, timezone_1.getNextIstRun)(hours, minutes, now);
        developer_metrics_1.schedulerState.nextRun = scheduled.toISOString();
        (0, developer_metrics_1.setSchedulerRunning)(true);
        const delay = scheduled.getTime() - now.getTime();
        console.log(`Next birthday job scheduled at ${scheduled.toISOString()} (UTC)`);
        setTimeout(async () => {
            console.log('Running scheduled birthday job...');
            try {
                const result = await (0, birthday_service_1.birthdayJob)();
                (0, developer_metrics_1.updateSchedulerState)(true, result.success ? `Sent: ${result.sent || 0}, Failed: ${result.failed || 0}` : (result.error || 'Job completed with issues'));
            }
            catch (error) {
                console.error('Scheduled birthday job error:', error);
                (0, developer_metrics_1.updateSchedulerState)(false, error instanceof Error ? error.message : 'Unknown error');
            }
            scheduleNextRun();
        }, delay);
    };
    scheduleNextRun();
    console.log(`Birthday job scheduler initialized for ${checkTime}`);
};
exports.startScheduler = startScheduler;
