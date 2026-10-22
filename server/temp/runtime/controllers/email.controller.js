"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestEmailCtrl = exports.deleteEmailLogCtrl = exports.getEmailHistoryCtrl = void 0;
const birthday_service_1 = require("../services/birthday.service");
const email_service_1 = require("../services/email.service");
const getEmailHistoryCtrl = async (req, res) => {
    try {
        const { startDate, endDate, status, employeeId } = req.query;
        const history = await (0, birthday_service_1.getEmailHistory)({
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status: status,
            employeeId: employeeId,
        });
        res.json({ success: true, data: history });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getEmailHistoryCtrl = getEmailHistoryCtrl;
const deleteEmailLogCtrl = async (req, res) => {
    try {
        const result = await (0, birthday_service_1.deleteEmailLog)(req.params.id);
        if (!result.success) {
            return res.status(result.reason === 'Email log not found' ? 404 : 409).json(result);
        }
        res.json({ success: true, message: 'Email log deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteEmailLogCtrl = deleteEmailLogCtrl;
const sendTestEmailCtrl = async (req, res) => {
    try {
        const { to, subject, body } = req.body;
        const result = await (0, email_service_1.testEmail)(to, subject, body);
        res.json({ success: result.success, message: result.success ? 'Email sent successfully' : 'Failed to send email', data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.sendTestEmailCtrl = sendTestEmailCtrl;
