import { Response } from 'express';
import { login, seedAdmin } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

export const loginController = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const seedAdminController = async (req: AuthRequest, res: Response) => {
  try {
    await seedAdmin();
    res.json({ success: true, message: 'Admin user created' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
