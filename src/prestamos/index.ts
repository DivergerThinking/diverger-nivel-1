// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { isItAccount } from "../equipos/index.js";
import { entregarEquipo, hoyEnMadrid, listarEquipos, pedirEquipo } from "./prestamos.js";

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", async (_request, reply) => reply.code(200).send(await listarEquipos(almacen)));
  app.post<{ Params: { id: string } }>("/api/equipos/:id/solicitud", async (request, reply) => {
    const cuerpo = request.body;
    const devolucion = typeof cuerpo === "object" && cuerpo !== null ? (cuerpo as { devolucion?: unknown }).devolucion : undefined;
    const resultado = await pedirEquipo(almacen, request.params.id, request.persona?.email ?? "", devolucion, hoyEnMadrid());
    switch (resultado.tipo) {
      case "sin-fecha":
        return reply.code(400).send({ error: "Falta la fecha de devolución" });
      case "fecha-no-valida":
        return reply.code(400).send({ error: "La fecha de devolución no es válida" });
      case "fecha-pasada":
        return reply.code(400).send({ error: "La fecha de devolución ya ha pasado" });
      case "no-existe":
        return reply.code(404).send({ error: "No existe el equipo" });
      case "no-disponible":
        return reply.code(409).send({ error: "El equipo no está disponible" });
      case "reservado":
        return reply.code(201).send(resultado.equipo);
    }
  });
  app.post<{ Params: { id: string } }>("/api/equipos/:id/entrega", async (request, reply) => {
    if (!isItAccount(request.persona?.email ?? "")) {
      return reply.code(403).send({ error: "Solo IT puede hacer esto." });
    }
    const resultado = await entregarEquipo(almacen, request.params.id);
    switch (resultado.tipo) {
      case "no-existe":
        return reply.code(404).send({ error: "No existe el equipo" });
      case "no-reservado":
        return reply.code(409).send({ error: "El equipo no está reservado" });
      case "prestado":
        return reply.code(200).send(resultado.equipo);
    }
  });
  return Promise.resolve();
};
