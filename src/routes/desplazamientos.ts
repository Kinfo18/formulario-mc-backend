import { Router, Response, Request } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

type Params = { id: string };
import { Rol } from '../generated/prisma/enums';
import {
  listarDesplazamientos,
  obtenerDesplazamiento,
  crearDesplazamiento,
  actualizarDesplazamiento,
  cambiarEstadoDesplazamiento,
  eliminarDesplazamiento,
  exportarDesplazamientos,
  crearDesplazamientoSchema,
  actualizarDesplazamientoSchema,
  cambiarEstadoSchema,
} from '../services/desplazamientos.service';
import { generarPdfDesplazamiento, generarPdfsZip } from '../services/pdf.service';
import { AppError } from '../lib/errors';

export const desplazamientosRouter = Router();

desplazamientosRouter.use(authenticate);

// GET /api/desplazamientos
desplazamientosRouter.get('/', async (req: AuthRequest, res: Response) => {
  const result = await listarDesplazamientos(
    req.query as Record<string, unknown>,
    req.user!.sub,
    req.user!.rol,
  );
  res.json({ success: true, ...result });
});

// POST /api/desplazamientos
desplazamientosRouter.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = crearDesplazamientoSchema.safeParse(req.body);
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

  const desp = await crearDesplazamiento(parsed.data, req.user!.sub);
  res.status(201).json({ success: true, data: desp });
});

// GET /api/desplazamientos/export — solo OPERACIONES y ADMIN
desplazamientosRouter.get(
  '/export',
  requireRole(Rol.OPERACIONES, Rol.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const csv = await exportarDesplazamientos(
      req.query as Record<string, unknown>,
      req.user!.sub,
      req.user!.rol,
    );
    const fecha = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="desplazamientos-${fecha}.csv"`,
    });
    res.send('\uFEFF' + csv);
  },
);

// POST /api/desplazamientos/pdf/bulk — solo OPERACIONES y ADMIN
desplazamientosRouter.post(
  '/pdf/bulk',
  requireRole(Rol.OPERACIONES, Rol.ADMIN),
  async (req: AuthRequest, res: Response) => {
    const { ids } = req.body as { ids?: unknown };

    if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
      res.status(422).json({ success: false, error: 'ids debe ser un array de strings' });
      return;
    }

    const zipBuffer = await generarPdfsZip(ids as string[], req.user!.sub, req.user!.rol);
    const fecha = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="desplazamientos-${fecha}.zip"`,
      'Content-Length': String(zipBuffer.length),
    });
    res.send(zipBuffer);
  },
);

// GET /api/desplazamientos/:id/pdf — todos los roles (el servicio valida propiedad para CONDUCTOR)
desplazamientosRouter.get(
  '/:id/pdf',
  async (req: Request<Params> & AuthRequest, res: Response) => {
    const { buffer, codigo } = await generarPdfDesplazamiento(req.params.id, req.user!.sub, req.user!.rol);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="FOR-SSTA-218-${codigo}.pdf"`,
      'Content-Length': String(buffer.length),
    });
    res.send(buffer);
  },
);

// GET /api/desplazamientos/:id
desplazamientosRouter.get('/:id', async (req: Request<Params> & AuthRequest, res: Response) => {
  const desp = await obtenerDesplazamiento(req.params.id, req.user!.sub, req.user!.rol);
  res.json({ success: true, data: desp });
});

// PUT /api/desplazamientos/:id
desplazamientosRouter.put('/:id', async (req: Request<Params> & AuthRequest, res: Response) => {
  const parsed = actualizarDesplazamientoSchema.safeParse(req.body);
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

  const desp = await actualizarDesplazamiento(
    req.params.id,
    parsed.data,
    req.user!.sub,
    req.user!.rol,
  );
  res.json({ success: true, data: desp });
});

// PATCH /api/desplazamientos/:id/estado — cualquier rol autenticado (transiciones validadas en servicio)
desplazamientosRouter.patch(
  '/:id/estado',
  async (req: Request<Params> & AuthRequest, res: Response) => {
    const parsed = cambiarEstadoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        success: false,
        error: 'Estado inválido',
        details: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }

    const desp = await cambiarEstadoDesplazamiento(
      req.params.id,
      parsed.data,
      req.user!.sub,
      req.user!.rol,
    );
    res.json({ success: true, data: desp });
  },
);

// DELETE /api/desplazamientos/:id — solo OPERACIONES y ADMIN (archiva)
desplazamientosRouter.delete(
  '/:id',
  requireRole(Rol.OPERACIONES, Rol.ADMIN),
  async (req: Request<Params> & AuthRequest, res: Response) => {
    await eliminarDesplazamiento(req.params.id, req.user!.rol);
    res.status(204).send();
  },
);
