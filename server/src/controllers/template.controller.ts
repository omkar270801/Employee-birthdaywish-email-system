import { Response } from 'express';
import * as templateService from '../services/template.service';
import { AuthRequest } from '../middleware/auth';
import { validate, body } from '../middleware/validate';

export const getTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const templates = await templateService.getAllTemplates();
    res.json({ success: true, data: templates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const template = await templateService.createTemplate(req.body);
    res.status(201).json({ success: true, data: template });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const updated = await templateService.updateTemplate(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    await templateService.deleteTemplate(req.params.id);
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
