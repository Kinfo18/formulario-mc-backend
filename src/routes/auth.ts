import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Email y contraseña requeridos' });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.activo) {
    res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    return;
  }

  const token = signToken({
    sub: user.id,
    email: user.email,
    rol: user.rol,
    nombre: user.nombre,
  });

  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
    },
  });
});

// GET /api/auth/me
authRouter.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: req.user });
});
