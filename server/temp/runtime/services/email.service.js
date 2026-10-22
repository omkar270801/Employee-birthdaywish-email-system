"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testEmail = exports.sendBirthdayEmail = exports.sendEmail = exports.verifyEmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const prisma_1 = require("../utils/prisma");
const timezone_1 = require("../utils/timezone");
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});
const verifyEmailService = async () => {
    try {
        await transporter.verify();
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.verifyEmailService = verifyEmailService;
const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to,
            subject,
            html,
        });
        return {
            success: true,
            messageId: info.messageId,
        };
    }
    catch (error) {
        console.error('SMTP send error:', error);
        return {
            success: false,
            error: error.message || 'Failed to send email',
        };
    }
};
exports.sendEmail = sendEmail;
const sendBirthdayEmail = async (employee, template, allowResend = false) => {
    const { start: birthdayDate, end: nextBirthdayDate } = (0, timezone_1.getIstDayBounds)();
    const existingLog = await prisma_1.prisma.emailLog.findFirst({
        where: {
            employeeId: employee.id,
            birthdayDate: { gte: birthdayDate, lt: nextBirthdayDate },
        },
    });
    if (existingLog && (!allowResend || !['SENT', 'FAILED'].includes(existingLog.status))) {
        return {
            success: false,
            reason: existingLog.status === 'PROCESSING' ? 'Email is already being processed' : 'Email already sent today',
        };
    }
    const trimmedDesignation = (employee.designation || '').trim();
    const greeting = trimmedDesignation
        ? `Dear ${trimmedDesignation} ${employee.name}`
        : `Dear ${employee.name}`;
    const subject = template.subject
        .replace(/\{\{employeeName\}\}/g, employee.name)
        .replace(/\{\{name\}\}/g, employee.name)
        .replace(/\{\{department\}\}/g, employee.department || '')
        .replace(/\{\{designation\}\}/g, employee.designation || '')
        .replace(/\{\{greeting\}\}/g, greeting);
    const body = template.body
        .replace(/\{\{employeeName\}\}/g, employee.name)
        .replace(/\{\{name\}\}/g, employee.name)
        .replace(/\{\{department\}\}/g, employee.department || '')
        .replace(/\{\{designation\}\}/g, employee.designation || '')
        .replace(/\{\{greeting\}\}/g, greeting);
    let log;
    if (existingLog) {
        if (!allowResend || !['SENT', 'FAILED'].includes(existingLog.status)) {
            return { success: false, reason: existingLog.status === 'PROCESSING' ? 'Email is already being processed' : 'Email already sent today' };
        }
        const claimed = await prisma_1.prisma.emailLog.updateMany({
            where: { id: existingLog.id, status: existingLog.status },
            data: {
                status: 'PROCESSING',
                templateId: template.id,
                recipientEmail: employee.email,
                subject,
                sentAt: null,
                errorMessage: null,
            },
        });
        if (claimed.count === 0) {
            return { success: false, reason: 'Email is already being processed' };
        }
        log = await prisma_1.prisma.emailLog.findUniqueOrThrow({ where: { id: existingLog.id } });
    }
    else {
        try {
            log = await prisma_1.prisma.emailLog.create({
                data: {
                    employeeId: employee.id,
                    templateId: template.id,
                    birthdayDate,
                    recipientEmail: employee.email,
                    subject,
                    status: 'PROCESSING',
                },
            });
        }
        catch (error) {
            if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'P2002') {
                throw error;
            }
            const conflictingLog = await prisma_1.prisma.emailLog.findUnique({
                where: { employeeId_birthdayDate: { employeeId: employee.id, birthdayDate } },
            });
            if (!conflictingLog || (conflictingLog.status === 'SENT' && !allowResend)) {
                return { success: false, reason: 'Email already sent today' };
            }
            const staleAttemptBefore = new Date(Date.now() - 15 * 60 * 1000);
            const claimableStatuses = [
                { status: 'FAILED' },
                { status: 'PROCESSING', updatedAt: { lt: staleAttemptBefore } },
                ...(allowResend ? [{ status: 'SENT' }] : []),
            ];
            const claimed = await prisma_1.prisma.emailLog.updateMany({
                where: { id: conflictingLog.id, OR: claimableStatuses },
                data: {
                    status: 'PROCESSING',
                    templateId: template.id,
                    recipientEmail: employee.email,
                    subject,
                    sentAt: null,
                    errorMessage: null,
                },
            });
            if (claimed.count === 0) {
                return { success: false, reason: 'Email is already being processed' };
            }
            log = await prisma_1.prisma.emailLog.findUniqueOrThrow({ where: { id: conflictingLog.id } });
        }
    }
    const result = await (0, exports.sendEmail)(employee.email, subject, body);
    log = await prisma_1.prisma.emailLog.update({
        where: { id: log.id },
        data: {
            status: result.success ? 'SENT' : 'FAILED',
            sentAt: result.success ? new Date() : null,
            errorMessage: result.error || null,
        },
    });
    return {
        success: result.success,
        log,
        error: result.error,
    };
};
exports.sendBirthdayEmail = sendBirthdayEmail;
const testEmail = async (to, subject, body) => {
    return (0, exports.sendEmail)(to, subject, body);
};
exports.testEmail = testEmail;
