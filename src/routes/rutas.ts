import { Router, Response, Request } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

type Params = { id: string };
import { Rol } from '../generated/prisma/enums';
import {
  listarRutas,
  obtenerRuta,
  crearRuta,
  actualizarRuta,
  toggleActivaRuta,
  crearRutaSchema,
  actualizarRutaSchema,
} from '../services/rutas.service';

export const rutasRouter = Router();

rutasRouter.use(authenticate);

// GET /api/rutas — ADMIN/OPERACIONES ven todas (activas + inactivas)
rutasRouter.get('/', async (req: AuthRequest, res: Response) => {
  const isManager =
    req.user!.rol === Rol.ADMIN || req.user!.rol === Rol.OPERACIONES;
  const data = await listarRutas(isManager);
  res.json({ success: true, data });
});

// GET /api/rutas/:id — plantilla completa
rutasRouter.get('/:id', async (req: Request<Params> & AuthRequest, res: Response) => {
  const data = await obtenerRuta(req.params.id);
  res.json({ success: true, data });
});

// POST /api/rutas — crear plantilla (solo ADMIN/OPERACIONES)
rutasRouter.post(
  '/',
  requireRole(Rol.ADMIN, Rol.OPERACIONES),
  async (req: AuthRequest, res: Response) => {
    const parsed = crearRutaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        success: false,
        error: 'Datos inválidos',
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }
    const ruta = await crearRuta(parsed.data);
    res.status(201).json({ success: true, data: ruta });
  },
);

// PUT /api/rutas/:id — actualizar plantilla (solo ADMIN/OPERACIONES)
rutasRouter.put(
  '/:id',
  requireRole(Rol.ADMIN, Rol.OPERACIONES),
  async (req: Request<Params> & AuthRequest, res: Response) => {
    const parsed = actualizarRutaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        success: false,
        error: 'Datos inválidos',
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }
    const ruta = await actualizarRuta(req.params.id, parsed.data);
    res.json({ success: true, data: ruta });
  },
);

// PATCH /api/rutas/:id/activa — activar / desactivar (solo ADMIN/OPERACIONES)
rutasRouter.patch(
  '/:id/activa',
  requireRole(Rol.ADMIN, Rol.OPERACIONES),
  async (req: Request<Params> & AuthRequest, res: Response) => {
    const ruta = await toggleActivaRuta(req.params.id);
    res.json({ success: true, data: ruta });
  },
);
