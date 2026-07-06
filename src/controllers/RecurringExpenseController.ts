import { Request, Response } from 'express';
import { RecurringExpenseService } from '../services/RecurringExpenseService';
import { getOrCreateHouseholdId, resolveHouseholdId, resolveOwnerId } from '../services/UserService';

const recurringExpenseService = new RecurringExpenseService();

export class RecurringExpenseController {
  async list(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { startDate, endDate } = req.query;

      const householdId = await resolveHouseholdId(user.id);

      if (!householdId) {
        return res.status(200).json([]);
      }

      if (startDate && endDate) {
        const list = await recurringExpenseService.listWithStatus(startDate as string, endDate as string, householdId);
        return res.status(200).json(list);
      }

      const recurringExpenses = await recurringExpenseService.listRecurringExpenses(householdId);
      return res.status(200).json(recurringExpenses);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao listar gastos fixos.' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { description, amount, categoryId, paymentMethod, cardId, splitType, owedBy, customSplitPercentage, dueDay } = req.body;

      if (!description || !amount || !categoryId || !paymentMethod || !splitType || !dueDay) {
        return res.status(400).json({ error: 'Descrição, valor, categoria, pagamento, divisão e dia de vencimento são obrigatórios.' });
      }

      const householdId = await getOrCreateHouseholdId(user.id);
      const recurringExpense = await recurringExpenseService.createRecurringExpense({
        description,
        amount,
        categoryId,
        paymentMethod,
        cardId,
        splitType,
        owedBy,
        customSplitPercentage,
        dueDay,
        householdId,
      });

      return res.status(201).json(recurringExpense);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao criar gasto fixo.' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({ error: 'Gasto fixo inválido.' });
      }

      const householdId = await getOrCreateHouseholdId(user.id);
      const recurringExpense = await recurringExpenseService.updateRecurringExpense(id, householdId, req.body);
      return res.status(200).json(recurringExpense);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao atualizar gasto fixo.' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({ error: 'Gasto fixo inválido.' });
      }

      const householdId = await getOrCreateHouseholdId(user.id);
      await recurringExpenseService.deleteRecurringExpense(id, householdId);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao excluir gasto fixo.' });
    }
  }

  async launch(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const user = (req as any).user;

      if (!id) {
        return res.status(400).json({ error: 'Gasto fixo inválido.' });
      }

      const householdId = await getOrCreateHouseholdId(user.id);
      const transaction = await recurringExpenseService.launch(id, resolveOwnerId(user), new Date(), householdId);
      return res.status(201).json(transaction);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao lançar gasto fixo.' });
    }
  }
}
