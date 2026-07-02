import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService';

const categoryService = new CategoryService();

export class CategoryController {
  async list(req: Request, res: Response) {
    try {
      const categories = await categoryService.listCategories();
      return res.status(200).json(categories);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao listar categorias.' });
    }
  }
}
