export interface SchedulerState {
  isRunning: boolean;
  nextRun: string | null;
  lastRun: string | null;
  lastRunSuccess: boolean | null;
  lastRunMessage: string | null;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export const schedulerState: SchedulerState = {
  isRunning: false,
  nextRun: null,
  lastRun: null,
  lastRunSuccess: null,
  lastRunMessage: null,
};

export const setSchedulerRunning = (running: boolean) => {
  schedulerState.isRunning = running;
};

export const appLogs: LogEntry[] = [];
const MAX_LOGS = 100;

export const addLog = (level: LogEntry['level'], message: string) => {
  const timestamp = new Date().toISOString();
  const safeMessage = message
    .replace(/DATABASE_URL[^\s]*/gi, '[REDACTED]')
    .replace(/password[^\s]*/gi, '[REDACTED]')
    .replace(/secret[^\s]*/gi, '[REDACTED]')
    .replace(/token[^\s]*/gi, '[REDACTED]')
    .replace(/key[^\s]*/gi, '[REDACTED]');

  appLogs.push({ timestamp, level, message: safeMessage });
  if (appLogs.length > MAX_LOGS) {
    appLogs.shift();
  }
};

export const updateSchedulerState = (success: boolean, message: string | null) => {
  schedulerState.lastRun = new Date().toISOString();
  schedulerState.lastRunSuccess = success;
  schedulerState.lastRunMessage = message;
};
