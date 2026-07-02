import { Request, Response } from 'express';
import { GoalService } from '../services/GoalService';

const goalService = new GoalService();

export class GoalController {
  async list(req: Request, res: Response) {
    try {
      const goals = await goalService.listGoals();
      return res.status(200).json(goals);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao listar metas.' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, icon, color, targetAmount } = req.body;

      if (!name || !icon || !color || !targetAmount) {
        return res.status(400).json({ error: 'Nome, ícone, cor e valor alvo são obrigatórios.' });
      }

      const goal = await goalService.createGoal({ name, icon, color, targetAmount });
      return res.status(201).json(goal);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao criar meta.' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const { name, icon, color, targetAmount } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Meta inválida.' });
      }

      const goal = await goalService.updateGoal(id, { name, icon, color, targetAmount });
      return res.status(200).json(goal);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao atualizar meta.' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({ error: 'Meta inválida.' });
      }

      await goalService.deleteGoal(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao excluir meta.' });
    }
  }

  async contribute(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const { amount } = req.body;

      if (!id || !amount) {
        return res.status(400).json({ error: 'Valor é obrigatório.' });
      }

      const goal = await goalService.contribute(id, Number(amount));
      return res.status(200).json(goal);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao movimentar meta.' });
    }
  }
}
