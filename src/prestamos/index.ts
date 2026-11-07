// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import type { components } from "./api.gen.js";
import { esIT } from "../accesos/index.js";
import { devolverEquipo, entregarEquipo, listarEquipos, listarVencidos, solicitarEquipo, validarDevolucion } from "./prestamos.js";

export { type Equipo } from "./prestamos.js";

type NuevaSolicitud = components["schemas"]["NuevaSolicitud"];
type NuevoPrestamo = components["schemas"]["NuevoPrestamo"];

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
    const problema = validarDevolucion(devolucion);
    if (problema === "no-valida") return reply.code(400).send({ error: "La fecha de devolución no es válida" });
    if (problema === "pasada") return reply.code(400).send({ error: "La fecha de devolución ya ha pasado" });
    const resultado = await solicitarEquipo(almacen, request.params.id, request.persona.email, devolucion);
    if (resultado.ok) return reply.code(201).send(resultado.equipo);
    if (resultado.error === "no-existe") return reply.code(404).send({ error: "No existe el equipo" });
    return reply.code(409).send({ error: "El equipo no está disponible" });
  });
  app.post<{ Params: { id: string }; Body: NuevoPrestamo | null }>("/api/equipos/:id/prestamo", async (request, reply) => {
    if (!request.persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    if (!esIT(request)) return reply.code(403).send({ error: "Solo IT puede hacer esto." });
    const persona = request.body?.persona;
    const devolucion = request.body?.devolucion;
    if (typeof persona !== "string" || persona.trim() === "" || typeof devolucion !== "string" || devolucion === "") {
      return reply.code(400).send({ error: "Faltan la persona o la fecha de devolución" });
    }
    // En el mostrador se admite una fecha anterior a hoy: solo se exige que exista.
    if (validarDevolucion(devolucion) === "no-valida") {
      return reply.code(400).send({ error: "La fecha de devolución no es válida" });
    }
    const resultado = await solicitarEquipo(almacen, request.params.id, persona.trim(), devolucion, "prestado");
    if (resultado.ok) return reply.code(201).send(resultado.equipo);
    if (resultado.error === "no-existe") return reply.code(404).send({ error: "No existe el equipo" });
    return reply.code(409).send({ error: "El equipo no está disponible" });
  });
  app.post<{ Params: { id: string } }>("/api/equipos/:id/entrega", async (request, reply) => {
    if (!request.persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    if (!esIT(request)) return reply.code(403).send({ error: "Solo IT puede hacer esto." });
    const resultado = await entregarEquipo(almacen, request.params.id);
    if (resultado.ok) return reply.code(200).send(resultado.equipo);
    if (resultado.error === "no-existe") return reply.code(404).send({ error: "No existe el equipo" });
    return reply.code(409).send({ error: "El equipo no está reservado" });
  });
  app.get("/api/prestamos/vencidos", async (request, reply) => {
    if (!request.persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    if (!esIT(request)) return reply.code(403).send({ error: "Solo IT puede hacer esto." });
    return listarVencidos(almacen);
  });
  app.post<{ Params: { id: string } }>("/api/equipos/:id/devolucion", async (request, reply) => {
    if (!request.persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    if (!esIT(request)) return reply.code(403).send({ error: "Solo IT puede hacer esto." });
    const resultado = await devolverEquipo(almacen, request.params.id);
    if (resultado.ok) return reply.code(200).send(resultado.equipo);
    if (resultado.error === "no-existe") return reply.code(404).send({ error: "No existe el equipo" });
    return reply.code(409).send({ error: "El equipo no está prestado" });
  });
  return Promise.resolve();
};
