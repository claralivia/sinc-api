import { Request, Response } from 'express';
import { CardService } from '../services/CardService';

const cardService = new CardService();

export class CardController {
  async list(req: Request, res: Response) {
    try {
      const cards = await cardService.listCards();
      return res.status(200).json(cards);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao listar cartões.' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, brand, logoUrl, color, limit, closingDay, dueDay } = req.body;

      if (!name || !brand || !color || !limit || !closingDay || !dueDay) {
        return res.status(400).json({ error: 'Nome, bandeira, cor, limite, dia de fechamento e vencimento são obrigatórios.' });
      }

      const card = await cardService.createCard({ name, brand, logoUrl, color, limit, closingDay, dueDay });
      return res.status(201).json(card);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao criar cartão.' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const { name, brand, logoUrl, color, limit, closingDay, dueDay } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Cartão inválido.' });
      }

      const card = await cardService.updateCard(id, { name, brand, logoUrl, color, limit, closingDay, dueDay });
      return res.status(200).json(card);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao atualizar cartão.' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({ error: 'Cartão inválido.' });
      }

      await cardService.deleteCard(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao excluir cartão.' });
    }
  }
}
