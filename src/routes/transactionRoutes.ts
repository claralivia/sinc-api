import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { authMiddleware } from '../middlewares/auth';

const transactionRoutes = Router();
const transactionController = new TransactionController();

transactionRoutes.post('/transactions', authMiddleware, transactionController.create);
transactionRoutes.get('/transactions', authMiddleware, transactionController.list);
transactionRoutes.get('/transactions/installments/summary', authMiddleware, transactionController.installmentSummary);
transactionRoutes.delete('/transactions/:id', authMiddleware, transactionController.delete);

export { transactionRoutes };
