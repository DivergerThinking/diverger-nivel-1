// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás.
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { soloIT } from "../equipos/index.js";
import type { components } from "./api.gen.js";
import {
  consultarHistorial,
  FALTA_FECHA,
  FECHA_NO_VALIDA,
  FECHA_PASADA,
  listarEquiposConEstado,
  NO_DISPONIBLE,
  NO_EXISTE_EQUIPO,
  solicitarEquipo,
} from "./prestamos.js";

export { consultarHistorial, listarEquiposConEstado, type EntradaHistorial, type EquipoConEstado } from "./prestamos.js";

type Equipo = components["schemas"]["Equipo"];
type Solicitud = components["schemas"]["Solicitud"];
type EntradaDelContrato = components["schemas"]["EntradaHistorial"];
type Error = components["schemas"]["Error"];

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get("/api/equipos", async (_request, reply) => {
    const equipos: Equipo[] = await listarEquiposConEstado(almacen);
    return reply.code(200).send(equipos);
  });
  app.post<{ Params: { id: string }; Body: Solicitud | null }>("/api/equipos/:id/solicitud", async (request, reply) => {
    const persona = request.persona;
    if (!persona) {
      const cuerpo: Error = { error: "Inicia sesión con Google." };
      return reply.code(401).send(cuerpo);
    }
    const resultado = await solicitarEquipo(almacen, request.params.id, persona.email, request.body?.devolucion);
    if (resultado.tipo === "reservado") {
      const equipo: Equipo = resultado.equipo;
      return reply.code(201).send(equipo);
    }
    const fallos: Record<typeof resultado.tipo, [number, string]> = {
      sinFecha: [400, FALTA_FECHA],
      fechaNoValida: [400, FECHA_NO_VALIDA],
      fechaPasada: [400, FECHA_PASADA],
      noExiste: [404, NO_EXISTE_EQUIPO],
      noDisponible: [409, NO_DISPONIBLE],
    };
    const [codigo, mensaje] = fallos[resultado.tipo];
    const cuerpo: Error = { error: mensaje };
    return reply.code(codigo).send(cuerpo);
  });
  app.get<{ Params: { id: string } }>("/api/equipos/:id/historial", { preHandler: soloIT }, async (request, reply) => {
    const historial: EntradaDelContrato[] | undefined = await consultarHistorial(almacen, request.params.id);
    if (!historial) {
      const cuerpo: Error = { error: NO_EXISTE_EQUIPO };
      return reply.code(404).send(cuerpo);
    }
    return reply.code(200).send(historial);
  });
  return Promise.resolve();
};
