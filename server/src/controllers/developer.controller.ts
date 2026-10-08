import { Response } from 'express';
import { verifyDeveloperCredentials, generateDeveloperToken, DeveloperTokenPayload } from '../services/developer-auth.service';
import { authenticateDeveloper } from '../middleware/developer-auth';
import { DeveloperRequest } from '../middleware/developer-auth';
import { prisma } from '../utils/prisma';
import { verifyEmailService } from '../services/email.service';
import { schedulerState, appLogs } from '../services/developer-metrics';

export const developerLoginController = async (req: DeveloperRequest, res: Response) => {
  const { email, password } = req.body;

  const isValid = verifyDeveloperCredentials(email, password);

  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = generateDeveloperToken(email);

  res.json({
    success: true,
    data: {
      token,
      email,
      type: 'developer',
    },
  });
};

export const getDeveloperStatusController = async (req: DeveloperRequest, res: Response) => {
  const startTime = Date.now();

  res.json({
    success: true,
    data: {
      uptime: process.uptime(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    },
  });
};

export const getHealthController = async (req: DeveloperRequest, res: Response) => {
  const startTime = Date.now();

  let databaseStatus: 'connected' | 'disconnected' = 'disconnected';
  let emailStatus: 'connected' | 'disconnected' = 'disconnected';
  let schedulerStatus: 'running' | 'stopped' = 'stopped';

  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseStatus = 'connected';
  } catch (error) {
    databaseStatus = 'disconnected';
  }

  try {
    const emailConnected = await verifyEmailService();
    emailStatus = emailConnected ? 'connected' : 'disconnected';
  } catch (error) {
    emailStatus = 'disconnected';
  }

  schedulerStatus = schedulerState.isRunning ? 'running' : 'stopped';

  const allHealthy = databaseStatus === 'connected' && emailStatus === 'connected' && schedulerStatus === 'running';

  res.json({
    success: true,
    data: {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: { status: 'operational' as const },
        database: { status: databaseStatus },
        email: { status: emailStatus },
        scheduler: { status: schedulerStatus },
      },
    },
  });
};

export const getSchedulerController = async (req: DeveloperRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      ...schedulerState,
      checkTime: process.env.BIRTHDAY_CHECK_TIME || null,
    },
  });
};

export const getStatisticsController = async (req: DeveloperRequest, res: Response) => {
  try {
    const [
      totalEmployees,
      totalEmailsSent,
      totalEmailsFailed,
      totalEmailLogs,
      totalTemplates,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.emailLog.count({ where: { status: 'SENT' } }),
      prisma.emailLog.count({ where: { status: 'FAILED' } }),
      prisma.emailLog.count(),
      prisma.emailTemplate.count(),
    ]);

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [todaySent, todayFailed] = await Promise.all([
      prisma.emailLog.count({
        where: {
          status: 'SENT',
          createdAt: { gte: todayStart, lt: tomorrowStart },
        },
      }),
      prisma.emailLog.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: todayStart, lt: tomorrowStart },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees,
        totalEmailsSent,
        totalEmailsFailed,
        totalEmailLogs,
        totalTemplates,
        todaySent,
        todayFailed,
        pendingEmails: totalEmailLogs - totalEmailsSent - totalEmailsFailed,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLogsController = async (req: DeveloperRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  res.json({
    success: true,
    data: {
      logs: appLogs.slice(-safeLimit).reverse(),
      total: appLogs.length,
    },
  });
};
