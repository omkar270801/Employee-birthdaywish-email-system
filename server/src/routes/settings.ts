import { Router } from 'express';
import { getDatabaseStats, cleanupDatabase } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', getDatabaseStats);
router.post('/cleanup', cleanupDatabase);

export default router;
