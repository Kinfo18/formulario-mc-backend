import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { Rol } from '../generated/prisma/enums';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos, intente más tarde' },
});

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

// POST /api/auth/login
authRouter.post('/login', loginLimiter, async (req: Request, res: Response) => {
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
  const { sub, email, rol, nombre } = req.user!;
  res.json({ success: true, data: { id: sub, email, rol, nombre } });
});

// GET /api/auth/conductores — solo OPERACIONES y ADMIN
authRouter.get(
  '/conductores',
  authenticate,
  requireRole(Rol.OPERACIONES, Rol.ADMIN),
  async (_req: AuthRequest, res: Response) => {
    const conductores = await prisma.user.findMany({
      where: { rol: Rol.CONDUCTOR, activo: true },
      select: { id: true, nombre: true, email: true },
      orderBy: { nombre: 'asc' },
    });
    res.json({ success: true, data: conductores });
  },
);
