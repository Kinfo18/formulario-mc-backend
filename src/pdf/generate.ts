import React from 'react';
import type { DesplazamientoPdfData } from './types';

// ─── Constantes de etiquetas ──────────────────────────────────────────────────

const ESTADO_LABEL: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  ARCHIVADO: 'Archivado',
};

const VEHICULO_LABEL: Record<string, string> = {
  CARGA_PESADA: 'Carga pesada',
  TRANSPORTE_PERSONAL: 'Transporte de personal',
  MOTO: 'Moto',
  TRANSPORTE_PUBLICO: 'Transporte público',
};

const ZONA_LABEL: Record<string, string> = {
  LOCACIONES: 'Locaciones',
  VIA_DESTAPADA: 'Vía destapada',
  VIA_PAVIMENTADA: 'Vía pavimentada',
  AREAS_URBANAS: 'Áreas urbanas',
  ZONA_ESCOLAR: 'Zona escolar',
  DESCENSOS_PELIGROSOS: 'Descensos peligrosos',
  OTRO_REQUISITOS_CLIENTE: 'Otros / Requisitos del cliente',
};

// ─── Tipos auxiliares ─────────────────────────────────────────────────────────

type CE = (type: unknown, props: unknown, ...children: unknown[]) => unknown;

interface FieldDef {
  label: string;
  value: string | null | undefined;
  span?: 'full' | 'half' | 'third';
}

// ─── Generador principal ──────────────────────────────────────────────────────

