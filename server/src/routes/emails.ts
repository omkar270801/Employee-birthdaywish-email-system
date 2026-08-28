import { Router, Request, Response, NextFunction } from 'express';
import { getEmailHistoryCtrl, deleteEmailLogCtrl, sendTestEmailCtrl } from '../controllers/email.controller';
import { validate, body } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const testValidation = [
  body('to').isEmail().withMessage('Valid email is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('body').notEmpty().withMessage('Body is required'),
];

const asyncValidate = async (req: Request, res: Response, next: NextFunction) => {
  for (const v of testValidation) {
    const result = await v.run(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ success: false, errors: result.array() });
    }
  }
  next();
};

router.use(authenticate);

router.get('/history', getEmailHistoryCtrl);
router.delete('/history/:id', deleteEmailLogCtrl);
router.post('/test', testValidation, asyncValidate, sendTestEmailCtrl);

export default router;
