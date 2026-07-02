import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { adminMiddleware, authMiddleware } from '../middlewares/auth';

const categoryRoutes = Router();
const categoryController = new CategoryController();

categoryRoutes.get('/categories', authMiddleware, categoryController.list);
categoryRoutes.post('/categories', authMiddleware, adminMiddleware, categoryController.create);
categoryRoutes.put('/categories/:id', authMiddleware, adminMiddleware, categoryController.update);
categoryRoutes.delete('/categories/:id', authMiddleware, adminMiddleware, categoryController.delete);

export { categoryRoutes };
