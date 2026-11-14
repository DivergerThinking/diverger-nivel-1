// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás.
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { soloIT } from "./acceso.js";
import type { components } from "./api.gen.js";
import { darDeAlta, FALTA_NOMBRE, NOMBRE_REPETIDO } from "./equipos.js";

export { cuentasDeIT, esCuentaDeIT, soloIT, SOLO_IT } from "./acceso.js";
export { listarEquipos, obtenerEquipo, type Equipo } from "./equipos.js";

type AltaEquipo = components["schemas"]["AltaEquipo"];
type EquipoNuevo = components["schemas"]["EquipoNuevo"];
type Error = components["schemas"]["Error"];

/** Rutas del contrato spec/contextos/equipos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.post<{ Body: AltaEquipo | null }>("/api/equipos", { preHandler: soloIT }, async (request, reply) => {
    const resultado = await darDeAlta(almacen, request.body?.nombre);
    if (resultado.tipo === "sinNombre") {
      const cuerpo: Error = { error: FALTA_NOMBRE };
      return reply.code(400).send(cuerpo);
    }
    if (resultado.tipo === "repetido") {
      const cuerpo: Error = { error: NOMBRE_REPETIDO };
      return reply.code(409).send(cuerpo);
    }
    const cuerpo: EquipoNuevo = { ...resultado.equipo, estado: "disponible" };
    return reply.code(201).send(cuerpo);
  });
  return Promise.resolve();
};
