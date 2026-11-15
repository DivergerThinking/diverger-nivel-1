// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { ErrorDePrestamos, listarEquiposConEstado, solicitarEquipo } from "./prestamos.js";

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", async () => listarEquiposConEstado(almacen));

  app.post("/api/equipos/:id/solicitud", async (request, reply) => {
    const { id } = request.params as { id: string };
    const cuerpo = request.body as { devolucion?: unknown } | null;
    const resultado = await solicitarEquipo(almacen, id, request.persona?.email ?? "", cuerpo?.devolucion).catch(
      (error: unknown) => {
        if (error instanceof ErrorDePrestamos) return error;
        throw error;
      },
    );
    if (resultado instanceof ErrorDePrestamos) return reply.code(resultado.codigo).send({ error: resultado.message });
    return reply.code(201).send(resultado);
  });
  return Promise.resolve();
};
