import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from './utils/prisma';
import authRoutes from './routes/auth';
import employeeRoutes from './routes/employees';
import templateRoutes from './routes/templates';
import birthdayRoutes from './routes/birthdays';
import emailRoutes from './routes/emails';
import dashboardRoutes from './routes/dashboard';
import settingsRoutes from './routes/settings';
import developerRoutes from './routes/developer';
import { startScheduler } from './jobs/birthday.job';
import { addLog } from './services/developer-metrics';

const app = express();

const clientOrigin = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173');
app.use(helmet());
app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.TRUST_PROXY_HOPS) {
  const proxyHops = Number(process.env.TRUST_PROXY_HOPS);
  if (!Number.isInteger(proxyHops) || proxyHops < 1) throw new Error('TRUST_PROXY_HOPS must be a positive integer');
  app.set('trust proxy', proxyHops);
}

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/birthdays', birthdayRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/developer', developerRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const jwtSecret = process.env.JWT_SECRET;
const isStrongSecret = (secret?: string) => Boolean(secret && secret.length >= 32 && new Set(secret).size >= 12 && !/(change-this|replace-me|placeholder|example)/i.test(secret));
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
  if (missing.length) throw new Error(`Missing production environment variables: ${missing.join(', ')}`);
  try {
    const clientUrl = new URL(process.env.CLIENT_URL!);
    if (clientUrl.protocol !== 'https:' || clientUrl.origin !== process.env.CLIENT_URL) throw new Error();
  } catch {
    throw new Error('CLIENT_URL must be an HTTPS origin without a path or trailing slash');
  }
}

const checkTime = process.env.BIRTHDAY_CHECK_TIME || '08:00';
const checkTimeParts = checkTime.match(/^(\d{1,2}):(\d{2})$/);
if (!checkTimeParts || Number(checkTimeParts[1]) > 23 || Number(checkTimeParts[2]) > 59) {
  throw new Error('BIRTHDAY_CHECK_TIME must be a valid 24-hour HH:MM time');
}

const PORT = Number(process.env.PORT || 5001);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw new Error('PORT must be a valid TCP port');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

startScheduler();

// Capture console logs for developer dashboard
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args: any[]) => {
  addLog('info', args.map(String).join(' '));
  originalLog.apply(console, args);
};

console.error = (...args: any[]) => {
  addLog('error', args.map(String).join(' '));
  originalError.apply(console, args);
};

console.warn = (...args: any[]) => {
  addLog('warn', args.map(String).join(' '));
  originalWarn.apply(console, args);
};

export default app;
