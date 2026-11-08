// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";
import { correoDeSesion, exigirIt } from "../cuentas/index.js";
import type { components } from "./api.gen.js";
import {
  crearSolicitud,
  entregarEquipo,
  hoyEnMadrid,
  listarEquiposConEstado,
  prestarEquipo,
  validarDevolucion,
  validarDevolucionMostrador,
  type ErrorFecha,
} from "./prestamos.js";

type Solicitud = components["schemas"]["Solicitud"];
type PrestamoMostrador = components["schemas"]["PrestamoMostrador"];

const MENSAJES_FECHA: Record<ErrorFecha, string> = {
  falta: "Falta la fecha de devolución",
  "no-valida": "La fecha de devolución no es válida",
  pasada: "La fecha de devolución ya ha pasado",
};

export { listarEquiposConEstado, type EquipoConEstado } from "./prestamos.js";

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", async (request, reply) => {
    if (correoDeSesion(request) === null) return reply.code(401).send({ error: "Inicia sesión con Google." });
    return listarEquiposConEstado(almacen);
  });
  app.post<{ Params: { id: string } }>("/api/equipos/:id/solicitud", async (request, reply) => {
    const persona = correoDeSesion(request);
    if (persona === null) return reply.code(401).send({ error: "Inicia sesión con Google." });
    const ahora = new Date();
    const fecha = validarDevolucion((request.body as Solicitud | null | undefined)?.devolucion, hoyEnMadrid(ahora));
    if (!fecha.ok) return reply.code(400).send({ error: MENSAJES_FECHA[fecha.motivo] });
    const resultado = await crearSolicitud(almacen, request.params.id, persona, fecha.devolucion, ahora);
    if (resultado.ok) return reply.code(201).send(resultado.equipo);
    if (resultado.motivo === "no-existe") return reply.code(404).send({ error: "No existe el equipo" });
    return reply.code(409).send({ error: "El equipo no está disponible" });
  });
  app.post<{ Params: { id: string } }>("/api/equipos/:id/entrega", async (request, reply) => {
    if (correoDeSesion(request) === null) return reply.code(401).send({ error: "Inicia sesión con Google." });
    if (!exigirIt(request, reply)) return reply;
    const resultado = await entregarEquipo(almacen, request.params.id);
    if (resultado.ok) return reply.code(200).send(resultado.equipo);
    if (resultado.motivo === "no-existe") return reply.code(404).send({ error: "No existe el equipo" });
    return reply.code(409).send({ error: "El equipo no está reservado" });
  });
  app.post<{ Params: { id: string } }>("/api/equipos/:id/prestamo", async (request, reply) => {
    if (correoDeSesion(request) === null) return reply.code(401).send({ error: "Inicia sesión con Google." });
    if (!exigirIt(request, reply)) return reply;
    const cuerpo = request.body as PrestamoMostrador | null | undefined;
    const persona = typeof cuerpo?.persona === "string" ? cuerpo.persona.trim() : "";
    if (persona === "" || !cuerpo?.devolucion) {
      return reply.code(400).send({ error: "Faltan la persona o la fecha de devolución" });
    }
    const fecha = validarDevolucionMostrador(cuerpo.devolucion);
    if (!fecha.ok) return reply.code(400).send({ error: MENSAJES_FECHA[fecha.motivo] });
    const resultado = await prestarEquipo(almacen, request.params.id, persona, fecha.devolucion);
    if (resultado.ok) return reply.code(201).send(resultado.equipo);
    if (resultado.motivo === "no-existe") return reply.code(404).send({ error: "No existe el equipo" });
    return reply.code(409).send({ error: "El equipo no está disponible" });
  });
  return Promise.resolve();
};
