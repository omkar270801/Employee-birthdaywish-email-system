import { Router } from 'express';
import {
  developerLoginController,
  getDeveloperStatusController,
  getHealthController,
  getSchedulerController,
  getStatisticsController,
  getLogsController,
} from '../controllers/developer.controller';
import { authenticateDeveloper } from '../middleware/developer-auth';

const router = Router();

router.post('/login', developerLoginController);

router.use(authenticateDeveloper);

router.get('/status', getDeveloperStatusController);
router.get('/health', getHealthController);
router.get('/scheduler', getSchedulerController);
router.get('/statistics', getStatisticsController);
router.get('/logs', getLogsController);

export default router;
