import { Request, Response } from 'express';
import { TransactionService } from '../services/TransactionService';
import { getOrCreateHouseholdId, resolveHouseholdId, resolveOwnerId } from '../services/UserService';
import '../models/Category';
import '../models/User';

const transactionService = new TransactionService();

export class TransactionController {
  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const transactionData = { ...req.body, paidBy: resolveOwnerId(user) };

      if (!Object.keys(transactionData)?.length) {
        return res.status(400).json({ error: 'Nenhum dado fornecido para a transação.' });
      }

      if (!transactionData.description || !transactionData.amount || !transactionData.type || !transactionData.categoryId) {
        return res.status(400).json({ error: 'Descrição, valor, tipo e categoria são obrigatórios.' });
      }

      const transaction = await transactionService.createTransaction(transactionData);

      return res.status(201).json(transaction);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao criar transação.' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { page, limit, startDate, endDate, type, categoryId } = req.query;

      const householdId = await resolveHouseholdId(user.id);

      if (!householdId) {
        return res.status(200).json({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });
      }

      const filters = {
        startDate: startDate as string,
        endDate: endDate as string,
        type: type as string,
        categoryId: categoryId as string,
      };

      const pageNumber = page ? parseInt(page as string, 10) : 1;
      const limitNumber = limit ? parseInt(limit as string, 10) : 20;

      const result = await transactionService.listTransactions(filters, pageNumber, limitNumber, householdId);

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao listar transações.' });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params as { id: string };

      const householdId = await resolveHouseholdId(user.id);

      if (!householdId) {
        return res.status(404).json({ error: 'Transação não encontrada.' });
      }

      const transaction = await transactionService.getTransaction(id, householdId);
      return res.status(200).json(transaction);
    } catch (error: any) {
      return res.status(404).json({ error: error.message || 'Transação não encontrada.' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params as { id: string };

      const householdId = await getOrCreateHouseholdId(user.id);
      const transaction = await transactionService.updateTransaction(id, householdId, req.body);

      return res.status(200).json(transaction);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao atualizar transação.' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params as { id: string };

      const householdId = await getOrCreateHouseholdId(user.id);
      await transactionService.deleteTransaction(id, householdId);

      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao deletar transação.' });
    }
  }

  async installmentSummary(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const householdId = await resolveHouseholdId(user.id);

      if (!householdId) {
        return res.status(200).json([]);
      }

      const summary = await transactionService.getInstallmentSummary(householdId);
      return res.status(200).json(summary);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao carregar resumo de parcelamento.' });
    }
  }
}
