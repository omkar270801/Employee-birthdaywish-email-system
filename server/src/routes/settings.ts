import { Router } from 'express';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabaseStats, cleanupDatabase } from '../controllers/settings.controller';
import { AuthRequest } from '../middleware/auth';
import { DeveloperRequest } from '../middleware/developer-auth';
import { DeveloperTokenPayload } from '../services/developer-auth.service';

const router = Router();

const authenticateSettingsUser = (req: AuthRequest & DeveloperRequest, res: Response, next: NextFunction) => {
	const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

	if (!token) {
		return res.status(401).json({ message: 'Authentication required' });
	}

	let adminPayload: jwt.JwtPayload | null = null;
	try {
		adminPayload = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
	} catch {}

	if (adminPayload) {
		if (adminPayload.role !== 'ADMIN' || typeof adminPayload.id !== 'string' || typeof adminPayload.email !== 'string') {
			return res.status(403).json({ message: 'Administrator access required' });
		}
		req.user = { id: adminPayload.id, email: adminPayload.email, role: 'ADMIN' };
		return next();
	}

	try {
		const decoded = jwt.verify(token, process.env.DEVELOPER_JWT_SECRET!) as jwt.JwtPayload & DeveloperTokenPayload;
		if (decoded.type !== 'developer' || typeof decoded.email !== 'string') {
			return res.status(403).json({ message: 'Invalid token type' });
		}
		req.developer = decoded;
		return next();
	} catch (error) {
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
	if (req.user?.role !== 'ADMIN') {
		return res.status(403).json({ message: 'Administrator access required' });
	}
	next();
};

router.use(authenticateSettingsUser);

router.get('/stats', getDatabaseStats);
router.post('/cleanup', requireAdmin, cleanupDatabase);

export default router;
