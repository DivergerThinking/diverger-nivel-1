// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { obtenerCuenta } from "../cuentas/index.js";
import { crearEquipo, type EquipoCreado } from "./equipos.js";

export { listarEquipos, obtenerEquipo, type Equipo } from "./equipos.js";

/** Rutas del contrato spec/contextos/equipos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.post("/api/equipos", async (request, reply) => {
    if (!request.persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    if (!obtenerCuenta(request.persona).esIT) return reply.code(403).send({ error: "Solo IT puede hacer esto." });

    const cuerpo = request.body;
    const nombre = typeof cuerpo === "object" && cuerpo !== null ? (cuerpo as { nombre?: unknown }).nombre : undefined;
    const resultado = await crearEquipo(almacen, nombre);
    if (resultado.tipo === "sin-nombre") return reply.code(400).send({ error: "Falta el nombre del equipo" });
    if (resultado.tipo === "repetido") return reply.code(409).send({ error: "Ya hay un equipo con ese nombre" });

    const creado: EquipoCreado = { id: resultado.equipo.id, nombre: resultado.equipo.nombre, estado: "disponible" };
    return reply.code(201).send(creado);
  });
  return Promise.resolve();
};
