-- CreateTable
CREATE TABLE "consentimientos_cookies" (
    "id" UUID NOT NULL,
    "identificador" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "versionPolitica" TEXT NOT NULL,
    "hashPolitica" TEXT NOT NULL,
    "analitica" BOOLEAN NOT NULL,
    "publicidad" BOOLEAN NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "registradoEn" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consentimientos_cookies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consentimientos_cookies_identificador_registradoEn_idx" ON "consentimientos_cookies"("identificador", "registradoEn");

-- CreateIndex
CREATE INDEX "consentimientos_cookies_registradoEn_idx" ON "consentimientos_cookies"("registradoEn");
