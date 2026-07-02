import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

const userService = new UserService();

export class UserController {
  async me(req: Request, res: Response) {
    return res.status(200).json((req as any).user);
  }

  async list(req: Request, res: Response) {
    try {
      const users = await userService.listUsers();
      return res.status(200).json(users);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao listar usuários.' });
    }
  }

  async partners(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const partners = await userService.listPartners(user.id);
      return res.status(200).json(partners);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao listar parceiros.' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      const { name, role, phone, avatarUrl } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Usuário inválido.' });
      }

      if (role && !['ADMIN', 'USER'].includes(role)) {
        return res.status(400).json({ error: 'Perfil inválido.' });
      }

      const user = await userService.updateUser(id, { name, role, phone, avatarUrl });
      return res.status(200).json(user);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao atualizar usuário.' });
    }
  }
}
