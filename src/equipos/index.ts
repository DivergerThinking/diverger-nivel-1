// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";
import { exigirIT } from "./acceso.js";
import type { components } from "./api.gen.js";
import { crearEquipo } from "./equipos.js";

export { esCuentaDeIT, exigirIT, SOLO_IT } from "./acceso.js";
export { listarEquipos, obtenerEquipo, type Equipo } from "./equipos.js";

/** Rutas del contrato spec/contextos/equipos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.post<{ Body: components["schemas"]["NuevoEquipo"] | null }>(
    "/api/equipos",
    { preHandler: exigirIT },
    async (request, reply) => {
      const nombre: unknown = request.body?.nombre;
      const equipo = await crearEquipo(almacen, typeof nombre === "string" ? nombre : "");
      if (!equipo) return reply.code(400).send({ error: "Falta el nombre del equipo" });
      return reply.code(201).send(equipo);
    },
  );
  return Promise.resolve();
};
