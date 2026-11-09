// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";
import { listarEquiposConEstado, solicitarEquipo, type Equipo } from "./prestamo.js";
import type { components } from "./api.gen.js";

export { listarEquiposConEstado, type Equipo } from "./prestamo.js";

type ErrorApi = components["schemas"]["Error"];

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get<{ Reply: Equipo[] }>("/api/equipos", async () => listarEquiposConEstado(almacen));

  app.post<{
    Params: { id: string };
    Body: components["schemas"]["Solicitud"] | undefined;
    Reply: Equipo | ErrorApi;
  }>("/api/equipos/:id/solicitud", async (request, reply) => {
    const persona = request.persona?.email;
    if (!persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    const resultado = await solicitarEquipo(almacen, request.params.id, persona, request.body?.devolucion);
    if (resultado.ok) return reply.code(201).send(resultado.equipo);
    switch (resultado.error) {
      case "falta-devolucion":
        return reply.code(400).send({ error: "Falta la fecha de devolución" });
      case "devolucion-no-valida":
        return reply.code(400).send({ error: "La fecha de devolución no es válida" });
      case "devolucion-pasada":
        return reply.code(400).send({ error: "La fecha de devolución ya ha pasado" });
      case "no-existe":
        return reply.code(404).send({ error: "No existe el equipo" });
      case "no-disponible":
        return reply.code(409).send({ error: "El equipo no está disponible" });
    }
  });
  return Promise.resolve();
};
