import { prisma } from '../utils/prisma';
import { sendBirthdayEmail } from './email.service';
import { getActiveTemplate } from './template.service';
import { getTodayBirthdays } from './employee.service';
import { getDatePartsInTimeZone } from '../utils/timezone';

const matchesBirthday = (dateOfBirth: Date, targetMonth: number, targetDay: number): boolean => {
  const dob = getDatePartsInTimeZone(dateOfBirth);
  return dob.month === targetMonth && dob.day === targetDay;
};

export const birthdayJob = async () => {
  console.log('Starting birthday job...');

  try {
    const { month, day } = getDatePartsInTimeZone(new Date());

    const employees = await prisma.employee.findMany({
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

    const birthdayEmployees = employees.filter(emp => matchesBirthday(emp.dateOfBirth, month, day));

    if (birthdayEmployees.length === 0) {
      console.log('No birthdays today.');
      return { success: true, sent: 0, failed: 0 };
    }

    const template = await getActiveTemplate();
    if (!template) {
      console.log('No active email template found.');
      return { success: false, error: 'No active template' };
    }

    let sent = 0;
    let failed = 0;

    for (const employee of birthdayEmployees) {
      try {
        const result = await sendBirthdayEmail(employee, template);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        console.error(`Birthday email failed for employee ${employee.id}:`, error);
      }
    }

    console.log(`Birthday job completed: ${sent} sent, ${failed} failed`);
    return { success: true, sent, failed };
  } catch (error: any) {
    console.error('Birthday job error:', error);
    return { success: false, error: error.message };
  }
};

export const getEmailHistory = async (filters?: {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  employeeId?: string;
}) => {
  const where: any = {};

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

  return prisma.emailLog.findMany({
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

export const deleteEmailLog = async (logId: string) => {
  const log = await prisma.emailLog.findUnique({ where: { id: logId }, select: { status: true } });
  if (!log) return { success: false, reason: 'Email log not found' };
  if (log.status === 'SENT' || log.status === 'PROCESSING') {
    return { success: false, reason: 'Successful or in-progress send records cannot be deleted' };
  }
  await prisma.emailLog.delete({ where: { id: logId } });
  return { success: true };
};

export const sendBirthdayEmailToEmployee = async (employeeId: string, allowResend = false) => {
  const employee = await prisma.employee.findUnique({
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

  const { month, day } = getDatePartsInTimeZone(new Date());
  if (!employee.isActive || !matchesBirthday(employee.dateOfBirth, month, day)) {
    return { success: false, error: 'Employee is inactive or does not have a birthday today' };
  }

  const template = await getActiveTemplate();
  if (!template) {
    return { success: false, error: 'No active email template found' };
  }

  const result = await sendBirthdayEmail(employee, template, allowResend);
  return result;
};
