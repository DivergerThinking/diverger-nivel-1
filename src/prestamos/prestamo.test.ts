import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { tokenDeCabecera } from "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import type { Prestamo, PrestamoActivo } from "./prestamos.js";

const PERSONAS: Record<string, { email: string; nombre: string }> = {
  it: { email: "it.soporte@empresa.com", nombre: "IT" },
  luis: { email: "luis.gomez@empresa.com", nombre: "Luis" },
};
const verificarToken = (token: string) => Promise.resolve(PERSONAS[token] ?? null);

const anteriores = process.env.CORREOS_IT;
let app: FastifyInstance;
let almacen: Almacen;

beforeEach(async () => {
  process.env.CORREOS_IT = "it.soporte@empresa.com";
  almacen = almacenEnMemoria();
  app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", async (request, reply) => {
    const persona = await verificarToken(tokenDeCabecera(request.headers.authorization) ?? "");
    if (!persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    request.persona = persona;
  });
  await app.register(rutas, { almacen });
});

afterEach(async () => {
  await app.close();
  if (anteriores === undefined) delete process.env.CORREOS_IT;
  else process.env.CORREOS_IT = anteriores;
});

async function equipo(nombre: string): Promise<string> {
  const id = `id-${nombre}`;
  await almacen.guardar("equipos_equipos", id, { id, nombre });
  return id;
}

async function reservar(equipoId: string): Promise<void> {
  const prestamoId = `p-${equipoId}`;
  await almacen.guardar("prestamos_activos", equipoId, {
    equipoId,
    estado: "reservado",
    persona: "luis.gomez@empresa.com",
    devolucion: "2026-11-20",
    prestamoId,
  } satisfies PrestamoActivo);
}

const prestar = (id: string, cuerpo: unknown, token = "it") =>
  app.inject({
    method: "POST",
    url: `/api/equipos/${id}/prestamo`,
    headers: { authorization: `Bearer ${token}` },
    payload: cuerpo as object,
  });

describe("POST /api/equipos/{id}/prestamo", () => {
  it("presta el equipo disponible a la persona indicada y lo apunta en el historial", async () => {
    const monitor = await equipo("Monitor 03");
    const respuesta = await prestar(monitor, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id: monitor,
      nombre: "Monitor 03",
      estado: "prestado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    const activo = await almacen.obtener<PrestamoActivo>("prestamos_activos", monitor);
    expect(activo).toMatchObject({ estado: "prestado", persona: "ana.perez@empresa.com" });
    const historial = await almacen.listar<Prestamo>("prestamos_historial");
    expect(historial).toHaveLength(1);
    expect(historial[0]).toMatchObject({ equipoId: monitor, estado: "prestado", devolucion: "2026-11-20" });
    const lista = await app.inject({ method: "GET", url: "/api/equipos", headers: { authorization: "Bearer luis" } });
    expect(lista.json()).toEqual([respuesta.json()]);
  });

  it("acepta una fecha de devolución anterior a hoy", async () => {
    const monitor = await equipo("Monitor 04");
    const respuesta = await prestar(monitor, { persona: "ana.perez@empresa.com", devolucion: "2026-11-05" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toMatchObject({ estado: "prestado", devolucion: "2026-11-05" });
  });

  it("responde 400 si falta la persona y el equipo sigue disponible", async () => {
    const monitor = await equipo("Monitor 03");
    const respuesta = await prestar(monitor, { devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Faltan la persona o la fecha de devolución" });
    expect(await almacen.obtener("prestamos_activos", monitor)).toBeUndefined();
  });

  it("responde 400 si falta la fecha de devolución", async () => {
    const monitor = await equipo("Monitor 03");
    const respuesta = await prestar(monitor, { persona: "ana.perez@empresa.com" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Faltan la persona o la fecha de devolución" });
    expect(await almacen.obtener("prestamos_activos", monitor)).toBeUndefined();
  });

  it("responde 400 si la fecha de devolución no existe y el equipo sigue disponible", async () => {
    const monitor = await equipo("Monitor 03");
    const respuesta = await prestar(monitor, { persona: "ana.perez@empresa.com", devolucion: "2026-02-30" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
    expect(await almacen.obtener("prestamos_activos", monitor)).toBeUndefined();
  });

  it("responde 409 si el equipo está reservado y la reserva no cambia", async () => {
    const portatil = await equipo("Portátil 07");
    await reservar(portatil);
    const respuesta = await prestar(portatil, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await almacen.obtener<PrestamoActivo>("prestamos_activos", portatil)).toMatchObject({
      estado: "reservado",
      persona: "luis.gomez@empresa.com",
    });
  });

  it("con dos peticiones simultáneas, una sale bien y la otra recibe 409", async () => {
    const monitor = await equipo("Monitor 03");
    const respuestas = await Promise.all([
      prestar(monitor, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" }),
      prestar(monitor, { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" }),
    ]);
    expect(respuestas.map((respuesta) => respuesta.statusCode).sort()).toEqual([201, 409]);
    expect(await almacen.listar("prestamos_historial")).toHaveLength(1);
  });

  it("responde 404 si el equipo no existe", async () => {
    const respuesta = await prestar("no-existe", { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 a quien no es de IT y el equipo no cambia", async () => {
    const monitor = await equipo("Monitor 03");
    const respuesta = await prestar(monitor, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" }, "luis");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.obtener("prestamos_activos", monitor)).toBeUndefined();
  });

  it("responde 401 sin token de identidad", async () => {
    const monitor = await equipo("Monitor 03");
    const respuesta = await app.inject({
      method: "POST",
      url: `/api/equipos/${monitor}/prestamo`,
      payload: { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" },
    });
    expect(respuesta.statusCode).toBe(401);
  });
});
