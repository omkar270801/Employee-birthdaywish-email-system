"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const settings_controller_1 = require("../controllers/settings.controller");
const router = (0, express_1.Router)();
const authenticateSettingsUser = (req, res, next) => {
    const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    let adminPayload = null;
    try {
        adminPayload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    }
    catch { }
    if (adminPayload) {
        if (adminPayload.role !== 'ADMIN' || typeof adminPayload.id !== 'string' || typeof adminPayload.email !== 'string') {
            return res.status(403).json({ message: 'Administrator access required' });
        }
        req.user = { id: adminPayload.id, email: adminPayload.email, role: 'ADMIN' };
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.DEVELOPER_JWT_SECRET);
        if (decoded.type !== 'developer' || typeof decoded.email !== 'string') {
            return res.status(403).json({ message: 'Invalid token type' });
        }
        req.developer = decoded;
        return next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Administrator access required' });
    }
    next();
};
router.use(authenticateSettingsUser);
router.get('/stats', settings_controller_1.getDatabaseStats);
router.post('/cleanup', requireAdmin, settings_controller_1.cleanupDatabase);
exports.default = router;
