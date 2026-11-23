// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás.
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { listarEquipos, type Equipo } from "./prestamos.js";

export type { Equipo } from "./prestamos.js";

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", async () => {
    const equipos: Equipo[] = await listarEquipos(almacen);
    return equipos;
  });
  return Promise.resolve();
};
