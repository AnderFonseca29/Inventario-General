-- Normaliza con tildes los nombres visibles de modulos, permisos y funcionalidades,
-- y el rol de sistema "Produccion".
--
-- Es idempotente: solo actualiza las filas cuyo nombre sigue siendo el anterior,
-- por lo que se puede ejecutar mas de una vez sin efectos secundarios y sin
-- pisar una personalizacion feita por el administrador.

-- ---- Modulos de sistema (solo tipo SISTEMA; los personalizados no se tocan) ----
UPDATE "modulos"
SET "nombre" = 'Catálogo',
    "descripcion" = 'Productos, categorías, unidades y presentaciones',
    "updatedAt" = NOW()
WHERE "tipo" = 'SISTEMA' AND "clave" = 'catalogo' AND "nombre" = 'Catalogo';

UPDATE "modulos"
SET "nombre" = 'Producción',
    "descripcion" = 'Materias primas, fórmulas y órdenes de producción',
    "updatedAt" = NOW()
WHERE "tipo" = 'SISTEMA' AND "clave" = 'produccion' AND "nombre" = 'Produccion';

UPDATE "modulos"
SET "nombre" = 'Membresía',
    "descripcion" = 'Clientes y planes de membresía',
    "updatedAt" = NOW()
WHERE "tipo" = 'SISTEMA' AND "clave" = 'membresia' AND "nombre" = 'Membresia';

UPDATE "modulos"
SET "nombre" = 'Auditorías',
    "updatedAt" = NOW()
WHERE "tipo" = 'SISTEMA' AND "clave" = 'auditorias' AND "nombre" = 'Auditorias';

-- ---- Permisos del catalogo (codigo unico global) ----
UPDATE "permisos" SET "nombre" = 'Ver módulos' WHERE "codigo" = 'modulos.ver' AND "nombre" = 'Ver modulos';
UPDATE "permisos" SET "nombre" = 'Administrar módulos de la empresa' WHERE "codigo" = 'modulos.administrar' AND "nombre" = 'Administrar modulos de la empresa';
UPDATE "permisos" SET "nombre" = 'Ver catálogos' WHERE "codigo" = 'catalogos.ver' AND "nombre" = 'Ver catalogos';
UPDATE "permisos" SET "nombre" = 'Administrar catálogos' WHERE "codigo" = 'catalogos.administrar' AND "nombre" = 'Administrar catalogos';
UPDATE "permisos" SET "nombre" = 'Registrar movimientos de botellón' WHERE "codigo" = 'botellones.registrar' AND "nombre" = 'Registrar movimientos de botellon';
UPDATE "permisos" SET "nombre" = 'Ver producción' WHERE "codigo" = 'produccion.ver' AND "nombre" = 'Ver produccion';
UPDATE "permisos" SET "nombre" = 'Operar producción' WHERE "codigo" = 'produccion.operar' AND "nombre" = 'Operar produccion';
UPDATE "permisos" SET "nombre" = 'Confirmar producción' WHERE "codigo" = 'produccion.confirmar' AND "nombre" = 'Confirmar produccion';
UPDATE "permisos" SET "nombre" = 'Ver clientes y membresías' WHERE "codigo" = 'membresia.ver' AND "nombre" = 'Ver clientes y membresias';
UPDATE "permisos" SET "nombre" = 'Administrar clientes y planes de membresía' WHERE "codigo" = 'membresia.administrar' AND "nombre" = 'Administrar clientes y planes de membresia';
UPDATE "permisos" SET "nombre" = 'Afiliar y renovar membresías' WHERE "codigo" = 'membresia.afiliar' AND "nombre" = 'Afiliar y renovar membresias';
UPDATE "permisos" SET "nombre" = 'Ver auditoría' WHERE "codigo" = 'auditoria.ver' AND "nombre" = 'Ver auditoria';

-- ---- Funcionalidades (codigo unico global) ----
UPDATE "funcionalidades" SET "nombre" = 'Gestión de usuarios' WHERE "codigo" = 'usuarios' AND "nombre" = 'Gestion de usuarios';
UPDATE "funcionalidades" SET "nombre" = 'Catálogos de productos' WHERE "codigo" = 'catalogos' AND "nombre" = 'Catalogos de productos';
UPDATE "funcionalidades" SET "nombre" = 'Materias primas y producción' WHERE "codigo" = 'produccion' AND "nombre" = 'Materias primas y produccion';
UPDATE "funcionalidades" SET "nombre" = 'Auditoría' WHERE "codigo" = 'auditoria' AND "nombre" = 'Auditoria';

-- ---- Rol de sistema "Produccion" -> "Producción" ----
-- Solo roles de sistema, y solo si la empresa no tiene ya un rol llamado
-- "Producción" (de lo contrario se violaría la clave única empresaId + nombre).
UPDATE "roles" AS r
SET "nombre" = 'Producción',
    "updatedAt" = NOW()
WHERE r."nombre" = 'Produccion'
  AND r."esSistema" = true
  AND NOT EXISTS (
    SELECT 1 FROM "roles" AS r2
    WHERE r2."empresaId" = r."empresaId" AND r2."nombre" = 'Producción'
  );
