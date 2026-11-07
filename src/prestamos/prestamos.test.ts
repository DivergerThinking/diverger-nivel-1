import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { tokenDeCabecera } from "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { esFechaValida, hoyEnMadrid, type PrestamoActivo } from "./prestamos.js";

const LUIS = { email: "luis.gomez@empresa.com", nombre: "Luis" };
const verificarToken = (token: string) => Promise.resolve(token === "luis" ? LUIS : null);

let app: FastifyInstance;
let almacen: Almacen;

async function iniciar(): Promise<void> {
  almacen = almacenEnMemoria();
  app = Fastify();
  app.decorateRequest("persona", null);
  // Hace lo que el servidor del golden path antes de llegar al contexto: pone la persona o responde 401.
  app.addHook("onRequest", async (request, reply) => {
    const persona = await verificarToken(tokenDeCabecera(request.headers.authorization) ?? "");
    if (!persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    request.persona = persona;
  });
  await app.register(rutas, { almacen });
}

/** Crea el equipo con los datos del contexto equipos y devuelve su id. */
async function equipo(nombre: string): Promise<string> {
  const id = `id-${nombre}`;
  await almacen.guardar("equipos_equipos", id, { id, nombre });
  return id;
}

async function activo(equipoId: string, estado: PrestamoActivo["estado"], persona: string, devolucion: string): Promise<void> {
  await almacen.guardar("prestamos_activos", equipoId, { equipoId, estado, persona, devolucion, prestamoId: `p-${equipoId}` });
}

const listar = (token?: string) =>
  app.inject({ method: "GET", url: "/api/equipos", headers: token ? { authorization: `Bearer ${token}` } : {} });

afterEach(async () => {
  await app.close();
});

const pedir = (id: string, cuerpo?: object, token = "luis") =>
  app.inject({
    method: "POST",
    url: `/api/equipos/${id}/solicitud`,
    headers: { authorization: `Bearer ${token}` },
    payload: cuerpo,
  });

describe("POST /api/equipos/{id}/solicitud", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-10T09:00:00+01:00"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reserva el equipo disponible a nombre de quien lo pide y lo anota en el historial", async () => {
    await iniciar();
    const portatil = await equipo("Portátil 07");
    const respuesta = await pedir(portatil, { devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id: portatil,
      nombre: "Portátil 07",
      estado: "reservado",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect((await listar("luis")).json()).toEqual([respuesta.json()]);
    const historial = await almacen.listar<{ estado: string; persona: string; devolucion: string; equipoId: string }>("prestamos_historial");
    expect(historial).toHaveLength(1);
    expect(historial[0]).toMatchObject({ estado: "reservado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-20", equipoId: portatil });
  });

  it("admite la fecha de hoy en Madrid, también a las 00:30 de Madrid cuando en UTC aún es ayer", async () => {
    await iniciar();
    vi.setSystemTime(new Date("2026-11-09T23:30:00Z"));
    const portatil = await equipo("Portátil 07");
    expect((await pedir(portatil, { devolucion: "2026-11-10" })).statusCode).toBe(201);
  });

  it("responde 400 si la fecha ya ha pasado y el equipo sigue disponible", async () => {
    await iniciar();
    const portatil = await equipo("Portátil 07");
    const respuesta = await pedir(portatil, { devolucion: "2026-11-09" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución ya ha pasado" });
    expect((await listar("luis")).json<{ estado: string }[]>()[0]?.estado).toBe("disponible");
  });

  it.each(["2026-02-30", "20-11-2026", "mañana", "2026-13-01"])("responde 400 si la fecha %s no es válida", async (devolucion) => {
    await iniciar();
    const portatil = await equipo("Portátil 07");
    const respuesta = await pedir(portatil, { devolucion });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
    expect((await listar("luis")).json<{ estado: string }[]>()[0]?.estado).toBe("disponible");
  });

  it("responde 400 si la fecha no es un texto", async () => {
    await iniciar();
    const portatil = await equipo("Portátil 07");
    const respuesta = await pedir(portatil, { devolucion: 20261120 });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
  });

  it("responde 400 si falta la fecha, con el cuerpo vacío o sin cuerpo, y el equipo sigue disponible", async () => {
    await iniciar();
    const portatil = await equipo("Portátil 07");
    for (const cuerpo of [{}, undefined]) {
      const respuesta = await pedir(portatil, cuerpo);
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "Falta la fecha de devolución" });
    }
    expect((await listar("luis")).json<{ estado: string }[]>()[0]?.estado).toBe("disponible");
  });

  it("responde 409 si el equipo no está disponible y el préstamo no cambia", async () => {
    await iniciar();
    const proyector = await equipo("Proyector 02");
    await activo(proyector, "prestado", "ana.perez@empresa.com", "2026-11-20");
    const respuesta = await pedir(proyector, { devolucion: "2026-11-25" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await almacen.obtener("prestamos_activos", proyector)).toEqual({
      equipoId: proyector,
      estado: "prestado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
      prestamoId: `p-${proyector}`,
    });
    expect(await almacen.listar("prestamos_historial")).toEqual([]);
  });

  it("responde 404 si el equipo no existe", async () => {
    await iniciar();
    const respuesta = await pedir("no-existe", { devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 401 sin token de identidad", async () => {
    await iniciar();
    const portatil = await equipo("Portátil 07");
    const respuesta = await app.inject({ method: "POST", url: `/api/equipos/${portatil}/solicitud`, payload: { devolucion: "2026-11-20" } });
    expect(respuesta.statusCode).toBe(401);
  });

  it("con dos solicitudes a la vez, una sale bien y la otra recibe 409", async () => {
    await iniciar();
    const portatil = await equipo("Portátil 07");
    const respuestas = await Promise.all([pedir(portatil, { devolucion: "2026-11-20" }), pedir(portatil, { devolucion: "2026-11-20" })]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(await almacen.listar("prestamos_historial")).toHaveLength(1);
  });
});

describe("hoyEnMadrid y esFechaValida", () => {
  it("calcula el día de Madrid, no el de UTC", () => {
    expect(hoyEnMadrid(new Date("2026-11-09T23:30:00Z"))).toBe("2026-11-10");
    expect(hoyEnMadrid(new Date("2026-07-10T22:30:00Z"))).toBe("2026-07-11");
    expect(hoyEnMadrid(new Date("2026-11-10T12:00:00Z"))).toBe("2026-11-10");
  });

  it("acepta solo fechas que existen", () => {
    expect(esFechaValida("2028-02-29")).toBe(true);
    expect(esFechaValida("2026-02-29")).toBe(false);
    expect(esFechaValida("2026-04-31")).toBe(false);
    expect(esFechaValida("2026-4-1")).toBe(false);
  });
});

describe("GET /api/equipos", () => {
  it("lista disponible sin persona ni devolución, y prestado con persona y devolución", async () => {
    await iniciar();
    const portatil = await equipo("Portátil 07");
    const proyector = await equipo("Proyector 02");
    await activo(proyector, "prestado", "ana.perez@empresa.com", "2026-11-20");
    const respuesta = await listar("luis");
    expect(respuesta.statusCode).toBe(200);
    const cuerpo = respuesta.json<Record<string, unknown>[]>();
    expect(cuerpo).toEqual([
      { id: portatil, nombre: "Portátil 07", estado: "disponible" },
      { id: proyector, nombre: "Proyector 02", estado: "prestado", persona: "ana.perez@empresa.com", devolucion: "2026-11-20" },
    ]);
    expect(cuerpo[0]).not.toHaveProperty("persona");
    expect(cuerpo[0]).not.toHaveProperty("devolucion");
  });

  it("lista reservado con persona y devolución", async () => {
    await iniciar();
    const monitor = await equipo("Monitor 03");
    await activo(monitor, "reservado", "ana.perez@empresa.com", "2026-11-25");
    const respuesta = await listar("luis");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { id: monitor, nombre: "Monitor 03", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-11-25" },
    ]);
  });

  it("responde una lista vacía si no hay equipos", async () => {
    await iniciar();
    const respuesta = await listar("luis");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("responde 401 sin token de identidad y sin lista de equipos", async () => {
    await iniciar();
    await equipo("Portátil 07");
    const respuesta = await listar();
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});
