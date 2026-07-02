import { Request, Response } from 'express';
import { TransactionService } from '../services/TransactionService';
import '../models/Category';
import '../models/User';

const transactionService = new TransactionService();

export class TransactionController {
  async create(req: Request, res: Response) {
    try {
      const transactionData = req.body;
      
      if (!Object.keys(transactionData)?.length) {
        return res.status(400).json({ error: 'Nenhum dado fornecido para a transação.' });
      }

      const transaction = await transactionService.createTransaction(transactionData);
      
      return res.status(201).json(transaction);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao criar transação.' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { page, limit, startDate, endDate, type, categoryId } = req.query;

      const filters = {
        startDate: startDate as string,
        endDate: endDate as string,
        type: type as string,
        categoryId: categoryId as string,
      };

      const pageNumber = page ? parseInt(page as string, 10) : 1;
      const limitNumber = limit ? parseInt(limit as string, 10) : 20;

      const result = await transactionService.listTransactions(filters, pageNumber, limitNumber);

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao listar transações.' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      
      await transactionService.deleteTransaction(id);
      
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao deletar transação.' });
    }
  }
}