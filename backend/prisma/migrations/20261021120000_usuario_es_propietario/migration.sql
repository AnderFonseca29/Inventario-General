-- Marca al dueno de la empresa: unica cuenta autorizada para el modulo de
-- membresias (pago de la suscripcion) y para los reportes de ese modulo.
ALTER TABLE "usuarios" ADD COLUMN "esPropietario" BOOLEAN NOT NULL DEFAULT false;

-- Para las empresas ya creadas se toma como dueno al primer administrador de
-- cada una (el usuario con el rol de sistema "Administrador" mas antiguo), de
-- modo que ninguna empresa existente se quede sin acceso al modulo.
WITH administradores AS (
  SELECT
    u."id" AS usuario_id,
    ROW_NUMBER() OVER (
      PARTITION BY u."empresaId"
      ORDER BY u."createdAt" ASC, u."id" ASC
    ) AS posicion
  FROM "usuarios" u
  JOIN "usuario_roles" ur ON ur."usuarioId" = u."id"
  JOIN "roles" r ON r."id" = ur."rolId"
  WHERE u."empresaId" IS NOT NULL
    AND r."nombre" = 'Administrador'
    AND r."esSistema" = true
)
UPDATE "usuarios" u
SET "esPropietario" = true
FROM administradores a
WHERE u."id" = a.usuario_id
  AND a.posicion = 1;

-- El modulo de membresias es solo del dueno: esos permisos se retiran del rol
-- de sistema "Vendedor" en las empresas ya creadas.
DELETE FROM "rol_permisos" rp
USING "roles" r, "permisos" p
WHERE rp."rolId" = r."id"
  AND rp."permisoId" = p."id"
  AND r."nombre" = 'Vendedor'
  AND r."esSistema" = true
  AND p."codigo" IN ('membresia.ver', 'membresia.afiliar');
