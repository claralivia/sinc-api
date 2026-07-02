import { Router } from 'express';
import { processNaturalLanguage } from '../controllers/AIController';

const aiRoutes = Router();

aiRoutes.post('/ai-parse', processNaturalLanguage);

export { aiRoutes };
