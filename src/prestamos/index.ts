// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";
import type { components } from "./api.gen.js";
import { exigirIT } from "../equipos/index.js";
import { entregarEquipo, listarEstadoDeEquipos, prestarEquipo, solicitarEquipo } from "./prestamos.js";

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

  app.post<{ Params: { id: string } }>("/api/equipos/:id/entrega", { preHandler: exigirIT }, async (request, reply) => {
    const resultado = await entregarEquipo(almacen, request.params.id);
    if (resultado === "no-existe") return reply.code(404).send({ error: "No existe el equipo" });
    if (resultado === "no-reservado") return reply.code(409).send({ error: "El equipo no está reservado" });
    return reply.code(200).send(resultado);
  });

  app.post<{ Params: { id: string }; Body: components["schemas"]["PrestamoMostrador"] | null }>(
    "/api/equipos/:id/prestamo",
    { preHandler: exigirIT },
    async (request, reply) => {
      const resultado = await prestarEquipo(almacen, request.params.id, request.body?.persona, request.body?.devolucion);
      if (resultado === "falta") return reply.code(400).send({ error: "Faltan la persona o la fecha de devolución" });
      if (resultado === "invalida") return reply.code(400).send({ error: "La fecha de devolución no es válida" });
      if (resultado === "no-existe") return reply.code(404).send({ error: "No existe el equipo" });
      if (resultado === "no-disponible") return reply.code(409).send({ error: "El equipo no está disponible" });
      return reply.code(201).send(resultado);
    },
  );
  return Promise.resolve();
};
