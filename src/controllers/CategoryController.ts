import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService';

const categoryService = new CategoryService();
const categoryTypes = ['INCOME', 'EXPENSE'];

export class CategoryController {
  async list(req: Request, res: Response) {
    try {
      const categories = await categoryService.listCategories();
      return res.status(200).json(categories);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao listar categorias.' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, type, icon, color } = req.body;

      if (!name || !type || !icon || !color) {
        return res.status(400).json({ error: 'Nome, tipo, ícone e cor são obrigatórios.' });
      }

      if (!categoryTypes.includes(type)) {
        return res.status(400).json({ error: 'Tipo de categoria inválido.' });
      }

      const category = await categoryService.createCategory({ name, type: type as 'INCOME' | 'EXPENSE', icon, color });
      return res.status(201).json(category);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao criar categoria.' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const { name, type, icon, color } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Categoria inválida.' });
      }

      if (type && !categoryTypes.includes(type)) {
        return res.status(400).json({ error: 'Tipo de categoria inválido.' });
      }

      const category = await categoryService.updateCategory(id, { name, type: type as 'INCOME' | 'EXPENSE' | undefined, icon, color });
      return res.status(200).json(category);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao atualizar categoria.' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({ error: 'Categoria inválida.' });
      }

      await categoryService.deleteCategory(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao excluir categoria.' });
    }
  }
}
