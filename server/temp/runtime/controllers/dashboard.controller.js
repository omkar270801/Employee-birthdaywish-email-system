"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const prisma_1 = require("../utils/prisma");
const matchesBirthday = (dateOfBirth, targetMonth, targetDay) => {
    const dob = new Date(dateOfBirth);
    return dob.getMonth() === targetMonth && dob.getDate() === targetDay;
};
const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const month = today.getMonth();
        const day = today.getDate();
        const totalEmployees = await prisma_1.prisma.employee.count({ where: { isActive: true } });
        const allActiveEmployees = await prisma_1.prisma.employee.findMany({
            where: { isActive: true },
            select: { id: true, name: true, email: true, designation: true, dateOfBirth: true },
        });
        const todayBirthdayEmployees = allActiveEmployees.filter(emp => emp.dateOfBirth !== null && matchesBirthday(emp.dateOfBirth, month, day));
        const todayBirthdays = todayBirthdayEmployees.map(emp => ({ ...emp, emailStatus: 'Not Sent' }));
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const tomorrowStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        const birthdayEmails = await prisma_1.prisma.emailLog.findMany({
            where: {
                birthdayDate: {
                    gte: todayStart,
                    lt: tomorrowStart,
                },
            },
            include: {
                employee: {
                    select: { name: true, email: true },
                },
            },
        });
        const emailStatusMap = new Map(birthdayEmails.map(e => [e.employeeId, e.status]));
        const todayBirthdaysWithStatus = todayBirthdays.map(emp => ({
            ...emp,
            emailStatus: emailStatusMap.get(emp.id) || 'Not Sent',
        }));
        const todayEmailsSent = await prisma_1.prisma.emailLog.count({
            where: {
                status: 'SENT',
                createdAt: { gte: todayStart, lt: tomorrowStart },
            },
        });
        const todayEmailsNotSent = await prisma_1.prisma.emailLog.count({
            where: {
                status: {
                    not: 'SENT',
                },
                createdAt: { gte: todayStart, lt: tomorrowStart },
            },
        });
        res.json({
            success: true,
            data: {
                totalEmployees,
                todayBirthdays: todayBirthdaysWithStatus,
                todayEmailsSent,
                todayEmailsNotSent,
                upcomingCount: totalEmployees,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDashboardStats = getDashboardStats;
