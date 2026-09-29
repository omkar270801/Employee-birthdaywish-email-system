import { Router } from 'express';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabaseStats, cleanupDatabase } from '../controllers/settings.controller';
import { AuthRequest } from '../middleware/auth';
import { DeveloperRequest } from '../middleware/developer-auth';
import { DeveloperTokenPayload } from '../services/developer-auth.service';

const router = Router();

const authenticateSettingsUser = (req: AuthRequest & DeveloperRequest, res: Response, next: NextFunction) => {
	const token = req.headers.authorization?.replace('Bearer ', '');

	if (!token) {
		return res.status(401).json({ message: 'Authentication required' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest['user'] & DeveloperTokenPayload;

		if (decoded.type === 'developer') {
			req.developer = decoded;
		} else {
			req.user = decoded;
		}

		next();
	} catch (error) {
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
};

router.use(authenticateSettingsUser);

router.get('/stats', getDatabaseStats);
router.post('/cleanup', cleanupDatabase);

export default router;
