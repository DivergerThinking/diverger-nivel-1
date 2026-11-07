// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { exigirIT } from "../accesos/index.js";
import type { components } from "./api.gen.js";
import { darDeAlta } from "./catalogo.js";

export { normalizarNombre, type EquipoCreado } from "./catalogo.js";

type NuevoEquipo = components["schemas"]["NuevoEquipo"];

/** Rutas del contrato spec/contextos/equipos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.post("/api/equipos", { preHandler: exigirIT }, async (request, reply) => {
    const cuerpo = (request.body ?? {}) as NuevoEquipo;
    const resultado = await darDeAlta(almacen, cuerpo.nombre);
    if (resultado.ok) return reply.code(201).send(resultado.equipo);
    if (resultado.error === "sin-nombre") return reply.code(400).send({ error: "Falta el nombre del equipo" });
    return reply.code(409).send({ error: "Ya hay un equipo con ese nombre" });
  });
  return Promise.resolve();
};
