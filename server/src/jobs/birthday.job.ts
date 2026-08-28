import { birthdayJob } from '../services/birthday.service';
import { updateSchedulerState, setSchedulerRunning, schedulerState } from '../services/developer-metrics';

export const runBirthdayJob = async () => {
  return birthdayJob();
};

export const startScheduler = () => {
  const checkTime = process.env.BIRTHDAY_CHECK_TIME;
  if (!checkTime) {
    console.log('Birthday job not scheduled (BIRTHDAY_CHECK_TIME not set)');
    return;
  }

  const [hours, minutes] = checkTime.split(':').map(Number);

  const scheduleNextRun = () => {
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);

    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }

    schedulerState.nextRun = scheduled.toISOString();
    setSchedulerRunning(true);

    const delay = scheduled.getTime() - now.getTime();
    console.log(`Next birthday job scheduled at ${scheduled.toISOString()}`);

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
