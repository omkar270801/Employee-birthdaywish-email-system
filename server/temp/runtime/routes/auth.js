"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_1 = require("../middleware/validate");
const login_rate_limit_1 = require("../middleware/login-rate-limit");
const router = (0, express_1.Router)();
const loginValidation = [
    (0, validate_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, validate_1.body)('password').notEmpty().withMessage('Password is required'),
];
const asyncValidate = async (req, res, next) => {
    for (const v of loginValidation) {
        const result = await v.run(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ success: false, errors: result.array() });
        }
    }
    next();
};
router.post('/login', login_rate_limit_1.loginRateLimit, loginValidation, asyncValidate, auth_controller_1.loginController);
exports.default = router;
