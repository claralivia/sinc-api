import { Router } from 'express';
import { CardController } from '../controllers/CardController';
import { adminMiddleware, authMiddleware } from '../middlewares/auth';

const cardRoutes = Router();
const cardController = new CardController();

cardRoutes.get('/cards', authMiddleware, cardController.list);
cardRoutes.post('/cards', authMiddleware, adminMiddleware, cardController.create);
cardRoutes.put('/cards/:id', authMiddleware, adminMiddleware, cardController.update);
cardRoutes.delete('/cards/:id', authMiddleware, adminMiddleware, cardController.delete);

export { cardRoutes };
