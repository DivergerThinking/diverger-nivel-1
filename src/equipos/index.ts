// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";

export { obtenerEquipo, listarEquipos, type Equipo } from "./equipos.js";

/**
 * Rutas del contrato spec/contextos/equipos/api.openapi.json. La sesión con Google la exige el servidor
 * en todas las rutas de /api (401 «Inicia sesión con Google.»); el alta de equipos (HU-INV-01) añade aquí su ruta.
 */
export const rutas: FastifyPluginAsync<OpcionesContexto> = () => Promise.resolve();
