// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";
import { exigirIT } from "../cuentas/index.js";
import { crearEquipo, type EquipoCreado } from "./equipo.js";
import type { components } from "./api.gen.js";

export { listarEquipos, obtenerEquipo, type Equipo } from "./equipo.js";

/** Rutas del contrato spec/contextos/equipos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.post<{
    Body: components["schemas"]["EquipoNuevo"] | undefined;
    Reply: EquipoCreado | components["schemas"]["Error"];
  }>("/api/equipos", { preHandler: exigirIT }, async (request, reply) => {
    const nombre = request.body?.nombre;
    const resultado = await crearEquipo(almacen, typeof nombre === "string" ? nombre : "");
    if (resultado.ok) return reply.code(201).send(resultado.equipo);
    if (resultado.error === "nombre-vacio") return reply.code(400).send({ error: "Falta el nombre del equipo" });
    return reply.code(409).send({ error: "Ya hay un equipo con ese nombre" });
  });
  return Promise.resolve();
};
