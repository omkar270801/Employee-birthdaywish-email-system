import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config({ path: '.env' });

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const PORT = process.env.PORT || 5000;

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
