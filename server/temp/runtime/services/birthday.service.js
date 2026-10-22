"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBirthdayEmailToEmployee = exports.deleteEmailLog = exports.getEmailHistory = exports.birthdayJob = void 0;
const prisma_1 = require("../utils/prisma");
const email_service_1 = require("./email.service");
const template_service_1 = require("./template.service");
const timezone_1 = require("../utils/timezone");
const matchesBirthday = (dateOfBirth, targetMonth, targetDay) => {
    const dob = (0, timezone_1.getDatePartsInTimeZone)(dateOfBirth);
    return dob.month === targetMonth && dob.day === targetDay;
};
const birthdayJob = async () => {
    console.log('Starting birthday job...');
    try {
        const { month, day } = (0, timezone_1.getDatePartsInTimeZone)(new Date());
        const employees = await prisma_1.prisma.employee.findMany({
            where: {
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                department: true,
                designation: true,
                dateOfBirth: true,
            },
        });
        const birthdayEmployees = employees.filter((emp) => emp.email !== null && emp.dateOfBirth !== null && matchesBirthday(emp.dateOfBirth, month, day));
        if (birthdayEmployees.length === 0) {
            console.log('No birthdays today.');
            return { success: true, sent: 0, failed: 0 };
        }
        const template = await (0, template_service_1.getActiveTemplate)();
        if (!template) {
            console.log('No active email template found.');
            return { success: false, error: 'No active template' };
        }
        let sent = 0;
        let failed = 0;
        for (const employee of birthdayEmployees) {
            try {
                const result = await (0, email_service_1.sendBirthdayEmail)(employee, template);
                if (result.success) {
                    sent++;
                }
                else {
                    failed++;
                }
            }
            catch (error) {
                failed++;
                console.error(`Birthday email failed for employee ${employee.id}:`, error);
            }
        }
        console.log(`Birthday job completed: ${sent} sent, ${failed} failed`);
        return { success: true, sent, failed };
    }
    catch (error) {
        console.error('Birthday job error:', error);
        return { success: false, error: error.message };
    }
};
exports.birthdayJob = birthdayJob;
const getEmailHistory = async (filters) => {
    const where = {};
    if (filters?.startDate && filters?.endDate) {
        where.createdAt = {
            gte: filters.startDate,
            lte: filters.endDate,
        };
    }
    if (filters?.status) {
        where.status = filters.status;
    }
    if (filters?.employeeId) {
        where.employeeId = filters.employeeId;
    }
    return prisma_1.prisma.emailLog.findMany({
        where,
        include: {
            employee: {
                select: {
                    name: true,
                    email: true,
                    department: true,
                    designation: true,
                },
            },
            template: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
    });
};
exports.getEmailHistory = getEmailHistory;
const deleteEmailLog = async (logId) => {
    const log = await prisma_1.prisma.emailLog.findUnique({ where: { id: logId }, select: { status: true } });
    if (!log)
        return { success: false, reason: 'Email log not found' };
    if (log.status === 'SENT' || log.status === 'PROCESSING') {
        return { success: false, reason: 'Successful or in-progress send records cannot be deleted' };
    }
    await prisma_1.prisma.emailLog.delete({ where: { id: logId } });
    return { success: true };
};
exports.deleteEmailLog = deleteEmailLog;
const sendBirthdayEmailToEmployee = async (employeeId, allowResend = false) => {
    const employee = await prisma_1.prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
            id: true,
            name: true,
            email: true,
            department: true,
            designation: true,
            dateOfBirth: true,
            isActive: true,
        },
    });
    if (!employee) {
        return { success: false, error: 'Employee not found' };
    }
    const { month, day } = (0, timezone_1.getDatePartsInTimeZone)(new Date());
    const email = employee.email;
    if (!employee.isActive || !email || !employee.dateOfBirth || !matchesBirthday(employee.dateOfBirth, month, day)) {
        return { success: false, error: 'Employee is inactive or does not have a birthday today' };
    }
    const template = await (0, template_service_1.getActiveTemplate)();
    if (!template) {
        return { success: false, error: 'No active email template found' };
    }
    const result = await (0, email_service_1.sendBirthdayEmail)({ ...employee, email }, template, allowResend);
    return result;
};
exports.sendBirthdayEmailToEmployee = sendBirthdayEmailToEmployee;