export async function generarBuffer(data: DesplazamientoPdfData): Promise<Buffer> {
  const renderer = await import('@react-pdf/renderer');
  const { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } = renderer;

  // ─── Estilos ───────────────────────────────────────────────────────────────

  const C = {
    border: '#d1d5db',
    sectionBg: '#e5e7eb',
    sectionText: '#111827',
    headerBg: '#f3f4f6',
    headerText: '#374151',
    body: '#1f2937',
    muted: '#6b7280',
    white: '#ffffff',
  };

  const s = StyleSheet.create({
    page: { fontFamily: 'Helvetica', fontSize: 8, padding: 24, color: C.body, backgroundColor: C.white },
    docHeader: { flexDirection: 'row', borderWidth: 1, borderColor: C.border, marginBottom: 6 },
    docLeft: { width: '70%', padding: 6, borderRightWidth: 1, borderRightColor: C.border },
    docRight: { width: '30%', padding: 6 },
    docTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
    docSub: { fontSize: 7, color: C.muted },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    metaLabel: { fontSize: 7, color: C.muted },
    metaValue: { fontSize: 7, fontFamily: 'Helvetica-Bold' },
    section: { marginBottom: 5, borderWidth: 1, borderColor: C.border },
    secHead: { backgroundColor: C.sectionBg, paddingHorizontal: 6, paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: C.border },
    secTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.sectionText },
    secBody: { padding: 6 },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    f3: { width: '33%', paddingRight: 8, marginBottom: 4 },
    f2: { width: '50%', paddingRight: 8, marginBottom: 4 },
    f1: { width: '100%', paddingRight: 8, marginBottom: 4 },
    fLabel: { fontSize: 6.5, color: C.muted, marginBottom: 1 },
    fValue: { fontSize: 8, color: C.body },
    tblHeaderRow: { flexDirection: 'row', backgroundColor: C.headerBg, borderBottomWidth: 1, borderBottomColor: C.border },
    tblRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
    tblHead: { flex: 1, paddingHorizontal: 5, paddingVertical: 3, fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.headerText },
    tblCell: { flex: 1, paddingHorizontal: 5, paddingVertical: 3, fontSize: 7.5, color: C.body },
    empty: { padding: 6, fontSize: 7.5, color: C.muted },
    sigsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    sigBox: { flex: 1, borderWidth: 1, borderColor: C.border, padding: 8, alignItems: 'center' },
    sigLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.muted, marginBottom: 6 },
    sigImg: { width: 140, height: 60, objectFit: 'contain' },
    sigPlaceholder: { width: 140, height: 60, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
    sigLine: { borderTopWidth: 1, borderTopColor: C.border, width: '80%', marginTop: 6 },
    planoImg: { maxWidth: '100%', maxHeight: 200, objectFit: 'contain', marginTop: 4 },
  });

  const ce = React.createElement as CE;

  // ─── Helpers de componentes ────────────────────────────────────────────────

  const fieldStyle = (span?: FieldDef['span']) =>
    span === 'full' ? s.f1 : span === 'half' ? s.f2 : s.f3;

  function Field({ label, value, span }: FieldDef) {
    return ce(View, { style: fieldStyle(span) },
      ce(Text, { style: s.fLabel }, label),
      ce(Text, { style: s.fValue }, value ?? '—'),
    );
  }

  function SeccionSimple({ title, fields }: { title: string; fields: FieldDef[] }) {
    return ce(View, { style: s.section },
      ce(View, { style: s.secHead }, ce(Text, { style: s.secTitle }, title)),
      ce(View, { style: s.secBody },
        ce(View, { style: s.grid },
          ...fields.map((f, i) => ce(Field as CE, { key: i, ...f })),
        ),
      ),
    );
  }

  function SeccionTabla({ title, headers, rows }: { title: string; headers: string[]; rows: (string | null | undefined)[][] }) {
    return ce(View, { style: s.section },
      ce(View, { style: s.secHead }, ce(Text, { style: s.secTitle }, title)),
      ce(View, { style: s.secBody },
        rows.length === 0
          ? ce(Text, { style: s.empty }, 'Sin registros')
          : ce(View, null,
              ce(View, { style: s.tblHeaderRow },
                ...headers.map((h, i) => ce(Text, { key: i, style: s.tblHead }, h)),
              ),
              ...rows.map((row, i) =>
                ce(View, { key: i, style: s.tblRow },
                  ...row.map((cell, j) => ce(Text, { key: j, style: s.tblCell }, cell ?? '—')),
                ),
              ),
            ),
      ),
    );
  }

  // ─── Fecha ────────────────────────────────────────────────────────────────

  const fecha = new Date(data.createdAt).toLocaleDateString('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });

  const isDual = data.ruta.varianteLimiteVelocidad === 'DUAL';

  const firmaConductor = data.firmas.find((f) => f.tipo === 'CONDUCTOR');
  const firmaOperaciones = data.firmas.find((f) => f.tipo === 'OPERACIONES');

  // ─── Documento ────────────────────────────────────────────────────────────

  const doc = ce(Document, {
    title: `FOR-SSTA-218 — ${data.codigo}`,
    author: 'Sistema de Gestión de Seguridad Vial',
    subject: 'Planificación de Desplazamientos Laborales',
  },
    ce(Page, { size: 'A4', style: s.page },

      // Cabecera
      ce(View, { style: s.docHeader },
        ce(View, { style: s.docLeft },
          ce(Text, { style: s.docTitle }, 'PLANIFICACIÓN DE DESPLAZAMIENTOS LABORALES'),
          ce(Text, { style: s.docSub }, 'Código: FOR-SSTA-218 — Sistema de Gestión de Seguridad Vial'),
        ),
        ce(View, { style: s.docRight },
          ...[
            ['N° Registro:', data.codigo],
            ['Fecha:', fecha],
            ['Estado:', ESTADO_LABEL[data.estado] ?? data.estado],
            ['Conductor:', data.conductor.nombre],
            ['Ruta:', data.ruta.nombre],
          ].map(([label, value], i) =>
            ce(View, { key: i, style: s.metaRow },
              ce(Text, { style: s.metaLabel }, label),
              ce(Text, { style: s.metaValue }, value),
            ),
          ),
        ),
      ),

      // Sección 1 — Datos generales
      ce(SeccionSimple as CE, { title: '1. DATOS GENERALES DEL DESPLAZAMIENTO', fields: [
        { label: 'Motivo del desplazamiento', value: data.motivoDesplazamiento, span: 'full' },
        { label: 'Conductor', value: data.conductor.nombre },
        { label: 'Tipo de vehículo', value: VEHICULO_LABEL[data.tipoVehiculo] ?? data.tipoVehiculo },
        { label: 'Antelación de planificación', value: data.tiempoAntelacion },
        { label: 'Ruta principal', value: data.rutaPrincipalNombre },
        { label: 'Tiempo de traslado', value: data.tiempoTraslado },
        { label: 'Recorrido (km)', value: String(data.recorridoKms) },
        { label: 'Hora de salida', value: data.horaSalida },
        { label: 'Hora de llegada', value: data.horaLlegada },
        { label: 'Preoperacional realizado', value: data.preoperacionalRealizado ? 'Sí' : 'No' },
        { label: 'Documentación verificada', value: data.documentacionVerificada ? 'Sí' : 'No' },
        { label: 'Transporta producto', value: data.transportaProducto ? 'Sí' : 'No' },
        ...(data.transportaProducto ? [{ label: 'Producto', value: data.cualProducto }] : []),
        ...(data.novedades ? [{ label: 'Novedades', value: data.novedades, span: 'full' as const }] : []),
      ] }),

      // Sección 2 — Recorrido
      ce(SeccionSimple as CE, { title: '2. RECORRIDO', fields: [
        { label: 'KM pavimentados', value: data.kmsPavimentados?.toString() },
        { label: 'KM destapados', value: data.kmsDestapados?.toString() },
        { label: 'KM totales', value: data.kmsTotales?.toString() },
        { label: 'Municipios atravesados', value: data.municipiosAtravesados, span: 'full' },
      ] }),

      // Sección 3 — Ruta alterna
      ce(SeccionSimple as CE, { title: '3. RUTA ALTERNA', fields: [
        { label: 'Nombre ruta alterna', value: data.rutaAlternaNombre },
        { label: 'Tiempo de traslado alterno', value: data.tiempoTrasladoAlterno },
        { label: 'Descripción', value: data.rutasAlternasDescripcion, span: 'full' },
      ] }),

      // Sección 4 — Rutas bloqueadas
      ce(SeccionTabla as CE, {
        title: '4. RUTAS BLOQUEADAS',
        headers: ['Descripción de la vía bloqueada'],
        rows: data.rutasBloqueadas.map((r) => [r.descripcion]),
      }),

      // Sección 5 — Límites de velocidad
      ce(View, { style: s.section },
        ce(View, { style: s.secHead }, ce(Text, { style: s.secTitle }, '5. LÍMITES DE VELOCIDAD')),
        ce(View, { style: s.secBody },
          data.limitesVelocidad.length === 0
            ? ce(Text, { style: s.empty }, 'Sin registros')
            : ce(View, null,
                ce(View, { style: s.tblHeaderRow },
                  ce(Text, { style: s.tblHead }, 'Zona'),
                  isDual
                    ? [
                        ce(Text, { key: 'c', style: s.tblHead }, 'Vel. Cargado (km/h)'),
                        ce(Text, { key: 'd', style: s.tblHead }, 'Vel. Descargado (km/h)'),
                      ]
                    : ce(Text, { style: s.tblHead }, 'KM Permitido'),
                  ce(Text, { style: s.tblHead }, 'Requisito especial'),
                ),
                ...data.limitesVelocidad.map((l, i) =>
                  ce(View, { key: i, style: s.tblRow },
                    ce(Text, { style: s.tblCell }, ZONA_LABEL[l.zona] ?? l.zona),
                    isDual
                      ? [
                          ce(Text, { key: 'c', style: s.tblCell }, l.velocidadCargado?.toString() ?? '—'),
                          ce(Text, { key: 'd', style: s.tblCell }, l.velocidadDescargado?.toString() ?? '—'),
                        ]
                      : ce(Text, { style: s.tblCell }, l.kmPermitido?.toString() ?? '—'),
                    ce(Text, { style: s.tblCell }, l.requisito ?? '—'),
                  ),
                ),
              ),
        ),
      ),

      // Sección 6 — Sitios de pernocte
      ce(SeccionTabla as CE, {
        title: '6. SITIOS DE PERNOCTE',
        headers: ['KM', 'Nombre', 'Municipio', 'Servicios disponibles'],
        rows: data.sitiosPernocte.map((p) => [p.km?.toString(), p.nombre, p.municipio, p.servicios]),
      }),

      // Sección 7 — Puestos de control
      ce(SeccionTabla as CE, {
        title: '7. PUESTOS DE CONTROL',
        headers: ['KM', 'Nombre', 'Municipio', 'Servicios disponibles'],
        rows: data.puestosControl.map((p) => [p.km?.toString(), p.nombre, p.municipio, p.servicios]),
      }),

      // Sección 8 — Puntos críticos de la vía
      ce(SeccionTabla as CE, {
        title: '8. PUNTOS CRÍTICOS DE LA VÍA',
        headers: ['KM Desde', 'KM Hasta', 'Sentido', 'Descripción'],
        rows: data.puntosCriticos.map((p) => [p.kmDesde?.toString(), p.kmHasta?.toString(), p.sentido, p.descripcion]),
      }),

      // Sección 9 — Recomendaciones
      ce(SeccionSimple as CE, { title: '9. RECOMENDACIONES DE CONDUCCIÓN', fields: [
        { label: 'Vías destapadas', value: data.recViasDestapadas, span: 'full' },
        { label: 'Zonas urbanas', value: data.recZonasUrbanas, span: 'full' },
        { label: 'Curvas peligrosas', value: data.recCurvasPeligrosas, span: 'full' },
        { label: 'Intersecciones', value: data.recIntersecciones, span: 'full' },
        { label: 'Puentes y fuentes hídricas', value: data.recPuentesFuenteHidrica, span: 'full' },
        { label: 'Tramos rectos', value: data.recTramosRectos, span: 'full' },
      ] }),

      // Sección 10 — Puntos de apoyo
      ce(SeccionTabla as CE, {
        title: '10. PUNTOS DE APOYO',
        headers: ['Entidad', 'Ubicación', 'Teléfono', 'Equipos disponibles', 'Responsable'],
        rows: data.puntosApoyo.map((p) => [p.entidad, p.ubicacion, p.telefono, p.equiposDisponibles, p.responsable]),
      }),

      // Sección 11 — Directorio de emergencias
      ce(SeccionTabla as CE, {
        title: '11. DIRECTORIO DE EMERGENCIAS',
        headers: ['Entidad', 'Área', 'Teléfono'],
        rows: data.contactosEmergencia.map((c) => [c.entidad, c.area, c.telefono]),
      }),

      // Sección 12 — Estaciones de servicio
      ce(SeccionTabla as CE, {
        title: '12. ESTACIONES DE SERVICIO',
        headers: ['Entidad', 'Área', 'Teléfono'],
        rows: data.estacionesServicio.map((e) => [e.entidad, e.area, e.telefono]),
      }),

      // Sección 13 — Puntos críticos de seguridad
      ce(SeccionSimple as CE, { title: '13. PUNTOS CRÍTICOS DE SEGURIDAD', fields: [
        { label: 'Descripción', value: data.puntosCriticosSeguridad, span: 'full' },
      ] }),

      // Sección 14 — Plano de ruta
      ce(View, { style: s.section },
        ce(View, { style: s.secHead }, ce(Text, { style: s.secTitle }, '14. PLANO DE RUTA')),
        ce(View, { style: s.secBody },
          data.planoRutaUrl
            ? ce(Image, { style: s.planoImg, src: data.planoRutaUrl })
            : ce(Text, { style: s.empty }, 'Sin plano adjunto'),
        ),
      ),

      // Firmas
      ce(View, { style: s.section },
        ce(View, { style: s.secHead }, ce(Text, { style: s.secTitle }, 'FIRMAS Y APROBACIÓN')),
        ce(View, { style: [s.secBody, { paddingBottom: 12 }] },
          ce(View, { style: s.sigsRow },
            ...[
              { firma: firmaConductor, label: 'Firma del conductor' },
              { firma: firmaOperaciones, label: 'Firma de operaciones' },
            ].map(({ firma, label }, i) =>
              ce(View, { key: i, style: s.sigBox },
                ce(Text, { style: s.sigLabel }, label),
                firma?.dataUrl
                  ? ce(Image, { style: s.sigImg, src: firma.dataUrl })
                  : ce(View, { style: s.sigPlaceholder }),
                ce(View, { style: s.sigLine }),
              ),
            ),
          ),
        ),
      ),
    ),
  );

  return renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]) as Promise<Buffer>;
}
