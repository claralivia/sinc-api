import { Request, Response } from 'express';
import { GoalService } from '../services/GoalService';
import { getOrCreateHouseholdId, resolveHouseholdId } from '../services/UserService';

const goalService = new GoalService();

export class GoalController {
  async list(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const householdId = await resolveHouseholdId(user.id);

      if (!householdId) {
        return res.status(200).json([]);
      }

      const goals = await goalService.listGoals(householdId);
      return res.status(200).json(goals);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao listar metas.' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { name, icon, color, targetAmount } = req.body;

      if (!name || !icon || !color || !targetAmount) {
        return res.status(400).json({ error: 'Nome, ícone, cor e valor alvo são obrigatórios.' });
      }

      const householdId = await getOrCreateHouseholdId(user.id);
      const goal = await goalService.createGoal({ name, icon, color, targetAmount, householdId });
      return res.status(201).json(goal);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao criar meta.' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params as { id: string };
      const { name, icon, color, targetAmount } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Meta inválida.' });
      }

      const householdId = await getOrCreateHouseholdId(user.id);
      const goal = await goalService.updateGoal(id, householdId, { name, icon, color, targetAmount });
      return res.status(200).json(goal);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao atualizar meta.' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({ error: 'Meta inválida.' });
      }

      const householdId = await getOrCreateHouseholdId(user.id);
      await goalService.deleteGoal(id, householdId);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao excluir meta.' });
    }
  }

  async contribute(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params as { id: string };
      const { amount } = req.body;

      if (!id || !amount) {
        return res.status(400).json({ error: 'Valor é obrigatório.' });
      }

      const householdId = await getOrCreateHouseholdId(user.id);
      const goal = await goalService.contribute(id, householdId, Number(amount));
      return res.status(200).json(goal);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao movimentar meta.' });
    }
  }
}
