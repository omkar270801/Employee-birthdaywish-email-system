"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailToEmployeeCtrl = exports.triggerBirthdayJobCtrl = exports.getUpcomingBirthdaysCtrl = exports.getTodayBirthdaysCtrl = void 0;
const birthday_service_1 = require("../services/birthday.service");
const employee_service_1 = require("../services/employee.service");
const getTodayBirthdaysCtrl = async (req, res) => {
    try {
        const employees = await (0, employee_service_1.getTodayBirthdays)();
        res.json({ success: true, data: employees });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTodayBirthdaysCtrl = getTodayBirthdaysCtrl;
const getUpcomingBirthdaysCtrl = async (req, res) => {
    try {
        const rawDays = req.query.days;
        const days = rawDays === undefined ? 7 : Number(rawDays);
        if (!Number.isInteger(days) || days < 1 || days > 90) {
            return res.status(400).json({ success: false, message: 'days must be an integer between 1 and 90' });
        }
        const birthdays = await (0, employee_service_1.getUpcomingBirthdays)(days);
        res.json({ success: true, data: birthdays });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUpcomingBirthdaysCtrl = getUpcomingBirthdaysCtrl;
const triggerBirthdayJobCtrl = async (req, res) => {
    try {
        const result = await (0, birthday_service_1.birthdayJob)();
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.triggerBirthdayJobCtrl = triggerBirthdayJobCtrl;
const sendEmailToEmployeeCtrl = async (req, res) => {
    try {
        const { employeeId } = req.params;
        if (req.body?.resend !== undefined && typeof req.body.resend !== 'boolean') {
            return res.status(400).json({ success: false, message: 'resend must be a boolean' });
        }
        const result = await (0, birthday_service_1.sendBirthdayEmailToEmployee)(employeeId, req.body?.resend === true);
        res.json({
            success: result.success,
            message: result.success ? 'Email sent successfully' : result.error || ('reason' in result ? result.reason : undefined),
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.sendEmailToEmployeeCtrl = sendEmailToEmployeeCtrl;
