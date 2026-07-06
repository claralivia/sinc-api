import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { adminMiddleware, authMiddleware } from '../middlewares/auth';

const userRoutes = Router();
const userController = new UserController();

userRoutes.get('/me', authMiddleware, userController.me);
userRoutes.get('/users/partners', authMiddleware, userController.partners);
userRoutes.get('/users', authMiddleware, adminMiddleware, userController.list);
userRoutes.put('/users/:id', authMiddleware, adminMiddleware, userController.update);
userRoutes.post('/users/household', authMiddleware, adminMiddleware, userController.linkCouple);

export { userRoutes };
