// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { darDeAlta } from "./equipo.js";

export { obtenerEquipo, type EquipoConId } from "./equipo.js";

/** Si el correo está en CORREOS_IT (lista separada por comas, sin distinguir mayúsculas), fijada en el despliegue. */
function esDeIT(email: string): boolean {
  const correos = (process.env["CORREOS_IT"] ?? "").split(",").map((c) => c.trim().toLowerCase());
  return correos.includes(email.trim().toLowerCase());
}

/** Rutas del contrato spec/contextos/equipos/api.openapi.json; la sesión (401) la exige el servidor. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.post("/api/equipos", async (request, reply) => {
    if (!request.persona || !esDeIT(request.persona.email)) {
      return reply.code(403).send({ error: "Solo IT puede hacer esto." });
    }
    const cuerpo = request.body as { nombre?: unknown } | null;
    const resultado = await darDeAlta(almacen, cuerpo?.nombre);
    if (!resultado.ok) return reply.code(resultado.status).send({ error: resultado.error });
    return reply.code(201).send(resultado.equipo);
  });
  return Promise.resolve();
};
