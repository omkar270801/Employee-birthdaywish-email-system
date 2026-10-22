"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupDatabase = exports.getDatabaseStats = void 0;
const prisma_1 = require("../utils/prisma");
const getDatabaseStats = async (req, res) => {
    try {
        const [totalEmployees, activeEmployees, inactiveEmployees, totalEmailLogs, sentEmails, failedEmails, totalTemplates,] = await Promise.all([
            prisma_1.prisma.employee.count(),
            prisma_1.prisma.employee.count({ where: { isActive: true } }),
            prisma_1.prisma.employee.count({ where: { isActive: false } }),
            prisma_1.prisma.emailLog.count(),
            prisma_1.prisma.emailLog.count({ where: { status: 'SENT' } }),
            prisma_1.prisma.emailLog.count({ where: { status: 'FAILED' } }),
            prisma_1.prisma.emailTemplate.count(),
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDatabaseStats = getDatabaseStats;
const cleanupDatabase = async (req, res) => {
    try {
        const { type, olderThanDays } = req.body;
        if (!['email_logs', 'inactive_employees', 'all_logs'].includes(type) || !Number.isInteger(olderThanDays) || olderThanDays < 1 || olderThanDays > 36500) {
            return res.status(400).json({ success: false, message: 'Provide a valid cleanup type and an olderThanDays value between 1 and 36,500' });
        }
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        let deletedCount = 0;
        if (type === 'email_logs') {
            const result = await prisma_1.prisma.emailLog.deleteMany({
                where: {
                    createdAt: { lt: cutoffDate },
                    status: 'FAILED',
                },
            });
            deletedCount = result.count;
        }
        else if (type === 'inactive_employees') {
            const result = await prisma_1.prisma.employee.deleteMany({
                where: {
                    isActive: false,
                    updatedAt: { lt: cutoffDate },
                },
            });
            deletedCount = result.count;
        }
        else if (type === 'all_logs') {
            const result = await prisma_1.prisma.emailLog.deleteMany({
                where: {
                    createdAt: { lt: cutoffDate },
                },
            });
            deletedCount = result.count;
        }
        else {
            return res.status(400).json({ success: false, message: 'Invalid cleanup type' });
        }
        res.json({
            success: true,
            message: `Cleanup completed. ${deletedCount} records deleted.`,
            deletedCount,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.cleanupDatabase = cleanupDatabase;
