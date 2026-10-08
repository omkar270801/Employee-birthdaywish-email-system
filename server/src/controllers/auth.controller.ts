import { Response } from 'express';
import { login } from '../services/auth.service';
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
