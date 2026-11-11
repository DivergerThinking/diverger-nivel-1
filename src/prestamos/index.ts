// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
// Ningún contexto depende de este todavía.
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import type { components } from "./api.gen.js";
import { ErrorPrestamos, listarEquiposConEstado, solicitarEquipo } from "./prestamos.js";

type Solicitud = components["schemas"]["Solicitud"];

/**
 * Rutas del contrato spec/contextos/prestamos/api.openapi.json. El inicio de sesión con Google (401 «Inicia
 * sesión con Google.») lo comprueba el servidor antes de llegar a ellas; la persona de cada solicitud es el
 * correo del token.
 */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", () => listarEquiposConEstado(almacen));

  app.post<{ Params: { id: string }; Body: Solicitud | null }>("/api/equipos/:id/solicitud", async (request, reply) => {
    const persona = request.persona;
    if (!persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    try {
      const equipo = await solicitarEquipo(almacen, request.params.id, persona.email, request.body?.devolucion);
      return await reply.code(201).send(equipo);
    } catch (error) {
      if (error instanceof ErrorPrestamos) return reply.code(error.codigo).send({ error: error.message });
      throw error;
    }
  });

  return Promise.resolve();
};
