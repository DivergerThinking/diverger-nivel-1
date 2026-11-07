// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { crearEquipo, isItAccount } from "./equipos.js";

export { getEquipment, isItAccount, listEquipment, normalizedName, type Equipment } from "./equipos.js";

/** Rutas del contrato spec/contextos/equipos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.post("/api/equipos", async (request, reply) => {
    if (!isItAccount(request.persona?.email ?? "")) {
      return reply.code(403).send({ error: "Solo IT puede hacer esto." });
    }
    const cuerpo = request.body;
    const nombre = typeof cuerpo === "object" && cuerpo !== null ? (cuerpo as { nombre?: unknown }).nombre : undefined;
    const resultado = await crearEquipo(almacen, nombre);
    switch (resultado.tipo) {
      case "sin-nombre":
        return reply.code(400).send({ error: "Falta el nombre del equipo" });
      case "repetido":
        return reply.code(409).send({ error: "Ya hay un equipo con ese nombre" });
      case "creado":
        return reply.code(201).send(resultado.equipo);
    }
  });
  return Promise.resolve();
};
