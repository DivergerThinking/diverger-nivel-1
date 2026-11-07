// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";

import "../../lib/auth.js";
import { exigirIt } from "./cuentas-it.js";
import { darDeAltaEquipo } from "./equipos.js";

export { esCuentaIt, exigirIt, MENSAJE_SOLO_IT } from "./cuentas-it.js";
export { listarEquipos } from "./equipos.js";
export type { Equipo } from "./equipos.js";

/**
 * Rutas del contrato spec/contextos/equipos/api.openapi.json.
 * La sesión (401 «Inicia sesión con Google.») la exige el servidor común a todas las rutas de /api
 * (app/server.ts y lib/auth.ts), así que este contexto la recibe ya resuelta en `request.persona`.
 */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.post("/api/equipos", { preHandler: exigirIt }, async (request, reply) => {
    const resultado = await darDeAltaEquipo(almacen, request.body);
    if (!resultado.ok) return reply.code(resultado.codigo).send({ error: resultado.error });
    return reply.code(201).send(resultado.equipo);
  });
  return Promise.resolve();
};
