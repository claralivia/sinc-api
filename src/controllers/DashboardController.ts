import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';

const dashboardService = new DashboardService();

export class DashboardController {
  async getSummary(req: Request, res: Response) {
    try {
      const { startDate, endDate, userId } = req.query;

      if (!startDate || !endDate || !userId) {
        return res.status(400).json({ error: 'Parâmetros startDate, endDate e userId são obrigatórios.' });
      }

      const summary = await dashboardService.getMonthlySummary(
        startDate as string, 
        endDate as string, 
        userId as string
      );

      return res.status(200).json(summary);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao carregar o dashboard.' });
    }
  }
}
