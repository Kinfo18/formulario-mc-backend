import JSZip from 'jszip';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { Rol } from '../generated/prisma/enums';
import { generarBuffer } from '../pdf/generate';
import type { DesplazamientoPdfData } from '../pdf/types';

const desplazamientoPdfSelect = {
  id: true,
  codigo: true,
  estado: true,
  createdAt: true,
  motivoDesplazamiento: true,
  tiempoAntelacion: true,
  rutaPrincipalNombre: true,
  tiempoTraslado: true,
  recorridoKms: true,
  rutaAlternaNombre: true,
  tiempoTrasladoAlterno: true,
  horaSalida: true,
  horaLlegada: true,
  novedades: true,
  preoperacionalRealizado: true,
  documentacionVerificada: true,
  tipoVehiculo: true,
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
  ruta: {
    select: {
      id: true,
      nombre: true,
      varianteLimiteVelocidad: true,
    },
  },
  conductor: {
    select: { id: true, nombre: true, email: true },
  },
  rutasBloqueadas: { orderBy: { orden: 'asc' as const } },
  limitesVelocidad: { orderBy: { zona: 'asc' as const } },
  sitiosPernocte: { orderBy: { orden: 'asc' as const } },
  puestosControl: { orderBy: { orden: 'asc' as const } },
  puntosCriticos: { orderBy: { orden: 'asc' as const } },
  puntosApoyo: { orderBy: { orden: 'asc' as const } },
  contactosEmergencia: { orderBy: { orden: 'asc' as const } },
  estacionesServicio: { orderBy: { orden: 'asc' as const } },
  firmas: {
    select: { tipo: true, dataUrl: true },
  },
} as const;

const SUPABASE_STORAGE_HOSTNAME = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).hostname
  : null;

function sanitizarUrlPlano(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;
    if (SUPABASE_STORAGE_HOSTNAME && parsed.hostname !== SUPABASE_STORAGE_HOSTNAME) return null;
    return url;
  } catch {
    return null;
  }
}

export async function generarPdfDesplazamiento(
  id: string,
  usuarioId: string,
  usuarioRol: Rol,
): Promise<{ buffer: Buffer; codigo: string }> {
  const desp = await prisma.desplazamiento.findUnique({
    where: { id },
    select: desplazamientoPdfSelect,
  });

  if (!desp) throw new AppError(404, 'Desplazamiento no encontrado');

  if (usuarioRol === Rol.CONDUCTOR && desp.conductor.id !== usuarioId) {
    throw new AppError(403, 'Acceso denegado');
  }

  const data: DesplazamientoPdfData = {
    ...desp,
    planoRutaUrl: sanitizarUrlPlano(desp.planoRutaUrl),
    firmas: desp.firmas.map((f) => ({ tipo: String(f.tipo), dataUrl: f.dataUrl })),
    ruta: {
      nombre: desp.ruta.nombre,
      varianteLimiteVelocidad: desp.ruta.varianteLimiteVelocidad,
    },
  };

  const buffer = await generarBuffer(data);
  return { buffer, codigo: desp.codigo };
}

const BULK_MAX = 50;

export async function generarPdfsZip(
  ids: string[],
  usuarioId: string,
  usuarioRol: Rol,
): Promise<Buffer> {
  if (ids.length === 0) throw new AppError(422, 'Se debe indicar al menos un desplazamiento');
  if (ids.length > BULK_MAX) throw new AppError(422, `Máximo ${BULK_MAX} desplazamientos por descarga`);

  const zip = new JSZip();

  await Promise.all(
    ids.map(async (id) => {
      try {
        const { buffer, codigo } = await generarPdfDesplazamiento(id, usuarioId, usuarioRol);
        zip.file(`FOR-SSTA-218-${codigo}.pdf`, buffer);
      } catch {
        // Omitir IDs inaccesibles sin abortar el ZIP completo
      }
    }),
  );

  if (Object.keys(zip.files).length === 0) {
    throw new AppError(404, 'Ninguno de los desplazamientos indicados es accesible');
  }

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }) as Promise<Buffer>;
}
