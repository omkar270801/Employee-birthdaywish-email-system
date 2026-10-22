"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentActivityController = exports.getLogsController = exports.getStatisticsController = exports.getSchedulerController = exports.getHealthController = exports.getDeveloperStatusController = exports.developerLoginController = void 0;
const developer_auth_service_1 = require("../services/developer-auth.service");
const prisma_1 = require("../utils/prisma");
const email_service_1 = require("../services/email.service");
const developer_metrics_1 = require("../services/developer-metrics");
const timezone_1 = require("../utils/timezone");
const developerLoginController = async (req, res) => {
    const { email, password } = req.body;
    const isValid = (0, developer_auth_service_1.verifyDeveloperCredentials)(email, password);
    if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = (0, developer_auth_service_1.generateDeveloperToken)(email);
    res.json({
        success: true,
        data: {
            token,
            email,
            type: 'developer',
        },
    });
};
exports.developerLoginController = developerLoginController;
const getDeveloperStatusController = async (req, res) => {
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
exports.getDeveloperStatusController = getDeveloperStatusController;
const getHealthController = async (req, res) => {
    const startTime = Date.now();
    let databaseStatus = 'disconnected';
    let emailStatus = 'disconnected';
    let schedulerStatus = 'stopped';
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        databaseStatus = 'connected';
    }
    catch (error) {
        databaseStatus = 'disconnected';
    }
    try {
        const emailConnected = await (0, email_service_1.verifyEmailService)();
        emailStatus = emailConnected ? 'connected' : 'disconnected';
    }
    catch (error) {
        emailStatus = 'disconnected';
    }
    schedulerStatus = developer_metrics_1.schedulerState.isRunning ? 'running' : 'stopped';
    const allHealthy = databaseStatus === 'connected' && emailStatus === 'connected' && schedulerStatus === 'running';
    res.json({
        success: true,
        data: {
            status: allHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            services: {
                api: { status: 'operational' },
                database: { status: databaseStatus },
                email: { status: emailStatus },
                scheduler: { status: schedulerStatus },
            },
        },
    });
};
exports.getHealthController = getHealthController;
const getSchedulerController = async (req, res) => {
    res.json({
        success: true,
        data: {
            ...developer_metrics_1.schedulerState,
            checkTime: process.env.BIRTHDAY_CHECK_TIME || null,
        },
    });
};
exports.getSchedulerController = getSchedulerController;
const getStatisticsController = async (req, res) => {
    try {
        const [totalEmployees, totalEmailsSent, totalEmailsFailed, totalEmailLogs, totalTemplates,] = await Promise.all([
            prisma_1.prisma.employee.count(),
            prisma_1.prisma.emailLog.count({ where: { status: 'SENT' } }),
            prisma_1.prisma.emailLog.count({ where: { status: 'FAILED' } }),
            prisma_1.prisma.emailLog.count(),
            prisma_1.prisma.emailTemplate.count(),
        ]);
        const { start: todayStart, end: tomorrowStart } = (0, timezone_1.getIstDayBounds)();
        const [todaySent, todayFailed] = await Promise.all([
            prisma_1.prisma.emailLog.count({
                where: {
                    status: 'SENT',
                    createdAt: { gte: todayStart, lt: tomorrowStart },
                },
            }),
            prisma_1.prisma.emailLog.count({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getStatisticsController = getStatisticsController;
const getLogsController = async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    res.json({
        success: true,
        data: {
            logs: developer_metrics_1.appLogs.slice(-safeLimit).reverse(),
            total: developer_metrics_1.appLogs.length,
        },
    });
};
exports.getLogsController = getLogsController;
const getRecentActivityController = async (req, res) => {
    try {
        const logs = await prisma_1.prisma.emailLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                createdAt: true,
                status: true,
                recipientEmail: true,
                subject: true,
                employee: {
                    select: { name: true, email: true },
                },
            },
        });
        res.json({ success: true, data: logs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Unable to load recent email activity' });
    }
};
exports.getRecentActivityController = getRecentActivityController;
