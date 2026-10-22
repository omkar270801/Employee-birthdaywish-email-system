"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const email_controller_1 = require("../controllers/email.controller");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const testValidation = [
    (0, validate_1.body)('to').isEmail().withMessage('Valid email is required'),
    (0, validate_1.body)('subject').notEmpty().withMessage('Subject is required'),
    (0, validate_1.body)('body').notEmpty().withMessage('Body is required'),
];
const asyncValidate = async (req, res, next) => {
    for (const v of testValidation) {
        const result = await v.run(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ success: false, errors: result.array() });
        }
    }
    next();
};
router.use(auth_1.authenticate);
router.get('/history', email_controller_1.getEmailHistoryCtrl);
router.delete('/history/:id', email_controller_1.deleteEmailLogCtrl);
router.post('/test', testValidation, asyncValidate, email_controller_1.sendTestEmailCtrl);
exports.default = router;
