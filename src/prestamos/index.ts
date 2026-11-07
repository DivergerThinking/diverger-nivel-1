// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import type { components } from "./api.gen.js";
import { listarEquipos, solicitarEquipo } from "./prestamos.js";

export { type Equipo } from "./prestamos.js";

type NuevaSolicitud = components["schemas"]["NuevaSolicitud"];

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", async (request, reply) => {
    if (!request.persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    return listarEquipos(almacen);
  });
  app.post<{ Params: { id: string }; Body: NuevaSolicitud | null }>("/api/equipos/:id/solicitud", async (request, reply) => {
    if (!request.persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    const devolucion = request.body?.devolucion;
    if (typeof devolucion !== "string" || devolucion === "") {
      return reply.code(400).send({ error: "Falta la fecha de devolución" });
    }
    const resultado = await solicitarEquipo(almacen, request.params.id, request.persona.email, devolucion);
    if (resultado.ok) return reply.code(201).send(resultado.equipo);
    if (resultado.error === "no-existe") return reply.code(404).send({ error: "No existe el equipo" });
    return reply.code(409).send({ error: "El equipo no está disponible" });
  });
  return Promise.resolve();
};
