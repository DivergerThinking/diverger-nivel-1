// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";
import { correoDeSesion, exigirIt } from "../cuentas/index.js";
import type { components } from "./api.gen.js";
import { darDeAlta } from "./equipos.js";

export { listarEquipos, obtenerEquipo, type Equipo } from "./equipos.js";

type AltaEquipo = components["schemas"]["AltaEquipo"];

/** Rutas del contrato spec/contextos/equipos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.post("/api/equipos", async (request, reply) => {
    if (correoDeSesion(request) === null) return reply.code(401).send({ error: "Inicia sesión con Google." });
    if (!exigirIt(request, reply)) return reply;
    const nombre = (request.body as AltaEquipo | null | undefined)?.nombre;
    if (typeof nombre !== "string" || nombre.trim() === "") {
      return reply.code(400).send({ error: "Falta el nombre del equipo" });
    }
    const alta = await darDeAlta(almacen, nombre);
    if (!alta.ok) return reply.code(409).send({ error: "Ya hay un equipo con ese nombre" });
    return reply.code(201).send({ ...alta.equipo, estado: "disponible" });
  });
  return Promise.resolve();
};
