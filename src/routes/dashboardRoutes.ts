import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authMiddleware } from '../middlewares/auth';

const dashboardRoutes = Router();
const dashboardController = new DashboardController();

dashboardRoutes.get('/dashboard', authMiddleware, dashboardController.getSummary);

export { dashboardRoutes };
