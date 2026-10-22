"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const auth_1 = __importDefault(require("./routes/auth"));
const employees_1 = __importDefault(require("./routes/employees"));
const templates_1 = __importDefault(require("./routes/templates"));
const birthdays_1 = __importDefault(require("./routes/birthdays"));
const emails_1 = __importDefault(require("./routes/emails"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const settings_1 = __importDefault(require("./routes/settings"));
const developer_1 = __importDefault(require("./routes/developer"));
const birthday_job_1 = require("./jobs/birthday.job");
const developer_metrics_1 = require("./services/developer-metrics");
const app = (0, express_1.default)();
const clientOrigin = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173');
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: clientOrigin }));
app.use(express_1.default.json({ limit: '100kb' }));
app.use(express_1.default.urlencoded({ extended: true }));
if (process.env.TRUST_PROXY_HOPS) {
    const proxyHops = Number(process.env.TRUST_PROXY_HOPS);
    if (!Number.isInteger(proxyHops) || proxyHops < 1)
        throw new Error('TRUST_PROXY_HOPS must be a positive integer');
    app.set('trust proxy', proxyHops);
}
app.use('/api/auth', auth_1.default);
app.use('/api/employees', employees_1.default);
app.use('/api/templates', templates_1.default);
app.use('/api/birthdays', birthdays_1.default);
app.use('/api/emails', emails_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/developer', developer_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
const jwtSecret = process.env.JWT_SECRET;
const isStrongSecret = (secret) => Boolean(secret && secret.length >= 32 && new Set(secret).size >= 12 && !/(change-this|replace-me|placeholder|example)/i.test(secret));
if (!isStrongSecret(jwtSecret)) {
    throw new Error('JWT_SECRET must be a unique secret of at least 32 characters');
}
const developerConfig = [process.env.DEVELOPER_EMAIL, process.env.DEVELOPER_PASSWORD, process.env.DEVELOPER_JWT_SECRET];
if (developerConfig.some(Boolean) && (!developerConfig.every(Boolean) || !isStrongSecret(process.env.DEVELOPER_JWT_SECRET) || process.env.DEVELOPER_JWT_SECRET === jwtSecret)) {
    throw new Error('Configure a developer email, password, and a distinct strong DEVELOPER_JWT_SECRET together');
}
if (process.env.NODE_ENV === 'production') {
    const required = ['DATABASE_URL', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM', 'CLIENT_URL'];
    const missing = required.filter(name => !process.env[name]);
    if (missing.length)
        throw new Error(`Missing production environment variables: ${missing.join(', ')}`);
    try {
        const clientUrl = new URL(process.env.CLIENT_URL);
        if (clientUrl.protocol !== 'https:' || clientUrl.origin !== process.env.CLIENT_URL)
            throw new Error();
    }
    catch {
        throw new Error('CLIENT_URL must be an HTTPS origin without a path or trailing slash');
    }
}
const checkTime = process.env.BIRTHDAY_CHECK_TIME || '08:00';
const checkTimeParts = checkTime.match(/^(\d{1,2}):(\d{2})$/);
if (!checkTimeParts || Number(checkTimeParts[1]) > 23 || Number(checkTimeParts[2]) > 59) {
    throw new Error('BIRTHDAY_CHECK_TIME must be a valid 24-hour HH:MM time');
}
const PORT = Number(process.env.PORT || 5001);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535)
    throw new Error('PORT must be a valid TCP port');
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0');
app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
});
(0, birthday_job_1.startScheduler)();
// Capture console logs for developer dashboard
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
console.log = (...args) => {
    (0, developer_metrics_1.addLog)('info', args.map(String).join(' '));
    originalLog.apply(console, args);
};
console.error = (...args) => {
    (0, developer_metrics_1.addLog)('error', args.map(String).join(' '));
    originalError.apply(console, args);
};
console.warn = (...args) => {
    (0, developer_metrics_1.addLog)('warn', args.map(String).join(' '));
    originalWarn.apply(console, args);
};
exports.default = app;
