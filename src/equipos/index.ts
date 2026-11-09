// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";
import { exigirIT } from "../cuentas/index.js";
import { crearEquipo, type EquipoCreado } from "./equipo.js";
import type { components } from "./api.gen.js";

export { listarEquipos, obtenerEquipo, type Equipo } from "./equipo.js";

/** Rutas del contrato spec/contextos/equipos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.post<{ Body: components["schemas"]["EquipoNuevo"] | undefined; Reply: EquipoCreado }>(
    "/api/equipos",
    { preHandler: exigirIT },
    async (request, reply) => {
      const equipo = await crearEquipo(almacen, request.body?.nombre ?? "");
      return reply.code(201).send(equipo);
    },
  );
  return Promise.resolve();
};
