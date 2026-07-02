import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';

const dashboardRoutes = Router();
const dashboardController = new DashboardController();

// dashboardRoutes.get('/dashboard', authMiddleware, dashboardController.getSummary)
dashboardRoutes.get('/dashboard', dashboardController.getSummary);

export { dashboardRoutes };