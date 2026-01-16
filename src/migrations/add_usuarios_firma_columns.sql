-- Agregar columnas para rastrear usuarios que elaboran, verifican y aprueban
-- Tabla: gastos_ejecucionPresu

ALTER TABLE "gastos_ejecucionPresu" 
ADD COLUMN IF NOT EXISTS "usuario_elaboro" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "fecha_elaboro" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "usuario_verifico" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "fecha_verifico" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "usuario_aprobo" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "fecha_aprobo" TIMESTAMP;

-- Comentarios para documentar las columnas
COMMENT ON COLUMN "gastos_ejecucionPresu"."usuario_elaboro" IS 'Usuario que elaboró el documento';
COMMENT ON COLUMN "gastos_ejecucionPresu"."fecha_elaboro" IS 'Fecha y hora en que se elaboró';
COMMENT ON COLUMN "gastos_ejecucionPresu"."usuario_verifico" IS 'Usuario que verificó el documento';
COMMENT ON COLUMN "gastos_ejecucionPresu"."fecha_verifico" IS 'Fecha y hora en que se verificó';
COMMENT ON COLUMN "gastos_ejecucionPresu"."usuario_aprobo" IS 'Usuario que aprobó el documento';
COMMENT ON COLUMN "gastos_ejecucionPresu"."fecha_aprobo" IS 'Fecha y hora en que se aprobó';
