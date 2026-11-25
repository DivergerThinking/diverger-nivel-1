// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { listarConEstado } from "./estado.js";
import { entregarEquipo, esDeIT, listarVencidos, solicitarEquipo } from "./operaciones.js";

/** Responde 403 «Solo IT puede hacer esto.» si la sesión no es de una cuenta de CORREOS_IT; devuelve true si ha respondido. */
function negarSiNoEsIT(request: FastifyRequest, reply: FastifyReply): boolean {
  if (request.persona && esDeIT(request.persona.email)) return false;
  void reply.code(403).send({ error: "Solo IT puede hacer esto." });
  return true;
}

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json; la sesión (401) la exige el servidor. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", () => listarConEstado(almacen));

  app.get("/api/prestamos/vencidos", (request, reply) => {
    if (negarSiNoEsIT(request, reply)) return reply;
    return listarVencidos(almacen);
  });

  app.post<{ Params: { id: string } }>("/api/equipos/:id/solicitud", async (request, reply) => {
    if (!request.persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    const cuerpo = request.body as { devolucion?: unknown } | null;
    const resultado = await solicitarEquipo(almacen, request.params.id, request.persona.email, cuerpo?.devolucion);
    if (!resultado.ok) return reply.code(resultado.status).send({ error: resultado.error });
    return reply.code(201).send(resultado.valor);
  });

  app.post<{ Params: { id: string } }>("/api/equipos/:id/entrega", async (request, reply) => {
    if (negarSiNoEsIT(request, reply)) return reply;
    const resultado = await entregarEquipo(almacen, request.params.id);
    if (!resultado.ok) return reply.code(resultado.status).send({ error: resultado.error });
    return reply.code(200).send(resultado.valor);
  });
  return Promise.resolve();
};
