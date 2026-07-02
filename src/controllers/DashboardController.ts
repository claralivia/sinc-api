import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';

const dashboardService = new DashboardService();

export class DashboardController {
  async getSummary(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const user = (req as any).user;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Parâmetros startDate e endDate são obrigatórios.' });
      }

      const summary = await dashboardService.getMonthlySummary(
        startDate as string, 
        endDate as string, 
        user.id
      );

      return res.status(200).json(summary);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao carregar o dashboard.' });
    }
  }
}
