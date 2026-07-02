import { Router } from 'express';
import { GoalController } from '../controllers/GoalController';
import { authMiddleware } from '../middlewares/auth';

const goalRoutes = Router();
const goalController = new GoalController();

goalRoutes.get('/goals', authMiddleware, goalController.list);
goalRoutes.post('/goals', authMiddleware, goalController.create);
goalRoutes.put('/goals/:id', authMiddleware, goalController.update);
goalRoutes.delete('/goals/:id', authMiddleware, goalController.delete);
goalRoutes.post('/goals/:id/contribute', authMiddleware, goalController.contribute);

export { goalRoutes };
