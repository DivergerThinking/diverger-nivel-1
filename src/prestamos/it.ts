// Cuentas de IT (glosario: «Cuenta de IT»): los correos de la variable de entorno CORREOS_IT.

/** Mensaje del contrato cuando una cuenta que no es de IT pide una operación de IT. */
export const MENSAJE_SOLO_IT = "Solo IT puede hacer esto.";

/** Los correos de IT, sin espacios y en minúsculas; dos correos son el mismo aunque cambien las mayúsculas. */
export function correosDeIT(valor: string | undefined = process.env.CORREOS_IT): Set<string> {
  return new Set(
    (valor ?? "")
      .split(",")
      .map((correo) => correo.trim().toLowerCase())
      .filter((correo) => correo !== ""),
  );
}

/** Si el correo es de una cuenta de IT. Sin CORREOS_IT, nadie lo es. */
export function esCuentaDeIT(email: string, valor: string | undefined = process.env.CORREOS_IT): boolean {
  return correosDeIT(valor).has(email.trim().toLowerCase());
}

const OPERACIONES_DE_IT: { metodo: string; ruta: RegExp }[] = [
  { metodo: "POST", ruta: /^\/api\/equipos\/[^/]+\/entrega$/ },
  { metodo: "POST", ruta: /^\/api\/equipos\/[^/]+\/prestamo$/ },
  { metodo: "POST", ruta: /^\/api\/equipos\/[^/]+\/devolucion$/ },
  { metodo: "GET", ruta: /^\/api\/prestamos\/vencidos$/ },
  { metodo: "GET", ruta: /^\/api\/equipos\/[^/]+\/historial$/ },
];

/** Si la petición es una operación de IT del contrato: entregar, prestar, devolver, vencidos o historial. */
export function esOperacionDeIT(metodo: string, url: string): boolean {
  const ruta = url.split("?")[0] ?? "";
  return OPERACIONES_DE_IT.some((operacion) => operacion.metodo === metodo && operacion.ruta.test(ruta));
}
