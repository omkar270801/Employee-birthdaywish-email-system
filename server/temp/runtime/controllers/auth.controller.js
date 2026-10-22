"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginController = void 0;
const auth_service_1 = require("../services/auth.service");
const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await (0, auth_service_1.login)(email, password);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};
exports.loginController = loginController;
