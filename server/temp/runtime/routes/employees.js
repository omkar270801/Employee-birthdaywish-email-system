"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_controller_1 = require("../controllers/employee.controller");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (allowedTypes.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.xlsx')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only Excel files are allowed'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 },
});
router.use(auth_1.authenticate);
router.get('/', employee_controller_1.getEmployees);
router.get('/:id', employee_controller_1.getEmployee);
router.post('/', employee_controller_1.createEmployee);
router.put('/:id', employee_controller_1.updateEmployee);
router.delete('/:id', employee_controller_1.deleteEmployee);
router.post('/upload', upload.single('file'), employee_controller_1.uploadEmployees);
exports.default = router;
