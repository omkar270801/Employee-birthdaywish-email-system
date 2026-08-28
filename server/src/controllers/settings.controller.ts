import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export const getDatabaseStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      totalEmailLogs,
      sentEmails,
      failedEmails,
      totalTemplates,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { isActive: true } }),
      prisma.employee.count({ where: { isActive: false } }),
      prisma.emailLog.count(),
      prisma.emailLog.count({ where: { status: 'SENT' } }),
      prisma.emailLog.count({ where: { status: 'FAILED' } }),
      prisma.emailTemplate.count(),
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        totalEmailLogs,
        sentEmails,
        failedEmails,
        totalTemplates,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cleanupDatabase = async (req: AuthRequest, res: Response) => {
  try {
    const { type, olderThanDays } = req.body;

    if (!type || !olderThanDays) {
      return res.status(400).json({ success: false, message: 'Type and olderThanDays are required' });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let deletedCount = 0;

    if (type === 'email_logs') {
      const result = await prisma.emailLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          status: 'FAILED',
        },
      });
      deletedCount = result.count;
    } else if (type === 'inactive_employees') {
      const result = await prisma.employee.deleteMany({
        where: {
          isActive: false,
          updatedAt: { lt: cutoffDate },
        },
      });
      deletedCount = result.count;
    } else if (type === 'all_logs') {
      const result = await prisma.emailLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });
      deletedCount = result.count;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid cleanup type' });
    }

    res.json({
      success: true,
      message: `Cleanup completed. ${deletedCount} records deleted.`,
      deletedCount,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
