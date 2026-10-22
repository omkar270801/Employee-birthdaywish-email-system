"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRateLimit = void 0;
const express_rate_limit_1 = require("express-rate-limit");
exports.loginRateLimit = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Try again later.' },
});
