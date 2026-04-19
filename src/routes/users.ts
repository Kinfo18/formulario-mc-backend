import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { AppError } from '../lib/errors';
import { Rol } from '../generated/prisma/enums';

export const usersRouter = Router();

type Params = { id: string };

usersRouter.use(authenticate);
usersRouter.use(requireRole(Rol.ADMIN));

const crearUsuarioSchema = z.object({
  nombre: z.string().min(1).max(200),
  email: z.string().email().max(254).toLowerCase(),
  password: z.string().min(8).max(128),
  rol: z.nativeEnum(Rol),
});

const editarUsuarioSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  email: z.string().email().max(254).toLowerCase().optional(),
  password: z.string().min(8).max(128).optional(),
  rol: z.nativeEnum(Rol).optional(),
});

const userSelect = {
  id: true,
  email: true,
  nombre: true,
  rol: true,
  activo: true,
  createdAt: true,
  _count: { select: { desplazamientos: true } },
} as const;

// GET /api/admin/usuarios
usersRouter.get('/', async (_req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, data: users });
});

// GET /api/admin/stats
usersRouter.get('/stats', async (_req: AuthRequest, res: Response) => {
  const [usersByRol, despByEstado, despUltimos7dias] = await Promise.all([
    prisma.user.groupBy({ by: ['rol'], _count: { id: true } }),
    prisma.desplazamiento.groupBy({ by: ['estado'], _count: { id: true } }),
    prisma.desplazamiento.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  res.json({
    success: true,
    data: { usersByRol, despByEstado, despUltimos7dias },
  });
});

// GET /api/admin/usuarios/:id
usersRouter.get('/:id', async (req: Request<Params> & AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: userSelect,
  });
  if (!user) throw new AppError(404, 'Usuario no encontrado');
  res.json({ success: true, data: user });
});

// POST /api/admin/usuarios
usersRouter.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = crearUsuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({
      success: false,
      error: 'Datos inválidos',
      details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    res.status(409).json({ success: false, error: 'Ya existe un usuario con ese email' });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      nombre: parsed.data.nombre,
      email: parsed.data.email,
      password: passwordHash,
      rol: parsed.data.rol,
    },
    select: userSelect,
  });

  res.status(201).json({ success: true, data: user });
});

// PUT /api/admin/usuarios/:id
usersRouter.put('/:id', async (req: Request<Params> & AuthRequest, res: Response) => {
  const parsed = editarUsuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(422).json({
      success: false,
      error: 'Datos inválidos',
      details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
    return;
  }

  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) throw new AppError(404, 'Usuario no encontrado');

  if (parsed.data.email && parsed.data.email !== target.email) {
    const conflict = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (conflict) {
      res.status(409).json({ success: false, error: 'Ya existe un usuario con ese email' });
      return;
    }
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.nombre) data.nombre = parsed.data.nombre;
  if (parsed.data.email) data.email = parsed.data.email;
  if (parsed.data.rol) data.rol = parsed.data.rol;
  if (parsed.data.password) data.password = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: userSelect,
  });

  res.json({ success: true, data: user });
});

// PATCH /api/admin/usuarios/:id/estado
usersRouter.patch(
  '/:id/estado',
  async (req: Request<Params> & AuthRequest, res: Response) => {
    if (req.params.id === req.user!.sub) {
      res.status(400).json({ success: false, error: 'No puedes desactivar tu propia cuenta' });
      return;
    }

    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) throw new AppError(404, 'Usuario no encontrado');

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { activo: !target.activo },
      select: userSelect,
    });

    res.json({ success: true, data: user });
  },
);
