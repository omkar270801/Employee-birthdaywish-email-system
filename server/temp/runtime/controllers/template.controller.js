"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.updateTemplate = exports.createTemplate = exports.getTemplate = exports.getTemplates = void 0;
const templateService = __importStar(require("../services/template.service"));
const getTemplates = async (req, res) => {
    try {
        const templates = await templateService.getAllTemplates();
        res.json({ success: true, data: templates });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTemplates = getTemplates;
const getTemplate = async (req, res) => {
    try {
        const template = await templateService.getTemplateById(req.params.id);
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }
        res.json({ success: true, data: template });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTemplate = getTemplate;
const createTemplate = async (req, res) => {
    try {
        const template = await templateService.createTemplate(req.body);
        res.status(201).json({ success: true, data: template });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createTemplate = createTemplate;
const updateTemplate = async (req, res) => {
    try {
        const template = await templateService.getTemplateById(req.params.id);
        if (!template) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }
        const updated = await templateService.updateTemplate(req.params.id, req.body);
        res.json({ success: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateTemplate = updateTemplate;
const deleteTemplate = async (req, res) => {
    try {
        await templateService.deleteTemplate(req.params.id);
        res.json({ success: true, message: 'Template deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteTemplate = deleteTemplate;
