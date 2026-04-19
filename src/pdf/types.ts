import type { VarianteLimiteVelocidad } from '../generated/prisma/enums';

export interface FirmaPdf {
  tipo: string;
  dataUrl: string;
}

export interface LimiteVelocidadPdf {
  zona: string;
  kmPermitido: number | null;
  velocidadCargado: number | null;
  velocidadDescargado: number | null;
  requisito: string | null;
}

export interface DesplazamientoPdfData {
  id: string;
  codigo: string;
  estado: string;
  createdAt: Date;
  conductor: { nombre: string; email: string };
  ruta: { nombre: string; varianteLimiteVelocidad: VarianteLimiteVelocidad };

  motivoDesplazamiento: string;
  tiempoAntelacion: string;
  rutaPrincipalNombre: string;
  tiempoTraslado: string;
  recorridoKms: number;
  horaSalida: string;
  horaLlegada: string;
  tipoVehiculo: string;
  preoperacionalRealizado: boolean;
  documentacionVerificada: boolean;
  transportaProducto: boolean;
  cualProducto: string | null;
  novedades: string | null;

  kmsPavimentados: number | null;
  kmsDestapados: number | null;
  kmsTotales: number | null;
  municipiosAtravesados: string | null;

  rutaAlternaNombre: string | null;
  tiempoTrasladoAlterno: string | null;
  rutasAlternasDescripcion: string | null;

  rutasBloqueadas: Array<{ descripcion: string }>;
  limitesVelocidad: LimiteVelocidadPdf[];
  sitiosPernocte: Array<{ km: number | null; nombre: string; municipio: string | null; servicios: string | null }>;
  puestosControl: Array<{ km: number | null; nombre: string; municipio: string | null; servicios: string | null }>;
  puntosCriticos: Array<{ kmDesde: number | null; kmHasta: number | null; sentido: string | null; descripcion: string }>;
  puntosApoyo: Array<{ entidad: string; ubicacion: string | null; telefono: string | null; equiposDisponibles: string | null; responsable: string | null }>;
  contactosEmergencia: Array<{ entidad: string; area: string | null; telefono: string }>;
  estacionesServicio: Array<{ entidad: string; area: string | null; telefono: string | null }>;

  recViasDestapadas: string | null;
  recZonasUrbanas: string | null;
  recCurvasPeligrosas: string | null;
  recIntersecciones: string | null;
  recPuentesFuenteHidrica: string | null;
  recTramosRectos: string | null;
  puntosCriticosSeguridad: string | null;
  planoRutaUrl: string | null;

  firmas: FirmaPdf[];
}
