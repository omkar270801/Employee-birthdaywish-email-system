import { birthdayJob } from '../services/birthday.service';
import { updateSchedulerState, setSchedulerRunning, schedulerState } from '../services/developer-metrics';
import { getNextIstRun } from '../utils/timezone';

export const runBirthdayJob = async () => {
  return birthdayJob();
};

export const startScheduler = () => {
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
    const scheduled = getNextIstRun(hours, minutes, now);

    schedulerState.nextRun = scheduled.toISOString();
    setSchedulerRunning(true);

    const delay = scheduled.getTime() - now.getTime();
    console.log(`Next birthday job scheduled at ${scheduled.toISOString()} (UTC)`);

    setTimeout(async () => {
      console.log('Running scheduled birthday job...');
      try {
        const result = await birthdayJob();
        updateSchedulerState(true, result.success ? `Sent: ${result.sent || 0}, Failed: ${result.failed || 0}` : (result.error || 'Job completed with issues'));
      } catch (error) {
        console.error('Scheduled birthday job error:', error);
        updateSchedulerState(false, error instanceof Error ? error.message : 'Unknown error');
      }
      scheduleNextRun();
    }, delay);
  };

  scheduleNextRun();
  console.log(`Birthday job scheduler initialized for ${checkTime}`);
};
