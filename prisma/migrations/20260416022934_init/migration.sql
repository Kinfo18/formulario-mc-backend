-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('CONDUCTOR', 'OPERACIONES', 'ADMIN');

-- CreateEnum
CREATE TYPE "EstadoDesplazamiento" AS ENUM ('BORRADOR', 'EN_REVISION', 'APROBADO', 'RECHAZADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "TipoVehiculo" AS ENUM ('CARGA_PESADA', 'TRANSPORTE_PERSONAL', 'MOTO', 'TRANSPORTE_PUBLICO');

-- CreateEnum
CREATE TYPE "VarianteLimiteVelocidad" AS ENUM ('UNICA', 'DUAL');

-- CreateEnum
CREATE TYPE "ZonaVelocidad" AS ENUM ('LOCACIONES', 'VIA_DESTAPADA', 'VIA_PAVIMENTADA', 'AREAS_URBANAS', 'ZONA_ESCOLAR', 'DESCENSOS_PELIGROSOS', 'OTRO_REQUISITOS_CLIENTE');

-- CreateEnum
CREATE TYPE "TipoFirma" AS ENUM ('CONDUCTOR', 'OPERACIONES');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'CONDUCTOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutas_plantilla" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "varianteLimiteVelocidad" "VarianteLimiteVelocidad" NOT NULL DEFAULT 'DUAL',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "planoRutaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "kmsPavimentados" DOUBLE PRECISION,
    "kmsDestapados" DOUBLE PRECISION,
    "municipiosAtravesados" TEXT,
    "rutaAlternaDescripcion" TEXT,
    "recViasDestapadas" TEXT,
    "recZonasUrbanas" TEXT,
    "recCurvasPeligrosas" TEXT,
    "recIntersecciones" TEXT,
    "recPuentesFuenteHidrica" TEXT,
    "recTramosRectos" TEXT,
    "puntosCriticosSeguridad" TEXT,

    CONSTRAINT "rutas_plantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutas_bloqueadas_plantilla" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "rutaId" TEXT NOT NULL,

    CONSTRAINT "rutas_bloqueadas_plantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "limites_velocidad_plantilla" (
    "id" TEXT NOT NULL,
    "zona" "ZonaVelocidad" NOT NULL,
    "kmPermitido" DOUBLE PRECISION,
    "velocidadCargado" DOUBLE PRECISION,
    "velocidadDescargado" DOUBLE PRECISION,
    "requisito" TEXT,
    "rutaId" TEXT NOT NULL,

    CONSTRAINT "limites_velocidad_plantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sitios_pernocte_plantilla" (
    "id" TEXT NOT NULL,
    "km" DOUBLE PRECISION NOT NULL,
    "nombre" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "servicios" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "rutaId" TEXT NOT NULL,

    CONSTRAINT "sitios_pernocte_plantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puestos_control_plantilla" (
    "id" TEXT NOT NULL,
    "km" DOUBLE PRECISION NOT NULL,
    "nombre" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "servicios" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "rutaId" TEXT NOT NULL,

    CONSTRAINT "puestos_control_plantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puntos_criticos_plantilla" (
    "id" TEXT NOT NULL,
    "kmDesde" DOUBLE PRECISION NOT NULL,
    "kmHasta" DOUBLE PRECISION NOT NULL,
    "sentido" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "rutaId" TEXT NOT NULL,

    CONSTRAINT "puntos_criticos_plantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puntos_apoyo_plantilla" (
    "id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "equiposDisponibles" TEXT,
    "pd" TEXT,
    "responsable" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "rutaId" TEXT NOT NULL,

    CONSTRAINT "puntos_apoyo_plantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contactos_emergencia_plantilla" (
    "id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "area" TEXT,
    "telefono" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "rutaId" TEXT NOT NULL,

    CONSTRAINT "contactos_emergencia_plantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estaciones_servicio_plantilla" (
    "id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "area" TEXT,
    "telefono" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "rutaId" TEXT NOT NULL,

    CONSTRAINT "estaciones_servicio_plantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desplazamientos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "estado" "EstadoDesplazamiento" NOT NULL DEFAULT 'BORRADOR',
    "observaciones" TEXT,
    "rutaId" TEXT NOT NULL,
    "conductorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "motivoDesplazamiento" TEXT NOT NULL,
    "tiempoAntelacion" TEXT NOT NULL,
    "rutaPrincipalNombre" TEXT NOT NULL,
    "tiempoTraslado" TEXT NOT NULL,
    "recorridoKms" DOUBLE PRECISION NOT NULL,
    "rutaAlternaNombre" TEXT,
    "tiempoTrasladoAlterno" TEXT,
    "horaSalida" TEXT NOT NULL,
    "horaLlegada" TEXT NOT NULL,
    "novedades" TEXT,
    "preoperacionalRealizado" BOOLEAN NOT NULL DEFAULT false,
    "documentacionVerificada" BOOLEAN NOT NULL DEFAULT false,
    "tipoVehiculo" "TipoVehiculo" NOT NULL,
    "transportaProducto" BOOLEAN NOT NULL DEFAULT false,
    "cualProducto" TEXT,
    "kmsPavimentados" DOUBLE PRECISION NOT NULL,
    "kmsDestapados" DOUBLE PRECISION NOT NULL,
    "kmsTotales" DOUBLE PRECISION NOT NULL,
    "municipiosAtravesados" TEXT,
    "rutasAlternasDescripcion" TEXT,
    "recViasDestapadas" TEXT,
    "recZonasUrbanas" TEXT,
    "recCurvasPeligrosas" TEXT,
    "recIntersecciones" TEXT,
    "recPuentesFuenteHidrica" TEXT,
    "recTramosRectos" TEXT,
    "puntosCriticosSeguridad" TEXT,
    "planoRutaUrl" TEXT,

    CONSTRAINT "desplazamientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutas_bloqueadas" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "desplazamientoId" TEXT NOT NULL,

    CONSTRAINT "rutas_bloqueadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "limites_velocidad" (
    "id" TEXT NOT NULL,
    "zona" "ZonaVelocidad" NOT NULL,
    "kmPermitido" DOUBLE PRECISION,
    "velocidadCargado" DOUBLE PRECISION,
    "velocidadDescargado" DOUBLE PRECISION,
    "requisito" TEXT,
    "desplazamientoId" TEXT NOT NULL,

    CONSTRAINT "limites_velocidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sitios_pernocte" (
    "id" TEXT NOT NULL,
    "km" DOUBLE PRECISION NOT NULL,
    "nombre" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "servicios" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "desplazamientoId" TEXT NOT NULL,

    CONSTRAINT "sitios_pernocte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puestos_control" (
    "id" TEXT NOT NULL,
    "km" DOUBLE PRECISION NOT NULL,
    "nombre" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "servicios" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "desplazamientoId" TEXT NOT NULL,

    CONSTRAINT "puestos_control_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puntos_criticos" (
    "id" TEXT NOT NULL,
    "kmDesde" DOUBLE PRECISION NOT NULL,
    "kmHasta" DOUBLE PRECISION NOT NULL,
    "sentido" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "desplazamientoId" TEXT NOT NULL,

    CONSTRAINT "puntos_criticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puntos_apoyo" (
    "id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "equiposDisponibles" TEXT,
    "pd" TEXT,
    "responsable" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "desplazamientoId" TEXT NOT NULL,

    CONSTRAINT "puntos_apoyo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contactos_emergencia" (
    "id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "area" TEXT,
    "telefono" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "desplazamientoId" TEXT NOT NULL,

    CONSTRAINT "contactos_emergencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estaciones_servicio" (
    "id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "area" TEXT,
    "telefono" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "desplazamientoId" TEXT NOT NULL,

    CONSTRAINT "estaciones_servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firmas" (
    "id" TEXT NOT NULL,
    "tipo" "TipoFirma" NOT NULL,
    "dataUrl" TEXT NOT NULL,
    "firmadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "desplazamientoId" TEXT NOT NULL,

    CONSTRAINT "firmas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "limites_velocidad_plantilla_rutaId_zona_key" ON "limites_velocidad_plantilla"("rutaId", "zona");

-- CreateIndex
CREATE UNIQUE INDEX "desplazamientos_codigo_key" ON "desplazamientos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "limites_velocidad_desplazamientoId_zona_key" ON "limites_velocidad"("desplazamientoId", "zona");

-- CreateIndex
CREATE UNIQUE INDEX "firmas_desplazamientoId_tipo_key" ON "firmas"("desplazamientoId", "tipo");

-- AddForeignKey
ALTER TABLE "rutas_bloqueadas_plantilla" ADD CONSTRAINT "rutas_bloqueadas_plantilla_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "rutas_plantilla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "limites_velocidad_plantilla" ADD CONSTRAINT "limites_velocidad_plantilla_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "rutas_plantilla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sitios_pernocte_plantilla" ADD CONSTRAINT "sitios_pernocte_plantilla_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "rutas_plantilla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puestos_control_plantilla" ADD CONSTRAINT "puestos_control_plantilla_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "rutas_plantilla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntos_criticos_plantilla" ADD CONSTRAINT "puntos_criticos_plantilla_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "rutas_plantilla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntos_apoyo_plantilla" ADD CONSTRAINT "puntos_apoyo_plantilla_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "rutas_plantilla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contactos_emergencia_plantilla" ADD CONSTRAINT "contactos_emergencia_plantilla_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "rutas_plantilla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estaciones_servicio_plantilla" ADD CONSTRAINT "estaciones_servicio_plantilla_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "rutas_plantilla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desplazamientos" ADD CONSTRAINT "desplazamientos_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "rutas_plantilla"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desplazamientos" ADD CONSTRAINT "desplazamientos_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas_bloqueadas" ADD CONSTRAINT "rutas_bloqueadas_desplazamientoId_fkey" FOREIGN KEY ("desplazamientoId") REFERENCES "desplazamientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "limites_velocidad" ADD CONSTRAINT "limites_velocidad_desplazamientoId_fkey" FOREIGN KEY ("desplazamientoId") REFERENCES "desplazamientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sitios_pernocte" ADD CONSTRAINT "sitios_pernocte_desplazamientoId_fkey" FOREIGN KEY ("desplazamientoId") REFERENCES "desplazamientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puestos_control" ADD CONSTRAINT "puestos_control_desplazamientoId_fkey" FOREIGN KEY ("desplazamientoId") REFERENCES "desplazamientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntos_criticos" ADD CONSTRAINT "puntos_criticos_desplazamientoId_fkey" FOREIGN KEY ("desplazamientoId") REFERENCES "desplazamientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntos_apoyo" ADD CONSTRAINT "puntos_apoyo_desplazamientoId_fkey" FOREIGN KEY ("desplazamientoId") REFERENCES "desplazamientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contactos_emergencia" ADD CONSTRAINT "contactos_emergencia_desplazamientoId_fkey" FOREIGN KEY ("desplazamientoId") REFERENCES "desplazamientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estaciones_servicio" ADD CONSTRAINT "estaciones_servicio_desplazamientoId_fkey" FOREIGN KEY ("desplazamientoId") REFERENCES "desplazamientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firmas" ADD CONSTRAINT "firmas_desplazamientoId_fkey" FOREIGN KEY ("desplazamientoId") REFERENCES "desplazamientos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
