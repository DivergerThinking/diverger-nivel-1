// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
// `prestamos` usa la consulta de un equipo por id y la lista de equipos (ADR 0004).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";

import { esCuentaDeIT, MENSAJE_SOLO_IT } from "./cuentas-it.js";

export { listarEquipos, obtenerEquipo, type Equipo } from "./equipos.js";
// `prestamos` usa la comprobación de cuenta de IT en sus operaciones de IT (HU-ACC-02).
export { esCuentaDeIT, MENSAJE_SOLO_IT };

/**
 * Rutas del contrato spec/contextos/equipos/api.openapi.json. El inicio de sesión con Google (401 «Inicia
 * sesión con Google.») lo comprueba el servidor antes de llegar a ellas. El alta (POST /api/equipos) es solo
 * de IT: las demás cuentas reciben 403; el alta en sí es de HU-GES-01, que sustituirá el 501 provisional.
 */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app) => {
  app.post(
    "/api/equipos",
    {
      onRequest: async (request, reply) => {
        if (!request.persona || !esCuentaDeIT(request.persona.email)) {
          return reply.code(403).send({ error: MENSAJE_SOLO_IT });
        }
      },
    },
    // El alta todavía no está construida (HU-GES-01): una cuenta de IT recibe 501 hasta entonces.
    (_request, reply) => reply.code(501).send({ error: "El alta de equipos todavía no está disponible." }),
  );

  return Promise.resolve();
};
