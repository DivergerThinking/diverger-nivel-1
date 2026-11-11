// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás (ADR 0003).
// `prestamos` usa la consulta de un equipo por id y la lista de equipos (ADR 0004).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";

export { listarEquipos, obtenerEquipo, type Equipo } from "./equipos.js";

/**
 * Rutas del contrato spec/contextos/equipos/api.openapi.json. El inicio de sesión con Google (401 «Inicia
 * sesión con Google.») lo comprueba el servidor antes de llegar a ellas; el alta es de HU-GES-01.
 */
export const rutas: FastifyPluginAsync<OpcionesContexto> = () => Promise.resolve();
