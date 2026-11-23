// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { crearEquipo, esCuentaDeIT, SOLO_IT, type EquipoCreado } from "./equipos.js";

export { obtenerEquipo, listarEquipos, type Equipo, type EquipoCreado } from "./equipos.js";

/** Rutas del contrato spec/contextos/equipos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.post("/api/equipos", async (request, reply) => {
    if (!esCuentaDeIT(request.persona?.email)) return reply.code(403).send({ error: SOLO_IT });
    const cuerpo = request.body as { nombre?: unknown } | null | undefined;
    const resultado = await crearEquipo(almacen, cuerpo?.nombre);
    if (!resultado.ok) return reply.code(resultado.status).send({ error: resultado.error });
    const creado: EquipoCreado = resultado.equipo;
    return reply.code(201).send(creado);
  });
  return Promise.resolve();
};
