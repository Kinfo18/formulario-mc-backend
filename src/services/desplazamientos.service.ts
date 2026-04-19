import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { parsePagination, buildMeta } from '../lib/pagination';
import {
  EstadoDesplazamiento,
  TipoVehiculo,
  Rol,
} from '../generated/prisma/enums';

// ─── Schemas de validación ────────────────────────────────────────────────────

export const crearDesplazamientoSchema = z.object({
  rutaId: z.string().min(1),
  // Sección 1 — Datos Generales
  motivoDesplazamiento: z.string().min(1).max(1000),
  tiempoAntelacion: z.string().min(1),
  rutaPrincipalNombre: z.string().min(1),
  tiempoTraslado: z.string().min(1),
  recorridoKms: z.number().positive(),
  rutaAlternaNombre: z.string().optional(),
  tiempoTrasladoAlterno: z.string().optional(),
  horaSalida: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm requerido'),
  horaLlegada: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm requerido'),
  novedades: z.string().optional(),
  preoperacionalRealizado: z.boolean().default(false),
  documentacionVerificada: z.boolean().default(false),
  tipoVehiculo: z.nativeEnum(TipoVehiculo),
  transportaProducto: z.boolean().default(false),
  cualProducto: z.string().optional(),
});

export const actualizarDesplazamientoSchema = crearDesplazamientoSchema.partial().omit({ rutaId: true });

export const cambiarEstadoSchema = z.object({
  estado: z.nativeEnum(EstadoDesplazamiento),
  observaciones: z.string().optional(),
});

