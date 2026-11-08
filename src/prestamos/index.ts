// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { obtenerCuenta } from "../cuentas/index.js";
import { listarEquipos, obtenerEquipo } from "../equipos/index.js";
import { entregarEquipo, hoyEnMadrid, listarEquiposConEstado, reservarEquipo, validarDevolucion } from "./prestamos.js";

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", async (request, reply) => {
    if (!request.persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    return listarEquiposConEstado(almacen, await listarEquipos(almacen));
  });

  app.post<{ Params: { id: string } }>("/api/equipos/:id/solicitud", async (request, reply) => {
    if (!request.persona) return reply.code(401).send({ error: "Inicia sesión con Google." });

    const equipo = await obtenerEquipo(almacen, request.params.id);
    if (!equipo) return reply.code(404).send({ error: "No existe el equipo" });

    const cuerpo = request.body;
    const devolucion = typeof cuerpo === "object" && cuerpo !== null ? (cuerpo as { devolucion?: unknown }).devolucion : undefined;
    const errorDeFecha = validarDevolucion(devolucion, hoyEnMadrid());
    if (errorDeFecha === "falta") return reply.code(400).send({ error: "Falta la fecha de devolución" });
    if (errorDeFecha === "no-valida") return reply.code(400).send({ error: "La fecha de devolución no es válida" });
    if (errorDeFecha === "pasada") return reply.code(400).send({ error: "La fecha de devolución ya ha pasado" });

    const reservado = await reservarEquipo(almacen, equipo, request.persona.email, devolucion as string);
    if (reservado === "no-disponible") return reply.code(409).send({ error: "El equipo no está disponible" });
    return reply.code(201).send(reservado);
  });

  app.post<{ Params: { id: string } }>("/api/equipos/:id/entrega", async (request, reply) => {
    if (!request.persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    if (!obtenerCuenta(request.persona).esIT) return reply.code(403).send({ error: "Solo IT puede hacer esto." });

    const equipo = await obtenerEquipo(almacen, request.params.id);
    if (!equipo) return reply.code(404).send({ error: "No existe el equipo" });

    const entregado = await entregarEquipo(almacen, equipo);
    if (entregado === "no-reservado") return reply.code(409).send({ error: "El equipo no está reservado" });
    return reply.code(200).send(entregado);
  });
  return Promise.resolve();
};
