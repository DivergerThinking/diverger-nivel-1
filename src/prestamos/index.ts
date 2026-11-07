// Interfaz pública del contexto «prestamos» (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";
import "../../lib/auth.js";
import { exigirIt } from "../equipos/index.js";
import { devolverEquipo } from "./devolucion.js";
import { entregarEquipo } from "./entrega.js";
import { listarEquiposConEstado } from "./estados.js";
import { prestarEquipo } from "./mostrador.js";
import { solicitarEquipo } from "./solicitud.js";
import { listarVencidos } from "./vencidos.js";

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
  app.post<{ Params: { id: string } }>("/api/equipos/:id/entrega", { preHandler: exigirIt }, async (request, reply) => {
    const resultado = await entregarEquipo(almacen, request.params.id);
    if (!resultado.ok) return reply.code(resultado.codigo).send({ error: resultado.error });
    return reply.code(200).send(resultado.equipo);
  });
  app.post<{ Params: { id: string } }>("/api/equipos/:id/prestamo", { preHandler: exigirIt }, async (request, reply) => {
    const resultado = await prestarEquipo(almacen, request.params.id, request.body, new Date());
    if (!resultado.ok) return reply.code(resultado.codigo).send({ error: resultado.error });
    return reply.code(201).send(resultado.equipo);
  });
  app.post<{ Params: { id: string } }>("/api/equipos/:id/devolucion", { preHandler: exigirIt }, async (request, reply) => {
    const resultado = await devolverEquipo(almacen, request.params.id);
    if (!resultado.ok) return reply.code(resultado.codigo).send({ error: resultado.error });
    return reply.code(200).send(resultado.equipo);
  });
  app.get("/api/prestamos/vencidos", { preHandler: exigirIt }, async () => listarVencidos(almacen, new Date()));
  return Promise.resolve();
};
