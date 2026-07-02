import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';

const transactionRoutes = Router();
const transactionController = new TransactionController();

transactionRoutes.post('/transactions', transactionController.create);
transactionRoutes.get('/transactions', transactionController.list);
transactionRoutes.delete('/transactions/:id', transactionController.delete);

export { transactionRoutes };