// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import type { components } from "./api.gen.js";
import { entregarEquipo, ErrorPrestamo, listarEquiposConEstado, prestarEquipo, solicitarEquipo } from "./prestamos.js";

export { listarEquiposConEstado, type Equipo } from "./prestamos.js";

type Solicitud = components["schemas"]["Solicitud"];
type PrestamoMostrador = components["schemas"]["PrestamoMostrador"];

/**
 * Rutas del contrato spec/contextos/prestamos/api.openapi.json. La sesión con Google la exige el servidor
 * en todas las rutas de /api (401 «Inicia sesión con Google.»); las demás historias añaden aquí sus rutas.
 */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", () => listarEquiposConEstado(almacen));
  app.post<{ Params: { id: string }; Body: Solicitud | null }>("/api/equipos/:id/solicitud", async (request, respuesta) => {
    if (!request.persona) return respuesta.code(401).send({ error: "Inicia sesión con Google." });
    try {
      const equipo = await solicitarEquipo(almacen, request.params.id, request.persona.email, request.body?.devolucion);
      return await respuesta.code(201).send(equipo);
    } catch (error) {
      if (error instanceof ErrorPrestamo) return respuesta.code(error.codigo).send({ error: error.message });
      throw error;
    }
  });
  app.post<{ Params: { id: string } }>("/api/equipos/:id/entrega", async (request, respuesta) => {
    if (!request.persona) return respuesta.code(401).send({ error: "Inicia sesión con Google." });
    try {
      return await respuesta.code(200).send(await entregarEquipo(almacen, request.params.id, request.persona));
    } catch (error) {
      if (error instanceof ErrorPrestamo) return respuesta.code(error.codigo).send({ error: error.message });
      throw error;
    }
  });
  app.post<{ Params: { id: string }; Body: PrestamoMostrador | null }>("/api/equipos/:id/prestamo", async (request, respuesta) => {
    if (!request.persona) return respuesta.code(401).send({ error: "Inicia sesión con Google." });
    try {
      const { persona, devolucion } = request.body ?? {};
      return await respuesta.code(201).send(await prestarEquipo(almacen, request.params.id, request.persona, persona, devolucion));
    } catch (error) {
      if (error instanceof ErrorPrestamo) return respuesta.code(error.codigo).send({ error: error.message });
      throw error;
    }
  });
  return Promise.resolve();
};
