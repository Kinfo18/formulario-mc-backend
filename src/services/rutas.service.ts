import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { VarianteLimiteVelocidad, ZonaVelocidad, Rol } from '../generated/prisma/enums';

// ─── Selección completa de una plantilla ────────────────────────────────────

const rutaFullSelect = {
  id: true,
  nombre: true,
  descripcion: true,
  varianteLimiteVelocidad: true,
  activa: true,
  planoRutaUrl: true,
  kmsPavimentados: true,
  kmsDestapados: true,
  municipiosAtravesados: true,
  rutaAlternaDescripcion: true,
  recViasDestapadas: true,
  recZonasUrbanas: true,
  recCurvasPeligrosas: true,
  recIntersecciones: true,
  recPuentesFuenteHidrica: true,
  recTramosRectos: true,
  puntosCriticosSeguridad: true,
  rutasBloqueadas: { orderBy: { orden: 'asc' as const } },
  limitesVelocidad: { orderBy: { zona: 'asc' as const } },
  sitiosPernocte: { orderBy: { orden: 'asc' as const } },
  puestosControl: { orderBy: { orden: 'asc' as const } },
  puntosCriticos: { orderBy: { orden: 'asc' as const } },
  puntosApoyo: { orderBy: { orden: 'asc' as const } },
  contactosEmergencia: { orderBy: { orden: 'asc' as const } },
  estacionesServicio: { orderBy: { orden: 'asc' as const } },
} as const;

// ─── Schemas de validación ───────────────────────────────────────────────────

const limiteVelocidadSchema = z.object({
  zona: z.nativeEnum(ZonaVelocidad),
  kmPermitido: z.coerce.number().optional(),
  velocidadCargado: z.coerce.number().optional(),
  velocidadDescargado: z.coerce.number().optional(),
  requisito: z.string().optional(),
});

export const crearRutaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  descripcion: z.string().optional(),
  varianteLimiteVelocidad: z.nativeEnum(VarianteLimiteVelocidad).default(VarianteLimiteVelocidad.DUAL),
  kmsPavimentados: z.coerce.number().optional(),
  kmsDestapados: z.coerce.number().optional(),
  municipiosAtravesados: z.string().optional(),
  rutaAlternaDescripcion: z.string().optional(),
  recViasDestapadas: z.string().optional(),
  recZonasUrbanas: z.string().optional(),
  recCurvasPeligrosas: z.string().optional(),
  recIntersecciones: z.string().optional(),
  recPuentesFuenteHidrica: z.string().optional(),
  recTramosRectos: z.string().optional(),
  puntosCriticosSeguridad: z.string().optional(),
  limitesVelocidad: z.array(limiteVelocidadSchema).optional(),
});

export const actualizarRutaSchema = crearRutaSchema.partial();

// ─── Servicios ───────────────────────────────────────────────────────────────

export async function listarRutas(incluirInactivas = false) {
  return prisma.rutaPlantilla.findMany({
    where: incluirInactivas ? {} : { activa: true },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      varianteLimiteVelocidad: true,
      activa: true,
      kmsPavimentados: true,
      kmsDestapados: true,
    },
    orderBy: { nombre: 'asc' },
  });
}

export async function obtenerRuta(id: string) {
  const ruta = await prisma.rutaPlantilla.findUnique({
    where: { id },
    select: rutaFullSelect,
  });

  if (!ruta) throw new AppError(404, 'Ruta no encontrada');
  return ruta;
}

export async function crearRuta(input: z.infer<typeof crearRutaSchema>) {
  const { limitesVelocidad, ...datos } = input;

  const ruta = await prisma.rutaPlantilla.create({
    data: {
      ...datos,
      ...(limitesVelocidad && limitesVelocidad.length > 0
        ? { limitesVelocidad: { create: limitesVelocidad } }
        : {}),
    },
    select: { id: true },
  });

  return ruta;
}

export async function actualizarRuta(
  id: string,
  input: z.infer<typeof actualizarRutaSchema>,
) {
  const exists = await prisma.rutaPlantilla.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) throw new AppError(404, 'Ruta no encontrada');

  const { limitesVelocidad, ...datos } = input;

  await prisma.rutaPlantilla.update({ where: { id }, data: datos });

  if (limitesVelocidad !== undefined) {
    await prisma.limiteVelocidadPlantilla.deleteMany({ where: { rutaId: id } });
    if (limitesVelocidad.length > 0) {
      await prisma.limiteVelocidadPlantilla.createMany({
        data: limitesVelocidad.map((lv) => ({ ...lv, rutaId: id })),
      });
    }
  }

  return obtenerRuta(id);
}

export async function toggleActivaRuta(id: string) {
  const ruta = await prisma.rutaPlantilla.findUnique({
    where: { id },
    select: { activa: true },
  });
  if (!ruta) throw new AppError(404, 'Ruta no encontrada');

  return prisma.rutaPlantilla.update({
    where: { id },
    data: { activa: !ruta.activa },
    select: { id: true, activa: true },
  });
}
