import { Request, Response } from 'express';
import { CardService } from '../services/CardService';
import { getOrCreateHouseholdId, resolveHouseholdId } from '../services/UserService';

const cardService = new CardService();

export class CardController {
  async list(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const householdId = await resolveHouseholdId(user.id);

      if (!householdId) {
        return res.status(200).json([]);
      }

      const cards = await cardService.listCards(householdId);
      return res.status(200).json(cards);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao listar cartões.' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { name, brand, logoUrl, color, limit, closingDay, dueDay } = req.body;

      if (!name || !brand || !color || !limit || !closingDay || !dueDay) {
        return res.status(400).json({ error: 'Nome, bandeira, cor, limite, dia de fechamento e vencimento são obrigatórios.' });
      }

      const householdId = await getOrCreateHouseholdId(user.id);
      const card = await cardService.createCard({ name, brand, logoUrl, color, limit, closingDay, dueDay, householdId });
      return res.status(201).json(card);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao criar cartão.' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params as { id: string };
      const { name, brand, logoUrl, color, limit, closingDay, dueDay } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Cartão inválido.' });
      }

      const householdId = await getOrCreateHouseholdId(user.id);
      const card = await cardService.updateCard(id, householdId, { name, brand, logoUrl, color, limit, closingDay, dueDay });
      return res.status(200).json(card);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao atualizar cartão.' });
    }
  }

  async markInvoiceAsPaid(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params as { id: string };
      const { month } = req.body as { month: string };

      if (!id || !month) {
        return res.status(400).json({ error: 'Cartão e mês (YYYY-MM) são obrigatórios.' });
      }

      const householdId = await getOrCreateHouseholdId(user.id);
      const result = await cardService.markInvoiceAsPaid(id, householdId, month);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao marcar fatura como paga.' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({ error: 'Cartão inválido.' });
      }

      const householdId = await getOrCreateHouseholdId(user.id);
      await cardService.deleteCard(id, householdId);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao excluir cartão.' });
    }
  }
}
