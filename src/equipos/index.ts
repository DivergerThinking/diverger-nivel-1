// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás.
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";

import { exigirIT } from "./it.js";
import { crearEquipo } from "./equipos.js";

export { esCuentaIT, exigirIT } from "./it.js";
export { obtenerEquipo, type Equipo } from "./equipos.js";

/**
 * Rutas del contrato spec/contextos/equipos/api.openapi.json. La sesión (401 «Inicia sesión con Google.») la exige
 * el servidor a todas las rutas de /api antes de llegar aquí.
 */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.post<{ Body: { nombre?: unknown } | null }>("/api/equipos", { preHandler: exigirIT }, async (request, reply) => {
    const resultado = await crearEquipo(almacen, request.body?.nombre);
    if (resultado.tipo === "sinNombre") return reply.code(400).send({ error: "Falta el nombre del equipo" });
    if (resultado.tipo === "nombreRepetido") return reply.code(409).send({ error: "Ya hay un equipo con ese nombre" });
    return reply.code(201).send(resultado.equipo);
  });
  return Promise.resolve();
};
