import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';

const categoryRoutes = Router();
const categoryController = new CategoryController();

categoryRoutes.get('/categories', categoryController.list);

export { categoryRoutes };
