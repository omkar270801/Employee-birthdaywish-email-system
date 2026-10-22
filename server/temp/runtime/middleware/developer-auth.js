"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateDeveloper = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateDeveloper = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Developer authentication required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.DEVELOPER_JWT_SECRET);
        if (decoded.type !== 'developer') {
            return res.status(403).json({ message: 'Invalid token type' });
        }
        req.developer = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid or expired developer token' });
    }
};
exports.authenticateDeveloper = authenticateDeveloper;
