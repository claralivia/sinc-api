import { Request, Response } from 'express';
import { AIService } from '../services/AIService';

const aiService = new AIService();

export const processNaturalLanguage = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Texto é obrigatório.' });
    }

    const parsedTransaction = await aiService.parseFinancialText(text);
    
    return res.json(parsedTransaction);
  } catch (error) {
    console.error('Erro ao processar linguagem natural:', error);
    return res.status(500).json({ error: 'Falha ao processar linguagem natural' });
  }
};
