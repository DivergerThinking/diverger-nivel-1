// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";
import { listarEquiposConEstado, type Equipo } from "./prestamo.js";

export { listarEquiposConEstado, type Equipo } from "./prestamo.js";

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get<{ Reply: Equipo[] }>("/api/equipos", async () => listarEquiposConEstado(almacen));
  return Promise.resolve();
};
