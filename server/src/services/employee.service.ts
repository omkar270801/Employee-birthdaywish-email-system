import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

export const getAllEmployees = (filters?: { department?: string; isActive?: boolean; search?: string }) => {
  const where: Prisma.EmployeeWhereInput = {};

  if (filters?.department) {
    where.department = filters.department;
  }
  if (typeof filters?.isActive === 'boolean') {
    where.isActive = filters.isActive;
  }
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.employee.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
};

export const getEmployeeById = (id: string) => {
  return prisma.employee.findUnique({ where: { id } });
};

export const getEmployeeByEmail = (email: string) => {
  return prisma.employee.findUnique({ where: { email } });
};

export const createEmployee = (data: Prisma.EmployeeCreateInput) => {
  return prisma.employee.create({ data });
};

export const updateEmployee = (id: string, data: Prisma.EmployeeUpdateInput) => {
  return prisma.employee.update({ where: { id }, data });
};

export const deleteEmployee = (id: string) => {
  return prisma.employee.delete({ where: { id } });
};

export const bulkCreateEmployees = (employees: Prisma.EmployeeCreateInput[]) => {
  return prisma.employee.createMany({
    data: employees,
    skipDuplicates: true,
  });
};

export const getDepartments = async () => {
  const employees = await prisma.employee.findMany({
    select: { department: true },
    distinct: ['department'],
  });
  return employees.map(e => e.department);
};

const matchesBirthday = (dateOfBirth: Date, targetMonth: number, targetDay: number): boolean => {
  const dob = new Date(dateOfBirth);
  return dob.getMonth() === targetMonth && dob.getDate() === targetDay;
};

export const getTodayBirthdays = async () => {
  const today = new Date();
  const month = today.getMonth();
  const day = today.getDate();

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

  return employees.filter(emp => matchesBirthday(emp.dateOfBirth, month, day));
};

export const getUpcomingBirthdays = async (days: number = 7) => {
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    throw new RangeError('days must be an integer between 1 and 90');
  }

  const today = new Date();
  const results: Array<{ employee: any; date: Date }> = [];

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

  for (let i = 0; i < days; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);
    const month = checkDate.getMonth();
    const day = checkDate.getDate();

    const birthdays = employees.filter(emp => matchesBirthday(emp.dateOfBirth, month, day));
    birthdays.forEach(emp => {
      results.push({ employee: emp, date: new Date(checkDate) });
    });
  }

  return results.sort((a, b) => a.date.getTime() - b.date.getTime());
};
