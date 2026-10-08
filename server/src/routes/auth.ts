import { Router, Request, Response, NextFunction } from 'express';
import { loginController } from '../controllers/auth.controller';
import { body } from '../middleware/validate';
import { loginRateLimit } from '../middleware/login-rate-limit';

const router = Router();

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const asyncValidate = async (req: Request, res: Response, next: NextFunction) => {
  for (const v of loginValidation) {
    const result = await v.run(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ success: false, errors: result.array() });
    }
  }
  next();
};

router.post('/login', loginRateLimit, loginValidation, asyncValidate, loginController);

export default router;
