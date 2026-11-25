// Interfaz pública del contexto «equipos»: lo único que pueden importar los demás.
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";

export { esCuentaIT, exigirIT } from "./it.js";

/**
 * Rutas del contrato spec/contextos/equipos/api.openapi.json. La sesión (401 «Inicia sesión con Google.») la exige
 * el servidor a todas las rutas de /api antes de llegar aquí; el alta de equipos y la comprobación de IT llegan con
 * HU-EQU-01 y HU-ACC-02.
 */
export const rutas: FastifyPluginAsync<OpcionesContexto> = () => Promise.resolve();
