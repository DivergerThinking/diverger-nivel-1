// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás (ADR 0003).
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";
import { exigirIT } from "../cuentas/index.js";
import {
  consultarHistorial,
  devolverEquipo,
  entregarEquipo,
  listarEquiposConEstado,
  listarVencidos,
  prestarEquipo,
  solicitarEquipo,
  type Equipo,
  type EntradaHistorial,
  type Vencido,
} from "./prestamo.js";
import type { components } from "./api.gen.js";

export {
  consultarHistorial,
  listarEquiposConEstado,
  listarVencidos,
  type EntradaHistorial,
  type Equipo,
  type Vencido,
} from "./prestamo.js";

type ErrorApi = components["schemas"]["Error"];

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  app.get<{ Reply: Equipo[] }>("/api/equipos", async () => listarEquiposConEstado(almacen));

  app.post<{
    Params: { id: string };
    Body: components["schemas"]["Solicitud"] | undefined;
    Reply: Equipo | ErrorApi;
  }>("/api/equipos/:id/solicitud", async (request, reply) => {
    const persona = request.persona?.email;
    if (!persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    const resultado = await solicitarEquipo(almacen, request.params.id, persona, request.body?.devolucion);
    if (resultado.ok) return reply.code(201).send(resultado.equipo);
    switch (resultado.error) {
      case "falta-devolucion":
        return reply.code(400).send({ error: "Falta la fecha de devolución" });
      case "devolucion-no-valida":
        return reply.code(400).send({ error: "La fecha de devolución no es válida" });
      case "devolucion-pasada":
        return reply.code(400).send({ error: "La fecha de devolución ya ha pasado" });
      case "no-existe":
        return reply.code(404).send({ error: "No existe el equipo" });
      case "no-disponible":
        return reply.code(409).send({ error: "El equipo no está disponible" });
    }
  });

  app.post<{ Params: { id: string }; Reply: Equipo | ErrorApi }>(
    "/api/equipos/:id/entrega",
    { preHandler: exigirIT },
    async (request, reply) => {
      const resultado = await entregarEquipo(almacen, request.params.id);
      if (resultado.ok) return reply.code(200).send(resultado.equipo);
      if (resultado.error === "no-existe") return reply.code(404).send({ error: "No existe el equipo" });
      return reply.code(409).send({ error: "El equipo no está reservado" });
    },
  );
  app.post<{
    Params: { id: string };
    Body: components["schemas"]["PrestamoMostrador"] | undefined;
    Reply: Equipo | ErrorApi;
  }>("/api/equipos/:id/prestamo", { preHandler: exigirIT }, async (request, reply) => {
    const resultado = await prestarEquipo(almacen, request.params.id, request.body?.persona, request.body?.devolucion);
    if (resultado.ok) return reply.code(201).send(resultado.equipo);
    switch (resultado.error) {
      case "faltan-datos":
        return reply.code(400).send({ error: "Faltan la persona o la fecha de devolución" });
      case "devolucion-no-valida":
        return reply.code(400).send({ error: "La fecha de devolución no es válida" });
      case "no-existe":
        return reply.code(404).send({ error: "No existe el equipo" });
      case "no-disponible":
        return reply.code(409).send({ error: "El equipo no está disponible" });
    }
  });

  app.post<{ Params: { id: string }; Reply: Equipo | ErrorApi }>(
    "/api/equipos/:id/devolucion",
    { preHandler: exigirIT },
    async (request, reply) => {
      const resultado = await devolverEquipo(almacen, request.params.id);
      if (resultado.ok) return reply.code(200).send(resultado.equipo);
      if (resultado.error === "no-existe") return reply.code(404).send({ error: "No existe el equipo" });
      return reply.code(409).send({ error: "El equipo no está prestado" });
    },
  );

  app.get<{ Reply: Vencido[] }>("/api/prestamos/vencidos", { preHandler: exigirIT }, async () =>
    listarVencidos(almacen),
  );

  app.get<{ Params: { id: string }; Reply: EntradaHistorial[] | ErrorApi }>(
    "/api/equipos/:id/historial",
    { preHandler: exigirIT },
    async (request, reply) => {
      const resultado = await consultarHistorial(almacen, request.params.id);
      if (resultado.ok) return reply.code(200).send(resultado.historial);
      return reply.code(404).send({ error: "No existe el equipo" });
    },
  );
  return Promise.resolve();
};
