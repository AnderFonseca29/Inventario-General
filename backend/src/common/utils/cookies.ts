/**
 * Lee una cookie sin dependencias externas. Las cookies de sesion son JWT con
 * caracteres seguros, pero se decodifica el valor por si el navegador lo envia
 * codificado.
 */
export function leerCookie(
  cabecera: string | undefined,
  nombre: string,
): string | null {
  if (!cabecera) return null;

  for (const parte of cabecera.split(';')) {
    const indice = parte.indexOf('=');
    if (indice < 0) continue;

    const clave = parte.slice(0, indice).trim();
    if (clave !== nombre) continue;

    const valor = parte.slice(indice + 1).trim();
    try {
      return decodeURIComponent(valor);
    } catch {
      return valor;
    }
  }

  return null;
}
