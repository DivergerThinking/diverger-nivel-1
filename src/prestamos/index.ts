// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";
import type { components } from "./api.gen.js";
import { listarEstadoDeEquipos, solicitarEquipo } from "./prestamos.js";

const ERRORES = {
  falta: "Falta la fecha de devolución",
  invalida: "La fecha de devolución no es válida",
  pasada: "La fecha de devolución ya ha pasado",
} as const;

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", async () => listarEstadoDeEquipos(almacen));

  app.post<{ Params: { id: string }; Body: components["schemas"]["Solicitud"] | null }>(
    "/api/equipos/:id/solicitud",
    async (request, reply) => {
      const persona = request.persona?.email;
      if (!persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
      const resultado = await solicitarEquipo(almacen, request.params.id, persona, request.body?.devolucion);
      if (resultado === "falta" || resultado === "invalida" || resultado === "pasada") {
        return reply.code(400).send({ error: ERRORES[resultado] });
      }
      if (resultado === "no-existe") return reply.code(404).send({ error: "No existe el equipo" });
      if (resultado === "no-disponible") return reply.code(409).send({ error: "El equipo no está disponible" });
      return reply.code(201).send(resultado);
    },
  );
  return Promise.resolve();
};
