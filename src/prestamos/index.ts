// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás.
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { soloIT } from "../equipos/index.js";
import type { components } from "./api.gen.js";
import {
  consultarHistorial,
  entregarEquipo,
  FALTA_FECHA,
  FALTAN_DATOS,
  FECHA_NO_VALIDA,
  FECHA_PASADA,
  listarEquiposConEstado,
  listarVencidos,
  NO_DISPONIBLE,
  NO_EXISTE_EQUIPO,
  NO_PRESTADO,
  NO_RESERVADO,
  prestarEquipo,
  registrarDevolucion,
  solicitarEquipo,
} from "./prestamos.js";

export {
  consultarHistorial,
  listarEquiposConEstado,
  listarVencidos,
  type EntradaHistorial,
  type EquipoConEstado,
  type Vencido,
} from "./prestamos.js";

type Equipo = components["schemas"]["Equipo"];
type Solicitud = components["schemas"]["Solicitud"];
type PrestamoMostrador = components["schemas"]["PrestamoMostrador"];
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
  app.post<{ Params: { id: string } }>("/api/equipos/:id/entrega", { preHandler: soloIT }, async (request, reply) => {
    const resultado = await entregarEquipo(almacen, request.params.id);
    if (resultado.tipo === "prestado") {
      const equipo: Equipo = resultado.equipo;
      return reply.code(200).send(equipo);
    }
    const cuerpo: Error = { error: resultado.tipo === "noExiste" ? NO_EXISTE_EQUIPO : NO_RESERVADO };
    return reply.code(resultado.tipo === "noExiste" ? 404 : 409).send(cuerpo);
  });
  app.post<{ Params: { id: string } }>("/api/equipos/:id/devolucion", { preHandler: soloIT }, async (request, reply) => {
    const resultado = await registrarDevolucion(almacen, request.params.id);
    if (resultado.tipo === "devuelto") {
      const equipo: Equipo = resultado.equipo;
      return reply.code(200).send(equipo);
    }
    const cuerpo: Error = { error: resultado.tipo === "noExiste" ? NO_EXISTE_EQUIPO : NO_PRESTADO };
    return reply.code(resultado.tipo === "noExiste" ? 404 : 409).send(cuerpo);
  });
  app.post<{ Params: { id: string }; Body: PrestamoMostrador | null }>(
    "/api/equipos/:id/prestamo",
    { preHandler: soloIT },
    async (request, reply) => {
      const resultado = await prestarEquipo(almacen, request.params.id, request.body?.persona, request.body?.devolucion);
      if (resultado.tipo === "prestado") {
        const equipo: Equipo = resultado.equipo;
        return reply.code(201).send(equipo);
      }
      const fallos: Record<typeof resultado.tipo, [number, string]> = {
        faltanDatos: [400, FALTAN_DATOS],
        fechaNoValida: [400, FECHA_NO_VALIDA],
        noExiste: [404, NO_EXISTE_EQUIPO],
        noDisponible: [409, NO_DISPONIBLE],
      };
      const [codigo, mensaje] = fallos[resultado.tipo];
      const cuerpo: Error = { error: mensaje };
      return reply.code(codigo).send(cuerpo);
    },
  );
  app.get("/api/prestamos/vencidos", { preHandler: soloIT }, async (_request, reply) => {
    const vencidos: components["schemas"]["Vencido"][] = await listarVencidos(almacen);
    return reply.code(200).send(vencidos);
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
