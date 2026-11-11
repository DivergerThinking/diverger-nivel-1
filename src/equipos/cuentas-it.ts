// Cuentas de IT: las de la variable de entorno CORREOS_IT (spec/arquitectura.md), separadas por comas.
export const MENSAJE_SOLO_IT = "Solo IT puede hacer esto.";

/** Los correos de una lista separada por comas, sin espacios ni vacíos y en minúsculas. */
function correosDeLaLista(lista: string | undefined): string[] {
  return (lista ?? "")
    .split(",")
    .map((correo) => correo.trim().toLowerCase())
    .filter((correo) => correo !== "");
}

/**
 * Si el correo es de una cuenta de IT: está en CORREOS_IT, sin distinguir mayúsculas. La lista se lee en cada
 * llamada porque la fija la configuración del despliegue; sin lista, nadie es de IT.
 */
export function esCuentaDeIT(email: string, lista: string | undefined = process.env["CORREOS_IT"]): boolean {
  return correosDeLaLista(lista).includes(email.trim().toLowerCase());
}
