"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSchedulerState = exports.addLog = exports.appLogs = exports.setSchedulerRunning = exports.schedulerState = void 0;
exports.schedulerState = {
    isRunning: false,
    nextRun: null,
    lastRun: null,
    lastRunSuccess: null,
    lastRunMessage: null,
};
const setSchedulerRunning = (running) => {
    exports.schedulerState.isRunning = running;
};
exports.setSchedulerRunning = setSchedulerRunning;
exports.appLogs = [];
const MAX_LOGS = 100;
const addLog = (level, message) => {
    const timestamp = new Date().toISOString();
    const safeMessage = message
        .replace(/DATABASE_URL[^\s]*/gi, '[REDACTED]')
        .replace(/password[^\s]*/gi, '[REDACTED]')
        .replace(/secret[^\s]*/gi, '[REDACTED]')
        .replace(/token[^\s]*/gi, '[REDACTED]')
        .replace(/key[^\s]*/gi, '[REDACTED]');
    exports.appLogs.push({ timestamp, level, message: safeMessage });
    if (exports.appLogs.length > MAX_LOGS) {
        exports.appLogs.shift();
    }
};
exports.addLog = addLog;
const updateSchedulerState = (success, message) => {
    exports.schedulerState.lastRun = new Date().toISOString();
    exports.schedulerState.lastRunSuccess = success;
    exports.schedulerState.lastRunMessage = message;
};
exports.updateSchedulerState = updateSchedulerState;
