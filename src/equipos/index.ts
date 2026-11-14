// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás.
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";

export { cuentasDeIT, esCuentaDeIT, soloIT, SOLO_IT } from "./acceso.js";

/** Rutas del contrato spec/contextos/equipos/api.openapi.json (el alta de equipos llega con HU-EQU-01). */
export const rutas: FastifyPluginAsync = () => Promise.resolve();
