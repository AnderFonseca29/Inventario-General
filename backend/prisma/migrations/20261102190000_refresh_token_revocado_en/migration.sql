-- Rotacion de refresh tokens con ventana de gracia.
--
-- `revocadoEn` marca cuando un token se roto. Un refresh concurrente de dos
-- pestanas puede reutilizar el token anterior durante unos segundos sin que se
-- trate como robo. Fuera de esa ventana, la reutilizacion sigue revocando todas
-- las sesiones del usuario.
ALTER TABLE "refresh_tokens"
ADD COLUMN "revocadoEn" TIMESTAMPTZ(3);