export const filtrosListadoSchema = z.object({
  estado: z.nativeEnum(EstadoDesplazamiento).optional(),
  rutaId: z.string().optional(),
  conductorId: z.string().optional(),
  tipoVehiculo: z.nativeEnum(TipoVehiculo).optional(),
  q: z.string().max(100).optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generarCodigo(): Promise<string> {
  const año = new Date().getFullYear();
  const count = await prisma.desplazamiento.count();
  const seq = String(count + 1).padStart(4, '0');
  return `DES-${año}-${seq}`;
}

const desplazamientoListSelect = {
  id: true,
  codigo: true,
  estado: true,
  horaSalida: true,
  horaLlegada: true,
  motivoDesplazamiento: true,
  tipoVehiculo: true,
  createdAt: true,
  ruta: { select: { id: true, nombre: true } },
  conductor: { select: { id: true, nombre: true, email: true } },
} as const;

const desplazamientoFullSelect = {
  ...desplazamientoListSelect,
  observaciones: true,
  rutaPrincipalNombre: true,
  tiempoAntelacion: true,
  tiempoTraslado: true,
  recorridoKms: true,
  rutaAlternaNombre: true,
  tiempoTrasladoAlterno: true,
  novedades: true,
  preoperacionalRealizado: true,
  documentacionVerificada: true,
  transportaProducto: true,
  cualProducto: true,
  kmsPavimentados: true,
  kmsDestapados: true,
  kmsTotales: true,
  municipiosAtravesados: true,
  rutasAlternasDescripcion: true,
  recViasDestapadas: true,
  recZonasUrbanas: true,
  recCurvasPeligrosas: true,
  recIntersecciones: true,
  recPuentesFuenteHidrica: true,
  recTramosRectos: true,
  puntosCriticosSeguridad: true,
  planoRutaUrl: true,
  updatedAt: true,
  rutasBloqueadas: { orderBy: { orden: 'asc' as const } },
  limitesVelocidad: { orderBy: { zona: 'asc' as const } },
  sitiosPernocte: { orderBy: { orden: 'asc' as const } },
  puestosControl: { orderBy: { orden: 'asc' as const } },
  puntosCriticos: { orderBy: { orden: 'asc' as const } },
  puntosApoyo: { orderBy: { orden: 'asc' as const } },
  contactosEmergencia: { orderBy: { orden: 'asc' as const } },
  estacionesServicio: { orderBy: { orden: 'asc' as const } },
  firmas: true,
} as const;

// ─── Servicios ────────────────────────────────────────────────────────────────

export async function listarDesplazamientos(
  query: Record<string, unknown>,
  usuarioId: string,
  usuarioRol: Rol,
) {
  const filtros = filtrosListadoSchema.parse(query);
  const { page, limit } = parsePagination(filtros);

  const where: Record<string, unknown> = {};

  // Conductores solo ven los propios
  if (usuarioRol === Rol.CONDUCTOR) {
    where.conductorId = usuarioId;
  } else if (filtros.conductorId) {
    where.conductorId = filtros.conductorId;
  }

  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.rutaId) where.rutaId = filtros.rutaId;
  if (filtros.tipoVehiculo) where.tipoVehiculo = filtros.tipoVehiculo;
  if (filtros.q) where.codigo = { contains: filtros.q, mode: 'insensitive' };

  if (filtros.fechaDesde || filtros.fechaHasta) {
    where.createdAt = {
      ...(filtros.fechaDesde ? { gte: new Date(filtros.fechaDesde) } : {}),
      ...(filtros.fechaHasta ? { lte: new Date(filtros.fechaHasta) } : {}),
    };
  }

  const [total, items] = await Promise.all([
    prisma.desplazamiento.count({ where }),
    prisma.desplazamiento.findMany({
      where,
      select: desplazamientoListSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { data: items, meta: buildMeta(total, { page, limit }) };
}

export async function obtenerDesplazamiento(
  id: string,
  usuarioId: string,
  usuarioRol: Rol,
) {
  const desp = await prisma.desplazamiento.findUnique({
    where: { id },
    select: desplazamientoFullSelect,
  });

  if (!desp) throw new AppError(404, 'Desplazamiento no encontrado');

  // Conductor solo puede ver el propio
  if (usuarioRol === Rol.CONDUCTOR && desp.conductor.id !== usuarioId) {
    throw new AppError(403, 'Acceso denegado');
  }

  return desp;
}

export async function crearDesplazamiento(
  input: z.infer<typeof crearDesplazamientoSchema>,
  conductorId: string,
) {
  // 1. Cargar plantilla con todas sus relaciones
  const plantilla = await prisma.rutaPlantilla.findUnique({
    where: { id: input.rutaId },
    include: {
      rutasBloqueadas: { orderBy: { orden: 'asc' } },
      limitesVelocidad: { orderBy: { zona: 'asc' } },
      sitiosPernocte: { orderBy: { orden: 'asc' } },
      puestosControl: { orderBy: { orden: 'asc' } },
      puntosCriticos: { orderBy: { orden: 'asc' } },
      puntosApoyo: { orderBy: { orden: 'asc' } },
      contactosEmergencia: { orderBy: { orden: 'asc' } },
      estacionesServicio: { orderBy: { orden: 'asc' } },
    },
  });

  if (!plantilla || !plantilla.activa) {
    throw new AppError(404, 'Ruta no encontrada o inactiva');
  }

  const codigo = await generarCodigo();
  const kmsTotales = (plantilla.kmsPavimentados ?? 0) + (plantilla.kmsDestapados ?? 0);

  // 2. Crear desplazamiento copiando datos de la plantilla
  const desp = await prisma.desplazamiento.create({
    data: {
      codigo,
      rutaId: plantilla.id,
      conductorId,

      // Sección 1
      motivoDesplazamiento: input.motivoDesplazamiento,
      tiempoAntelacion: input.tiempoAntelacion,
      rutaPrincipalNombre: input.rutaPrincipalNombre,
      tiempoTraslado: input.tiempoTraslado,
      recorridoKms: input.recorridoKms,
      rutaAlternaNombre: input.rutaAlternaNombre,
      tiempoTrasladoAlterno: input.tiempoTrasladoAlterno,
      horaSalida: input.horaSalida,
      horaLlegada: input.horaLlegada,
      novedades: input.novedades,
      preoperacionalRealizado: input.preoperacionalRealizado,
      documentacionVerificada: input.documentacionVerificada,
      tipoVehiculo: input.tipoVehiculo,
      transportaProducto: input.transportaProducto,
      cualProducto: input.cualProducto,

      // Sección 2 — copiado de plantilla
      kmsPavimentados: plantilla.kmsPavimentados ?? 0,
      kmsDestapados: plantilla.kmsDestapados ?? 0,
      kmsTotales,
      municipiosAtravesados: plantilla.municipiosAtravesados,

      // Sección 3
      rutasAlternasDescripcion: plantilla.rutaAlternaDescripcion,

      // Sección 9
      recViasDestapadas: plantilla.recViasDestapadas,
      recZonasUrbanas: plantilla.recZonasUrbanas,
      recCurvasPeligrosas: plantilla.recCurvasPeligrosas,
      recIntersecciones: plantilla.recIntersecciones,
      recPuentesFuenteHidrica: plantilla.recPuentesFuenteHidrica,
      recTramosRectos: plantilla.recTramosRectos,

      // Sección 13
      puntosCriticosSeguridad: plantilla.puntosCriticosSeguridad,

      // Sección 14
      planoRutaUrl: plantilla.planoRutaUrl,

      // Tablas relacionadas — copia desde plantilla
      rutasBloqueadas: {
        create: plantilla.rutasBloqueadas.map(({ descripcion, orden }) => ({
          descripcion,
          orden,
        })),
      },
      limitesVelocidad: {
        create: plantilla.limitesVelocidad.map(
          ({ zona, kmPermitido, velocidadCargado, velocidadDescargado, requisito }) => ({
            zona,
            kmPermitido,
            velocidadCargado,
            velocidadDescargado,
            requisito,
          }),
        ),
      },
      sitiosPernocte: {
        create: plantilla.sitiosPernocte.map(({ km, nombre, municipio, servicios, orden }) => ({
          km,
          nombre,
          municipio,
          servicios,
          orden,
        })),
      },
      puestosControl: {
        create: plantilla.puestosControl.map(({ km, nombre, municipio, servicios, orden }) => ({
          km,
          nombre,
          municipio,
          servicios,
          orden,
        })),
      },
      puntosCriticos: {
        create: plantilla.puntosCriticos.map(
          ({ kmDesde, kmHasta, sentido, descripcion, orden }) => ({
            kmDesde,
            kmHasta,
            sentido,
            descripcion,
            orden,
          }),
        ),
      },
      puntosApoyo: {
        create: plantilla.puntosApoyo.map(
          ({ entidad, ubicacion, telefono, equiposDisponibles, pd, responsable, orden }) => ({
            entidad,
            ubicacion,
            telefono,
            equiposDisponibles,
            pd,
            responsable,
            orden,
          }),
        ),
      },
      contactosEmergencia: {
        create: plantilla.contactosEmergencia.map(({ entidad, area, telefono, orden }) => ({
          entidad,
          area,
          telefono,
          orden,
        })),
      },
      estacionesServicio: {
        create: plantilla.estacionesServicio.map(({ entidad, area, telefono, orden }) => ({
          entidad,
          area,
          telefono,
          orden,
        })),
      },
    },
    select: { id: true, codigo: true, estado: true, createdAt: true },
  });

  return desp;
}

export async function actualizarDesplazamiento(
  id: string,
  input: z.infer<typeof actualizarDesplazamientoSchema>,
  usuarioId: string,
  usuarioRol: Rol,
) {
  const desp = await prisma.desplazamiento.findUnique({
    where: { id },
    select: { conductorId: true, estado: true },
  });

  if (!desp) throw new AppError(404, 'Desplazamiento no encontrado');

  if (usuarioRol === Rol.CONDUCTOR) {
    if (desp.conductorId !== usuarioId) throw new AppError(403, 'Acceso denegado');
    if (desp.estado !== EstadoDesplazamiento.BORRADOR) {
      throw new AppError(409, 'Solo se pueden editar desplazamientos en estado BORRADOR');
    }
  }

  const updated = await prisma.desplazamiento.update({
    where: { id },
    data: input,
    select: desplazamientoListSelect,
  });

  return updated;
}

type Transicion = EstadoDesplazamiento;

const TRANSICIONES_CONDUCTOR: Partial<Record<Transicion, Transicion[]>> = {
  [EstadoDesplazamiento.BORRADOR]: [EstadoDesplazamiento.EN_REVISION],
};

const TRANSICIONES_OPERACIONES: Partial<Record<Transicion, Transicion[]>> = {
  [EstadoDesplazamiento.BORRADOR]: [EstadoDesplazamiento.EN_REVISION],
  [EstadoDesplazamiento.EN_REVISION]: [
    EstadoDesplazamiento.APROBADO,
    EstadoDesplazamiento.RECHAZADO,
    EstadoDesplazamiento.BORRADOR,
  ],
  [EstadoDesplazamiento.RECHAZADO]: [
    EstadoDesplazamiento.BORRADOR,
    EstadoDesplazamiento.ARCHIVADO,
  ],
  [EstadoDesplazamiento.APROBADO]: [EstadoDesplazamiento.ARCHIVADO],
};

export async function cambiarEstadoDesplazamiento(
  id: string,
  input: z.infer<typeof cambiarEstadoSchema>,
  usuarioId: string,
  usuarioRol: Rol,
) {
  const desp = await prisma.desplazamiento.findUnique({
    where: { id },
    select: { id: true, estado: true, conductorId: true },
  });

  if (!desp) throw new AppError(404, 'Desplazamiento no encontrado');

  const mapa =
    usuarioRol === Rol.CONDUCTOR ? TRANSICIONES_CONDUCTOR : TRANSICIONES_OPERACIONES;

  if (usuarioRol === Rol.CONDUCTOR && desp.conductorId !== usuarioId) {
    throw new AppError(403, 'Acceso denegado');
  }

  const permitidos = mapa[desp.estado] ?? [];
  if (!permitidos.includes(input.estado)) {
    throw new AppError(
      409,
      `Transición no permitida: ${desp.estado} → ${input.estado}`,
    );
  }

  const updated = await prisma.desplazamiento.update({
    where: { id },
    data: {
      estado: input.estado,
      ...(input.observaciones !== undefined && { observaciones: input.observaciones }),
    },
    select: { id: true, codigo: true, estado: true, observaciones: true },
  });

  return updated;
}

export async function eliminarDesplazamiento(
  id: string,
  usuarioRol: Rol,
) {
  if (usuarioRol === Rol.CONDUCTOR) {
    throw new AppError(403, 'Permisos insuficientes');
  }

  const desp = await prisma.desplazamiento.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!desp) throw new AppError(404, 'Desplazamiento no encontrado');

  // Archiva en vez de eliminar físicamente
  await prisma.desplazamiento.update({
    where: { id },
    data: { estado: EstadoDesplazamiento.ARCHIVADO },
  });
}

// ─── Exportación CSV ──────────────────────────────────────────────────────────

const TIPO_VEHICULO_LABEL: Record<string, string> = {
  CARGA_PESADA: 'Carga pesada',
  TRANSPORTE_PERSONAL: 'Transporte personal',
  MOTO: 'Moto',
  TRANSPORTE_PUBLICO: 'Transporte público',
};

const ESTADO_LABEL: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  ARCHIVADO: 'Archivado',
};

function csvCell(value: string | null | undefined): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportarDesplazamientos(
  query: Record<string, unknown>,
  usuarioId: string,
  usuarioRol: Rol,
): Promise<string> {
  const filtros = filtrosListadoSchema.parse(query);

  const where: Record<string, unknown> = {};

  if (usuarioRol === Rol.CONDUCTOR) {
    where.conductorId = usuarioId;
  } else if (filtros.conductorId) {
    where.conductorId = filtros.conductorId;
  }

  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.rutaId) where.rutaId = filtros.rutaId;
  if (filtros.tipoVehiculo) where.tipoVehiculo = filtros.tipoVehiculo;
  if (filtros.q) where.codigo = { contains: filtros.q, mode: 'insensitive' };

  if (filtros.fechaDesde || filtros.fechaHasta) {
    where.createdAt = {
      ...(filtros.fechaDesde ? { gte: new Date(filtros.fechaDesde) } : {}),
      ...(filtros.fechaHasta ? { lte: new Date(filtros.fechaHasta) } : {}),
    };
  }

  const items = await prisma.desplazamiento.findMany({
    where,
    select: {
      codigo: true,
      estado: true,
      tipoVehiculo: true,
      motivoDesplazamiento: true,
      horaSalida: true,
      horaLlegada: true,
      createdAt: true,
      ruta: { select: { nombre: true } },
      conductor: { select: { nombre: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  const header = [
    'Código',
    'Estado',
    'Conductor',
    'Email conductor',
    'Ruta',
    'Tipo vehículo',
    'Hora salida',
    'Hora llegada',
    'Motivo',
    'Fecha creación',
  ].join(',');

  const rows = items.map((d) =>
    [
      csvCell(d.codigo),
      csvCell(ESTADO_LABEL[d.estado] ?? d.estado),
      csvCell(d.conductor.nombre),
      csvCell(d.conductor.email),
      csvCell(d.ruta.nombre),
      csvCell(TIPO_VEHICULO_LABEL[d.tipoVehiculo] ?? d.tipoVehiculo),
      csvCell(d.horaSalida),
      csvCell(d.horaLlegada),
      csvCell(d.motivoDesplazamiento),
      csvCell(d.createdAt.toISOString().split('T')[0]),
    ].join(','),
  );

  return [header, ...rows].join('\r\n');
}
