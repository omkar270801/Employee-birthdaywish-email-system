"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpcomingBirthdays = exports.getTodayBirthdays = exports.getDepartments = exports.bulkCreateEmployees = exports.deleteEmployee = exports.updateEmployee = exports.createEmployee = exports.getEmployeeByEmail = exports.getEmployeeById = exports.getAllEmployees = void 0;
const prisma_1 = require("../utils/prisma");
const timezone_1 = require("../utils/timezone");
const getAllEmployees = (filters) => {
    const where = {};
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
    return prisma_1.prisma.employee.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    });
};
exports.getAllEmployees = getAllEmployees;
const getEmployeeById = (id) => {
    return prisma_1.prisma.employee.findUnique({ where: { id } });
};
exports.getEmployeeById = getEmployeeById;
const getEmployeeByEmail = (email) => {
    return prisma_1.prisma.employee.findUnique({ where: { email } });
};
exports.getEmployeeByEmail = getEmployeeByEmail;
const createEmployee = (data) => {
    return prisma_1.prisma.employee.create({ data });
};
exports.createEmployee = createEmployee;
const updateEmployee = (id, data) => {
    return prisma_1.prisma.employee.update({ where: { id }, data });
};
exports.updateEmployee = updateEmployee;
const deleteEmployee = (id) => {
    return prisma_1.prisma.employee.delete({ where: { id } });
};
exports.deleteEmployee = deleteEmployee;
const bulkCreateEmployees = (employees) => {
    return prisma_1.prisma.employee.createMany({
        data: employees,
        skipDuplicates: true,
    });
};
exports.bulkCreateEmployees = bulkCreateEmployees;
const getDepartments = async () => {
    const employees = await prisma_1.prisma.employee.findMany({
        select: { department: true },
        distinct: ['department'],
    });
    return employees.map(e => e.department);
};
exports.getDepartments = getDepartments;
const matchesBirthday = (dateOfBirth, targetMonth, targetDay) => {
    const dob = (0, timezone_1.getDatePartsInTimeZone)(dateOfBirth);
    return dob.month === targetMonth && dob.day === targetDay;
};
const getTodayBirthdays = async () => {
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
    return employees.filter(emp => emp.dateOfBirth !== null && matchesBirthday(emp.dateOfBirth, month, day));
};
exports.getTodayBirthdays = getTodayBirthdays;
const getUpcomingBirthdays = async (days = 7) => {
    if (!Number.isInteger(days) || days < 1 || days > 90) {
        throw new RangeError('days must be an integer between 1 and 90');
    }
    const { start } = (0, timezone_1.getIstDayBounds)();
    const results = [];
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
    for (let i = 0; i < days; i++) {
        const checkDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        const { year, month, day } = (0, timezone_1.getDatePartsInTimeZone)(checkDate);
        const birthdays = employees.filter(emp => emp.dateOfBirth !== null && matchesBirthday(emp.dateOfBirth, month, day));
        birthdays.forEach(emp => {
            results.push({ employee: emp, date: (0, timezone_1.createUtcDateOnly)(year, month, day) });
        });
    }
    return results.sort((a, b) => a.date.getTime() - b.date.getTime());
};
exports.getUpcomingBirthdays = getUpcomingBirthdays;
