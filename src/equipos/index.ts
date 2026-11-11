// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
// `prestamos` usa la consulta de un equipo por id y la lista de equipos (ADR 0004).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";

import type { components } from "./api.gen.js";
import { esCuentaDeIT, MENSAJE_SOLO_IT } from "./cuentas-it.js";
import { crearEquipo, ERROR_FALTA_NOMBRE } from "./equipos.js";

export { listarEquipos, obtenerEquipo, type Equipo } from "./equipos.js";
// `prestamos` usa la comprobación de cuenta de IT en sus operaciones de IT (HU-ACC-02).
export { esCuentaDeIT, MENSAJE_SOLO_IT };

/**
 * Rutas del contrato spec/contextos/equipos/api.openapi.json. El inicio de sesión con Google (401 «Inicia
 * sesión con Google.») lo comprueba el servidor antes de llegar a ellas. El alta (POST /api/equipos) es solo
 * de IT: las demás cuentas reciben 403; el nombre falta o está vacío da 400 y un nombre ya
 * dado de alta (sin distinguir mayúsculas ni espacios en los extremos) da 409.
 */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.post(
    "/api/equipos",
    {
      onRequest: async (request, reply) => {
        if (!request.persona || !esCuentaDeIT(request.persona.email)) {
          return reply.code(403).send({ error: MENSAJE_SOLO_IT });
        }
      },
    },
    async (request, reply) => {
      const cuerpo = request.body as components["schemas"]["NuevoEquipo"] | null | undefined;
      const resultado = await crearEquipo(almacen, cuerpo?.nombre);
      if ("error" in resultado) return reply.code(resultado.error === ERROR_FALTA_NOMBRE ? 400 : 409).send({ error: resultado.error });
      const creado: components["schemas"]["EquipoCreado"] = { ...resultado.equipo, estado: "disponible" };
      return reply.code(201).send(creado);
    },
  );

  return Promise.resolve();
};
