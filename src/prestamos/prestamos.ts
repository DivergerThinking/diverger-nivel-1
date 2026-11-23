// Lógica interna del contexto «prestamos»: los demás contextos no pueden importar este fichero.
import type { Almacen } from "../../lib/datos.js";
import { listarEquipos as listarEquiposDeEquipos } from "../equipos/index.js";
import type { components } from "./api.gen.js";

export type Equipo = components["schemas"]["Equipo"];

/** El préstamo activo de un equipo: un documento por equipo, con id el del equipo. */
export interface PrestamoActivo {
  id: string;
  prestamo: string;
  persona: string;
  devolucion: string;
  estado: "reservado" | "prestado";
}

export const ACTIVOS = "prestamos_activos";

export const SOLO_IT = "Solo IT puede hacer esto.";

/** Si el correo es de una cuenta de IT: los de CORREOS_IT, separados por comas, sin distinguir mayúsculas. */
export function esCuentaDeIT(email: string | undefined, correosIT: string | undefined = process.env["CORREOS_IT"]): boolean {
  if (!email) return false;
  const buscado = email.trim().toLowerCase();
  return (correosIT ?? "")
    .split(",")
    .map((correo) => correo.trim().toLowerCase())
    .some((correo) => correo !== "" && correo === buscado);
}

/** Las operaciones «solo IT» del contrato: entrega, préstamo en el mostrador, devolución, vencidos e historial. */
const OPERACIONES_DE_IT: { metodo: string; ruta: RegExp }[] = [
  { metodo: "POST", ruta: /^\/api\/equipos\/[^/]+\/entrega\/?$/ },
  { metodo: "POST", ruta: /^\/api\/equipos\/[^/]+\/prestamo\/?$/ },
  { metodo: "POST", ruta: /^\/api\/equipos\/[^/]+\/devolucion\/?$/ },
  { metodo: "GET", ruta: /^\/api\/prestamos\/vencidos\/?$/ },
  { metodo: "GET", ruta: /^\/api\/equipos\/[^/]+\/historial\/?$/ },
];

/** Si la petición es una operación «solo IT» del contrato. */
export function esOperacionDeIT(metodo: string, url: string): boolean {
  const ruta = url.split("?")[0] ?? "";
  return OPERACIONES_DE_IT.some((operacion) => operacion.metodo === metodo && operacion.ruta.test(ruta));
}

/** Todos los equipos con su estado; si están reservados o prestados, también la persona y la devolución. */
export async function listarEquipos(almacen: Almacen): Promise<Equipo[]> {
  const [equipos, activos] = await Promise.all([listarEquiposDeEquipos(almacen), almacen.listar<PrestamoActivo>(ACTIVOS)]);
  const activoDe = new Map(activos.map((activo) => [activo.id, activo]));
  return equipos.map((equipo): Equipo => {
    const activo = activoDe.get(equipo.id);
    if (!activo) return { id: equipo.id, nombre: equipo.nombre, estado: "disponible" };
    return { id: equipo.id, nombre: equipo.nombre, estado: activo.estado, persona: activo.persona, devolucion: activo.devolucion };
  });
}
