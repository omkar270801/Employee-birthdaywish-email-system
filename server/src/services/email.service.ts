import nodemailer from 'nodemailer';
import { prisma } from '../utils/prisma';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const verifyEmailService = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    return false;
  }
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
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
  } catch (error: any) {
    console.error('SMTP send error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
};

export const sendBirthdayEmail = async (
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
    designation: string;
  },
  template: { id: string; subject: string; body: string }
) => {
  const today = new Date();
  const birthdayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const existingLog = await prisma.emailLog.findFirst({
    where: {
      employeeId: employee.id,
      birthdayDate,
    },
  });

  if (existingLog && existingLog.status === 'SENT') {
    return { success: false, reason: 'Email already sent today' };
  }

  if (existingLog) {
    return { success: false, reason: 'Email already sent today' };
  }

  const trimmedDesignation = (employee.designation || '').trim();
  const greeting = trimmedDesignation
    ? `Dear ${trimmedDesignation} ${employee.name}`
    : `Dear ${employee.name}`;

  const subject = template.subject
    .replace(/\{\{employeeName\}\}/g, employee.name)
    .replace(/\{\{name\}\}/g, employee.name)
    .replace(/\{\{department\}\}/g, employee.department)
    .replace(/\{\{designation\}\}/g, employee.designation)
    .replace(/\{\{greeting\}\}/g, greeting);

  const body = template.body
    .replace(/\{\{employeeName\}\}/g, employee.name)
    .replace(/\{\{name\}\}/g, employee.name)
    .replace(/\{\{department\}\}/g, employee.department)
    .replace(/\{\{designation\}\}/g, employee.designation)
    .replace(/\{\{greeting\}\}/g, greeting);

  const result = await sendEmail(employee.email, subject, body);

  const log = await prisma.emailLog.create({
    data: {
      employeeId: employee.id,
      templateId: template.id,
      birthdayDate,
      recipientEmail: employee.email,
      subject,
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

export const testEmail = async (
  to: string,
  subject: string,
  body: string
) => {
  return sendEmail(to, subject, body);
};
