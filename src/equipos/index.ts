// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import type { components } from "./api.gen.js";
import { darDeAltaEquipo, ErrorAlta, esCuentaDeIT } from "./equipos.js";

export { obtenerEquipo, listarEquipos, type Equipo } from "./equipos.js";

type EquipoNuevo = components["schemas"]["EquipoNuevo"];

/**
 * Rutas del contrato spec/contextos/equipos/api.openapi.json. La sesión con Google la exige el servidor
 * en todas las rutas de /api (401 «Inicia sesión con Google.»).
 */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.post<{ Body: EquipoNuevo | null }>("/api/equipos", async (request, respuesta) => {
    if (!request.persona || !esCuentaDeIT(request.persona.email)) {
      return respuesta.code(403).send({ error: "Solo IT puede hacer esto." });
    }
    try {
      const equipo = await darDeAltaEquipo(almacen, request.body?.nombre);
      return await respuesta.code(201).send(equipo);
    } catch (error) {
      if (error instanceof ErrorAlta) return respuesta.code(error.codigo).send({ error: error.message });
      throw error;
    }
  });
  return Promise.resolve();
};
