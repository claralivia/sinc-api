import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import User from '../models/User';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  { realtime: { transport: ws as any } }
);

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const { data, error } = await supabase.auth.getUser(token);
    const supabaseUser = data?.user;

    if (error || !supabaseUser?.email) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const user = await User.findOneAndUpdate(
      { supabaseId: supabaseUser.id },
      {
        $setOnInsert: {
          supabaseId: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.name || supabaseUser.email.split('@')[0],
          role: supabaseUser.user_metadata?.role === 'ADMIN' ? 'ADMIN' : 'USER',
          avatarUrl: supabaseUser.user_metadata?.avatar_url,
        },
      },
      { new: true, upsert: true }
    );

    (req as any).user = {
      id: user._id.toString(),
      supabaseId: user.supabaseId,
      email: user.email,
      name: user.name,
      role: user.role,
      managedUserId: user.managedUserId ? user.managedUserId.toString() : null,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Falha ao autenticar requisição.' });
  }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito a administradores.' });
  }

  return next();
};
