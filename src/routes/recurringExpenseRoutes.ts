import { Router } from 'express';
import { RecurringExpenseController } from '../controllers/RecurringExpenseController';
import { authMiddleware } from '../middlewares/auth';

const recurringExpenseRoutes = Router();
const recurringExpenseController = new RecurringExpenseController();

recurringExpenseRoutes.get('/recurring-expenses', authMiddleware, recurringExpenseController.list);
recurringExpenseRoutes.post('/recurring-expenses', authMiddleware, recurringExpenseController.create);
recurringExpenseRoutes.put('/recurring-expenses/:id', authMiddleware, recurringExpenseController.update);
recurringExpenseRoutes.delete('/recurring-expenses/:id', authMiddleware, recurringExpenseController.delete);
recurringExpenseRoutes.post('/recurring-expenses/:id/launch', authMiddleware, recurringExpenseController.launch);

export { recurringExpenseRoutes };
