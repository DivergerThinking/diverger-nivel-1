// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";

export { esCuentaIt, exigirIt, MENSAJE_SOLO_IT } from "./cuentas-it.js";

/**
 * Rutas del contrato spec/contextos/equipos/api.openapi.json.
 * La sesión (401 «Inicia sesión con Google.») la exige el servidor común a todas las rutas de /api
 * (app/server.ts y lib/auth.ts), así que este contexto la recibe ya resuelta en `request.persona`.
 * El alta (POST /api/equipos) llega con HU-EQU-01.
 */
export const rutas: FastifyPluginAsync<OpcionesContexto> = () => Promise.resolve();
