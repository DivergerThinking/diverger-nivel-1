// Cuentas de IT: los correos de la variable de entorno CORREOS_IT, separados por comas y comparados sin
// distinguir mayúsculas. La lista se fija en la configuración del despliegue, nunca en el código.

export const SOLO_IT = "Solo IT puede hacer esto.";

function cuentasDeIT(lista: string | undefined): Set<string> {
  return new Set(
    (lista ?? "")
      .split(",")
      .map((correo) => correo.trim().toLowerCase())
      .filter((correo) => correo !== ""),
  );
}

/** Si el correo es de una cuenta de IT. Sin CORREOS_IT (o vacía) nadie lo es. */
export function esCuentaDeIT(correo: string, lista: string | undefined = process.env.CORREOS_IT): boolean {
  const buscado = correo.trim().toLowerCase();
  return buscado !== "" && cuentasDeIT(lista).has(buscado);
}
