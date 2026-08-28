import { Router } from 'express';
import {
  getTodayBirthdaysCtrl,
  getUpcomingBirthdaysCtrl,
  triggerBirthdayJobCtrl,
  sendEmailToEmployeeCtrl,
} from '../controllers/birthday.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/today', getTodayBirthdaysCtrl);
router.get('/upcoming', getUpcomingBirthdaysCtrl);
router.post('/send', triggerBirthdayJobCtrl);
router.post('/send/:employeeId', sendEmailToEmployeeCtrl);

export default router;
