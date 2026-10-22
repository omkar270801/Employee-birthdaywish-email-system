"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyDeveloperCredentials = exports.generateDeveloperToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateDeveloperToken = (email) => {
    return jsonwebtoken_1.default.sign({ email, type: 'developer' }, process.env.DEVELOPER_JWT_SECRET, { expiresIn: '8h' });
};
exports.generateDeveloperToken = generateDeveloperToken;
const verifyDeveloperCredentials = (email, password) => {
    const devEmail = process.env.DEVELOPER_EMAIL;
    const devPassword = process.env.DEVELOPER_PASSWORD;
    if (!devEmail || !devPassword) {
        return false;
    }
    return email === devEmail && password === devPassword;
};
exports.verifyDeveloperCredentials = verifyDeveloperCredentials;
