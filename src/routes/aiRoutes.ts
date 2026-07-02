import { Router } from 'express';
import { processNaturalLanguage } from '../controllers/AIController';
import { authMiddleware } from '../middlewares/auth';

const aiRoutes = Router();

aiRoutes.post('/ai-parse', authMiddleware, processNaturalLanguage);

export { aiRoutes };
