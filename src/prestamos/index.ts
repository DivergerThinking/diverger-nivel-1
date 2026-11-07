// Interfaz pública del contexto «prestamos» (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";
import "../../lib/auth.js";
import { listarEquiposConEstado } from "./estados.js";
import { solicitarEquipo } from "./solicitud.js";

/**
 * Rutas del contrato spec/contextos/prestamos/api.openapi.json.
 * La sesión (401) la exige el servidor común a todas las rutas de /api (app/server.ts).
 */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", async () => listarEquiposConEstado(almacen));
  app.post<{ Params: { id: string } }>("/api/equipos/:id/solicitud", async (request, reply) => {
    const persona = request.persona;
    if (!persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    const resultado = await solicitarEquipo(almacen, request.params.id, persona.email, request.body, new Date());
    if (!resultado.ok) return reply.code(resultado.codigo).send({ error: resultado.error });
    return reply.code(201).send(resultado.equipo);
  });
  return Promise.resolve();
};
