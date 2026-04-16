import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';
import { Rol, ZonaVelocidad, VarianteLimiteVelocidad } from '../src/generated/prisma/enums';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const RUTAS_IDS = [
  'ruta-yopal-aguazul',
  'ruta-yopal-tauramena',
  'ruta-yopal-villanueva',
  'ruta-yopal-monterrey',
  'ruta-yopal-paz-ariporo',
  'ruta-bloque-cubiro',
];

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpiar rutas previas (cascade elimina sub-tablas)
  await prisma.rutaPlantilla.deleteMany({ where: { id: { in: RUTAS_IDS } } });
  console.log('🗑️  Rutas previas eliminadas');

  // ─── Usuarios de prueba ─────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@empresa.com' },
    update: {},
    create: {
      email: 'admin@empresa.com',
      password: passwordHash,
      nombre: 'Administrador Sistema',
      rol: Rol.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'operaciones@empresa.com' },
    update: {},
    create: {
      email: 'operaciones@empresa.com',
      password: await bcrypt.hash('Oper123!', 12),
      nombre: 'Coordinador Operaciones',
      rol: Rol.OPERACIONES,
    },
  });

  await prisma.user.upsert({
    where: { email: 'conductor@empresa.com' },
    update: {},
    create: {
      email: 'conductor@empresa.com',
      password: await bcrypt.hash('Cond123!', 12),
      nombre: 'Juan Pérez',
      rol: Rol.CONDUCTOR,
    },
  });

  console.log('✅ Usuarios creados');

  // ─── Helper: límites velocidad DUAL ─────────────────────────────────────────
  const limitesDual = [
    { zona: ZonaVelocidad.LOCACIONES,           velocidadCargado: 15,  velocidadDescargado: 20 },
    { zona: ZonaVelocidad.VIA_DESTAPADA,         velocidadCargado: 40,  velocidadDescargado: 60 },
    { zona: ZonaVelocidad.VIA_PAVIMENTADA,       velocidadCargado: 60,  velocidadDescargado: 80 },
    { zona: ZonaVelocidad.AREAS_URBANAS,         velocidadCargado: 30,  velocidadDescargado: 40 },
    { zona: ZonaVelocidad.ZONA_ESCOLAR,          velocidadCargado: 20,  velocidadDescargado: 20 },
    { zona: ZonaVelocidad.DESCENSOS_PELIGROSOS,  velocidadCargado: 20,  velocidadDescargado: 30 },
    { zona: ZonaVelocidad.OTRO_REQUISITOS_CLIENTE, velocidadCargado: 30, velocidadDescargado: 40 },
  ];

  // ─── Helper: límites velocidad UNICA (Ruta Bloque Cubiro) ───────────────────
  const limitesUnica = [
    { zona: ZonaVelocidad.LOCACIONES,            kmPermitido: 15 },
    { zona: ZonaVelocidad.VIA_DESTAPADA,          kmPermitido: 30 },
    { zona: ZonaVelocidad.VIA_PAVIMENTADA,        kmPermitido: 60 },
    { zona: ZonaVelocidad.AREAS_URBANAS,          kmPermitido: 30 },
    { zona: ZonaVelocidad.ZONA_ESCOLAR,           kmPermitido: 20 },
    { zona: ZonaVelocidad.DESCENSOS_PELIGROSOS,   kmPermitido: 20 },
    { zona: ZonaVelocidad.OTRO_REQUISITOS_CLIENTE, kmPermitido: 30 },
  ];

  // ─── Recomendaciones comunes ─────────────────────────────────────────────────
  const recComunes = {
    recViasDestapadas: 'Reducir velocidad en vías destapadas. Mantener distancia segura. Encender luces bajas.',
    recZonasUrbanas: 'Respetar semáforos y señales de tránsito. Ceder paso a peatones en cruces.',
    recCurvasPeligrosas: 'Reducir velocidad antes de curvas cerradas. No adelantar en curvas.',
    recIntersecciones: 'Detener completamente antes de intersecciones con stop. Verificar visibilidad.',
    recPuentesFuenteHidrica: 'Transitar a baja velocidad. No detenerse sobre puentes. Verificar capacidad de carga.',
    recTramosRectos: 'No exceder límites de velocidad en rectas. Mantener carril. No adelantar en zona de prohibición.',
  };

  // ─── RUTA 1: Yopal – Aguazul ─────────────────────────────────────────────────
  const rutaYopalAguazul = await prisma.rutaPlantilla.create({
    data: {
      id: 'ruta-yopal-aguazul',
      nombre: 'Yopal – Aguazul',
      descripcion: 'Ruta principal entre Yopal y Aguazul por la vía nacional',
      varianteLimiteVelocidad: VarianteLimiteVelocidad.DUAL,
      kmsPavimentados: 42,
      kmsDestapados: 0,
      municipiosAtravesados: 'Yopal, Aguazul',
      rutaAlternaDescripcion: 'Vía alterna por Maní (no recomendada en lluvia)',
      ...recComunes,
      puntosCriticosSeguridad: 'Cruce con vía a Trinidad km 15. Zona escolar en entrada a Aguazul.',
      limitesVelocidad: {
        create: limitesDual,
      },
      sitiosPernocte: {
        create: [
          { km: 21, nombre: 'Estación de servicio El Alcaraván', municipio: 'Yopal', servicios: 'Combustible, baños, cafetería', orden: 1 },
        ],
      },
      puestosControl: {
        create: [
          { km: 15, nombre: 'Cruce Maní', municipio: 'Yopal', servicios: 'Retén policía', orden: 1 },
          { km: 38, nombre: 'Entrada Aguazul', municipio: 'Aguazul', servicios: 'Retén policía', orden: 2 },
        ],
      },
      puntosCriticos: {
        create: [
          { kmDesde: 14, kmHasta: 16, sentido: 'Ambos', descripcion: 'Cruce de alta velocidad. Visibilidad reducida.', orden: 1 },
        ],
      },
      puntosApoyo: {
        create: [
          { entidad: 'Bomberos Yopal', ubicacion: 'Yopal centro', telefono: '6086352727', pd: 'D', orden: 1 },
          { entidad: 'Clínica Casanare', ubicacion: 'Yopal', telefono: '6086354040', pd: 'D', orden: 2 },
        ],
      },
      contactosEmergencia: {
        create: [
          { entidad: 'Policía', area: 'Casanare', telefono: '112', orden: 1 },
          { entidad: 'Bomberos', area: 'Yopal', telefono: '119', orden: 2 },
          { entidad: 'Cruz Roja', area: 'Casanare', telefono: '6086354000', orden: 3 },
        ],
      },
      estacionesServicio: {
        create: [
          { entidad: 'Terpel Yopal', area: 'Yopal', telefono: '6086351234', orden: 1 },
          { entidad: 'Biomax Aguazul', area: 'Aguazul', telefono: '6086381234', orden: 2 },
        ],
      },
    },
  });
  console.log(`✅ Ruta: ${rutaYopalAguazul.nombre}`);

  // ─── RUTA 2: Yopal – Tauramena ────────────────────────────────────────────────
  const rutaYopalTauramena = await prisma.rutaPlantilla.create({
    data: {
      id: 'ruta-yopal-tauramena',
      nombre: 'Yopal – Tauramena',
      descripcion: 'Ruta hacia los campos petroleros vía Tauramena',
      varianteLimiteVelocidad: VarianteLimiteVelocidad.DUAL,
      kmsPavimentados: 35,
      kmsDestapados: 18,
      municipiosAtravesados: 'Yopal, Aguazul, Tauramena',
      rutaAlternaDescripcion: 'No hay ruta alterna disponible',
      ...recComunes,
      puntosCriticosSeguridad: 'Tramo destapado km 53-71 con baches y polvo en verano. Cruce de ganado frecuente.',
      limitesVelocidad: {
        create: limitesDual,
      },
      sitiosPernocte: {
        create: [
          { km: 53, nombre: 'Parador Los Llanos', municipio: 'Aguazul', servicios: 'Alimentación, estacionamiento', orden: 1 },
        ],
      },
      puestosControl: {
        create: [
          { km: 42, nombre: 'Retén Aguazul', municipio: 'Aguazul', servicios: 'Policía de carretera', orden: 1 },
          { km: 71, nombre: 'Entrada Tauramena', municipio: 'Tauramena', servicios: 'Policía', orden: 2 },
        ],
      },
      puntosCriticos: {
        create: [
          { kmDesde: 53, kmHasta: 71, sentido: 'Ambos', descripcion: 'Vía destapada con baches. Riesgo de volcamiento en curvas.', orden: 1 },
        ],
      },
      puntosApoyo: {
        create: [
          { entidad: 'Hospital Tauramena', ubicacion: 'Tauramena centro', telefono: '6086396600', pd: 'D', orden: 1 },
        ],
      },
      contactosEmergencia: {
        create: [
          { entidad: 'Policía', area: 'Tauramena', telefono: '112', orden: 1 },
          { entidad: 'Bomberos', area: 'Tauramena', telefono: '119', orden: 2 },
        ],
      },
      estacionesServicio: {
        create: [
          { entidad: 'Estación El Progreso', area: 'Tauramena', telefono: '6086395678', orden: 1 },
        ],
      },
    },
  });
  console.log(`✅ Ruta: ${rutaYopalTauramena.nombre}`);

  // ─── RUTA 3: Yopal – Villanueva ───────────────────────────────────────────────
  const rutaYopalVillanueva = await prisma.rutaPlantilla.create({
    data: {
      id: 'ruta-yopal-villanueva',
      nombre: 'Yopal – Villanueva',
      descripcion: 'Ruta sur hacia Villanueva por vía principal',
      varianteLimiteVelocidad: VarianteLimiteVelocidad.DUAL,
      kmsPavimentados: 68,
      kmsDestapados: 0,
      municipiosAtravesados: 'Yopal, Nunchía, Villanueva',
      rutaAlternaDescripcion: 'Vía por Pore (añade 45 min al recorrido)',
      ...recComunes,
      puntosCriticosSeguridad: 'Curvas pronunciadas km 30-45. Neblina frecuente en la mañana.',
      limitesVelocidad: {
        create: limitesDual,
      },
      sitiosPernocte: {
        create: [
          { km: 34, nombre: 'Hotel Los Alpes', municipio: 'Nunchía', servicios: 'Hospedaje, alimentación', orden: 1 },
        ],
      },
      puestosControl: {
        create: [
          { km: 33, nombre: 'Retén Nunchía', municipio: 'Nunchía', servicios: 'Policía de carretera', orden: 1 },
        ],
      },
      puntosCriticos: {
        create: [
          { kmDesde: 30, kmHasta: 45, sentido: 'Ambos', descripcion: 'Curvas pronunciadas. Neblina AM. Riesgo de deslizamientos en invierno.', orden: 1 },
        ],
      },
      puntosApoyo: {
        create: [
          { entidad: 'Defensa Civil Villanueva', ubicacion: 'Villanueva', telefono: '6086727200', pd: 'D', orden: 1 },
        ],
      },
      contactosEmergencia: {
        create: [
          { entidad: 'Policía', area: 'Villanueva', telefono: '112', orden: 1 },
          { entidad: 'Bomberos', area: 'Villanueva', telefono: '119', orden: 2 },
        ],
      },
      estacionesServicio: {
        create: [
          { entidad: 'Terpel Villanueva', area: 'Villanueva', telefono: '6086724321', orden: 1 },
        ],
      },
    },
  });
  console.log(`✅ Ruta: ${rutaYopalVillanueva.nombre}`);

  // ─── RUTA 4: Yopal – Monterrey ────────────────────────────────────────────────
  const rutaYopalMonterrey = await prisma.rutaPlantilla.create({
    data: {
      id: 'ruta-yopal-monterrey',
      nombre: 'Yopal – Monterrey',
      descripcion: 'Ruta norte hacia Monterrey por vía principal',
      varianteLimiteVelocidad: VarianteLimiteVelocidad.DUAL,
      kmsPavimentados: 55,
      kmsDestapados: 5,
      municipiosAtravesados: 'Yopal, Monterrey',
      rutaAlternaDescripcion: 'No hay ruta alterna disponible',
      ...recComunes,
      puntosCriticosSeguridad: 'Tramo de montaña km 20-30 con pendientes pronunciadas.',
      limitesVelocidad: {
        create: limitesDual,
      },
      sitiosPernocte: {
        create: [
          { km: 28, nombre: 'Parador La Montaña', municipio: 'Monterrey', servicios: 'Alimentación, combustible', orden: 1 },
        ],
      },
      puestosControl: {
        create: [
          { km: 54, nombre: 'Entrada Monterrey', municipio: 'Monterrey', servicios: 'Policía', orden: 1 },
        ],
      },
      puntosCriticos: {
        create: [
          { kmDesde: 20, kmHasta: 30, sentido: 'Ambos', descripcion: 'Pendientes pronunciadas. Frenos calientes en descenso. Usar freno motor.', orden: 1 },
        ],
      },
      puntosApoyo: {
        create: [
          { entidad: 'Hospital Monterrey', ubicacion: 'Monterrey centro', telefono: '6086451234', pd: 'D', orden: 1 },
        ],
      },
      contactosEmergencia: {
        create: [
          { entidad: 'Policía', area: 'Monterrey', telefono: '112', orden: 1 },
          { entidad: 'Bomberos', area: 'Monterrey', telefono: '119', orden: 2 },
        ],
      },
      estacionesServicio: {
        create: [
          { entidad: 'Biomax Monterrey', area: 'Monterrey', telefono: '6086459876', orden: 1 },
        ],
      },
    },
  });
  console.log(`✅ Ruta: ${rutaYopalMonterrey.nombre}`);

  // ─── RUTA 5: Yopal – Paz de Ariporo ──────────────────────────────────────────
  const rutaYopalPazAriporo = await prisma.rutaPlantilla.create({
    data: {
      id: 'ruta-yopal-paz-ariporo',
      nombre: 'Yopal – Paz de Ariporo',
      descripcion: 'Ruta este hacia Paz de Ariporo por los llanos',
      varianteLimiteVelocidad: VarianteLimiteVelocidad.DUAL,
      kmsPavimentados: 30,
      kmsDestapados: 48,
      municipiosAtravesados: 'Yopal, Paz de Ariporo',
      rutaAlternaDescripcion: 'Vía por Trinidad (no recomendada en invierno por inundaciones)',
      ...recComunes,
      puntosCriticosSeguridad: 'Tramo destapado km 30-78 con inundaciones en época de lluvias. Cruce de ganado.',
      limitesVelocidad: {
        create: limitesDual,
      },
      sitiosPernocte: {
        create: [
          { km: 54, nombre: 'Finca La Esmeralda', municipio: 'Paz de Ariporo', servicios: 'Hospedaje básico, agua', orden: 1 },
        ],
      },
      puestosControl: {
        create: [
          { km: 78, nombre: 'Entrada Paz de Ariporo', municipio: 'Paz de Ariporo', servicios: 'Policía', orden: 1 },
        ],
      },
      puntosCriticos: {
        create: [
          { kmDesde: 30, kmHasta: 78, sentido: 'Ambos', descripcion: 'Vía destapada. Inundaciones en lluvia. Animales sueltos nocturnos.', orden: 1 },
        ],
      },
      puntosApoyo: {
        create: [
          { entidad: 'Hospital Paz de Ariporo', ubicacion: 'Paz de Ariporo', telefono: '6086572222', pd: 'D', orden: 1 },
        ],
      },
      contactosEmergencia: {
        create: [
          { entidad: 'Policía', area: 'Paz de Ariporo', telefono: '112', orden: 1 },
          { entidad: 'Bomberos', area: 'Paz de Ariporo', telefono: '119', orden: 2 },
        ],
      },
      estacionesServicio: {
        create: [
          { entidad: 'Estación Central', area: 'Paz de Ariporo', telefono: '6086574321', orden: 1 },
        ],
      },
    },
  });
  console.log(`✅ Ruta: ${rutaYopalPazAriporo.nombre}`);

  // ─── RUTA 6: Ruta Bloque Cubiro (variante UNICA) ──────────────────────────────
  const rutaBloqueCubiro = await prisma.rutaPlantilla.create({
    data: {
      id: 'ruta-bloque-cubiro',
      nombre: 'Ruta Bloque Cubiro',
      descripcion: 'Ruta de acceso al Bloque Cubiro. Límite de velocidad único (sin distinción cargado/descargado).',
      varianteLimiteVelocidad: VarianteLimiteVelocidad.UNICA,
      kmsPavimentados: 12,
      kmsDestapados: 28,
      municipiosAtravesados: 'Yopal, Cubiro',
      rutaAlternaDescripcion: 'No hay ruta alterna. En caso de cierre usar Base Yopal.',
      recViasDestapadas: 'Velocidad máxima absoluta 30 km/h en tramos destapados. Usar radio de comunicación cada 10 km.',
      recZonasUrbanas: 'Respetar siempre los límites dentro del bloque. Personal en campo tiene prioridad.',
      recCurvasPeligrosas: 'Bocina obligatoria antes de curvas ciegas. Velocidad máxima 20 km/h.',
      recIntersecciones: 'Detención completa en todos los cruces internos del bloque.',
      recPuentesFuenteHidrica: 'Puentes internos: máximo 1 vehículo a la vez. Verificar estado antes de cruzar.',
      recTramosRectos: 'Respetar límite único aunque la vía parezca libre. Personal en campo puede estar invisible.',
      puntosCriticosSeguridad: 'Zona industrial activa. Personal con equipo pesado. Visibilidad reducida por polvo. Vehículos de gran tamaño.',
      limitesVelocidad: {
        create: limitesUnica,
      },
      rutasBloqueadas: {
        create: [
          { descripcion: 'Acceso norte bloqueado por mantenimiento de tubería (verificar antes de salir)', orden: 1 },
        ],
      },
      sitiosPernocte: {
        create: [
          { km: 20, nombre: 'Campamento Base Cubiro', municipio: 'Cubiro', servicios: 'Alojamiento, comedor, enfermería', orden: 1 },
        ],
      },
      puestosControl: {
        create: [
          { km: 0, nombre: 'Portería Principal Bloque', municipio: 'Yopal', servicios: 'Control de acceso, registro', orden: 1 },
          { km: 40, nombre: 'Portería Interior Cubiro', municipio: 'Cubiro', servicios: 'Control de acceso, dosímetro', orden: 2 },
        ],
      },
      puntosCriticos: {
        create: [
          { kmDesde: 12, kmHasta: 40, sentido: 'Ambos', descripcion: 'Vía interna del bloque. Maquinaria pesada. Zona de alta actividad industrial.', orden: 1 },
        ],
      },
      puntosApoyo: {
        create: [
          { entidad: 'Enfermería Bloque Cubiro', ubicacion: 'Campamento Base km 20', telefono: 'Ext. 2200', equiposDisponibles: 'DEA, camilla, botiquín avanzado', pd: 'P', responsable: 'Médico Turno', orden: 1 },
          { entidad: 'Brigada HSE', ubicacion: 'Portería Principal', telefono: 'Ext. 2100', equiposDisponibles: 'Vehículo rescate, kit spill', pd: 'P', responsable: 'Coordinador HSE', orden: 2 },
        ],
      },
      contactosEmergencia: {
        create: [
          { entidad: 'Emergencias Bloque', area: 'Interno', telefono: 'Ext. 9999', orden: 1 },
          { entidad: 'Policía', area: 'Yopal', telefono: '112', orden: 2 },
          { entidad: 'Bomberos', area: 'Yopal', telefono: '119', orden: 3 },
          { entidad: 'Cruz Roja', area: 'Casanare', telefono: '6086354000', orden: 4 },
        ],
      },
      estacionesServicio: {
        create: [
          { entidad: 'Surtidora Interna Bloque', area: 'km 5 interno', telefono: 'Ext. 2300', orden: 1 },
          { entidad: 'Taller Mecánico HSE', area: 'Campamento Base', telefono: 'Ext. 2400', orden: 2 },
        ],
      },
    },
  });
  console.log(`✅ Ruta: ${rutaBloqueCubiro.nombre}`);

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\nUsuarios de prueba:');
  console.log('  admin@empresa.com     / Admin123!  (ADMIN)');
  console.log('  operaciones@empresa.com / Oper123!  (OPERACIONES)');
  console.log('  conductor@empresa.com  / Cond123!  (CONDUCTOR)');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
