import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { tokenDeCabecera } from "../../lib/auth.js";
import { rutas as rutasEquipos } from "../equipos/index.js";
import { COLECCION_ACTIVOS, COLECCION_PRESTAMOS, hoyEnMadrid, solicitarEquipo } from "./prestamo.js";
import { listarEquiposConEstado, rutas } from "./index.js";

const PERSONAS: Record<string, { email: string; nombre: string }> = {
  lucia: { email: "lucia.gomez@empresa.com", nombre: "Lucía" },
  it: { email: "it.soporte@empresa.com", nombre: "IT" },
};
const verificarToken = (token: string) => Promise.resolve(PERSONAS[token] ?? null);

let app: FastifyInstance;
let almacen: Almacen;
const anterior = process.env.CORREOS_IT;

beforeEach(async () => {
  process.env.CORREOS_IT = "it.soporte@empresa.com";
  almacen = almacenEnMemoria();
  app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", async (request, reply) => {
    const token = tokenDeCabecera(request.headers.authorization);
    const persona = token ? await verificarToken(token) : null;
    if (!persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    request.persona = persona;
  });
  await app.register(rutasEquipos, { almacen });
  await app.register(rutas, { almacen });
});
afterEach(async () => {
  await app.close();
  if (anterior === undefined) delete process.env.CORREOS_IT;
  else process.env.CORREOS_IT = anterior;
});

const darDeAlta = async (nombre: string): Promise<string> => {
  const r = await app.inject({
    method: "POST",
    url: "/api/equipos",
    headers: { authorization: "Bearer it" },
    payload: { nombre },
  });
  return r.json<{ id: string }>().id;
};

const lista = (token = "lucia") =>
  app.inject({ method: "GET", url: "/api/equipos", headers: { authorization: `Bearer ${token}` } });

PERSONAS.marcos = { email: "marcos.ruiz@empresa.com", nombre: "Marcos" };

const pedir = (id: string, payload?: object, token = "lucia") =>
  app.inject({
    method: "POST",
    url: `/api/equipos/${id}/solicitud`,
    headers: { authorization: `Bearer ${token}` },
    ...(payload === undefined ? {} : { payload }),
  });

const estadoDe = async (id: string) => (await listarEquiposConEstado(almacen)).find((e) => e.id === id);

describe("POST /api/equipos/:id/solicitud", () => {
  it("reserva un equipo disponible a nombre de quien lo pide", async () => {
    const id = await darDeAlta("Portátil 07");
    const r = await pedir(id, { devolucion: "2030-06-15" });
    expect(r.statusCode).toBe(201);
    expect(r.json()).toEqual({
      id,
      nombre: "Portátil 07",
      estado: "reservado",
      persona: "lucia.gomez@empresa.com",
      devolucion: "2030-06-15",
    });
    expect(await estadoDe(id)).toMatchObject({ estado: "reservado", persona: "lucia.gomez@empresa.com" });
    expect(await almacen.listar(COLECCION_PRESTAMOS)).toHaveLength(1);
  });

  it("sin fecha de devolución responde 400 «Falta la fecha de devolución» y el equipo sigue disponible", async () => {
    const id = await darDeAlta("Portátil 07");
    for (const payload of [undefined, {}, { devolucion: "" }]) {
      const r = await pedir(id, payload);
      expect(r.statusCode).toBe(400);
      expect(r.json()).toEqual({ error: "Falta la fecha de devolución" });
    }
    expect((await estadoDe(id))?.estado).toBe("disponible");
  });

  it("una fecha que no existe responde 400 «La fecha de devolución no es válida»", async () => {
    const id = await darDeAlta("Portátil 07");
    for (const devolucion of ["2026-02-30", "mañana", "2030-6-5", 20300615]) {
      const r = await pedir(id, { devolucion });
      expect(r.statusCode).toBe(400);
      expect(r.json()).toEqual({ error: "La fecha de devolución no es válida" });
    }
    expect((await estadoDe(id))?.estado).toBe("disponible");
  });

  it("una fecha anterior a hoy responde 400 «La fecha de devolución ya ha pasado»", async () => {
    const id = await darDeAlta("Portátil 07");
    const r = await pedir(id, { devolucion: "2025-01-10" });
    expect(r.statusCode).toBe(400);
    expect(r.json()).toEqual({ error: "La fecha de devolución ya ha pasado" });
    expect((await estadoDe(id))?.estado).toBe("disponible");
  });

  it("hoy en Madrid se admite y el día anterior no", async () => {
    const id = await darDeAlta("Portátil 07");
    // 23:30 UTC del 14 de junio ya es 15 de junio en Madrid.
    const ahora = new Date("2030-06-14T23:30:00Z");
    expect(hoyEnMadrid(ahora)).toBe("2030-06-15");
    expect(await solicitarEquipo(almacen, id, "a@empresa.com", "2030-06-14", ahora)).toEqual({
      ok: false,
      error: "devolucion-pasada",
    });
    expect((await solicitarEquipo(almacen, id, "a@empresa.com", "2030-06-15", ahora)).ok).toBe(true);
  });

  it("un equipo que no existe responde 404 «No existe el equipo»", async () => {
    const r = await pedir("no-existe", { devolucion: "2030-06-15" });
    expect(r.statusCode).toBe(404);
    expect(r.json()).toEqual({ error: "No existe el equipo" });
  });

  it("un equipo reservado responde 409 «El equipo no está disponible» y sigue reservado al primero", async () => {
    const id = await darDeAlta("Portátil 07");
    await pedir(id, { devolucion: "2030-06-15" });
    const r = await pedir(id, { devolucion: "2030-07-01" }, "marcos");
    expect(r.statusCode).toBe(409);
    expect(r.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await estadoDe(id)).toMatchObject({
      estado: "reservado",
      persona: "lucia.gomez@empresa.com",
      devolucion: "2030-06-15",
    });
  });

  it("con dos peticiones a la vez sobre el mismo equipo una sale bien y la otra recibe 409", async () => {
    const id = await darDeAlta("Portátil 07");
    const [a, b] = await Promise.all([
      pedir(id, { devolucion: "2030-06-15" }, "lucia"),
      pedir(id, { devolucion: "2030-06-15" }, "marcos"),
    ]);
    expect([a.statusCode, b.statusCode].sort()).toEqual([201, 409]);
  });

  it("sin sesión responde 401", async () => {
    const r = await app.inject({ method: "POST", url: "/api/equipos/x/solicitud", payload: {} });
    expect(r.statusCode).toBe(401);
  });
});

describe("GET /api/equipos", () => {
  it("una empleada ve «Portátil 07» disponible sin persona ni devolución y «Proyector 01» prestado con persona y devolución", async () => {
    const portatil = await darDeAlta("Portátil 07");
    const proyector = await darDeAlta("Proyector 01");
    await almacen.guardar(COLECCION_ACTIVOS, proyector, {
      estado: "prestado",
      persona: "ana.perez@empresa.com",
      devolucion: "2030-06-15",
      prestamoId: "p-1",
    });

    const r = await lista();
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual([
      { id: portatil, nombre: "Portátil 07", estado: "disponible" },
      {
        id: proyector,
        nombre: "Proyector 01",
        estado: "prestado",
        persona: "ana.perez@empresa.com",
        devolucion: "2030-06-15",
      },
    ]);
  });

  it("un equipo reservado muestra su persona y su devolución", async () => {
    const id = await darDeAlta("Monitor 03");
    await almacen.guardar(COLECCION_ACTIVOS, id, {
      estado: "reservado",
      persona: "lucia.gomez@empresa.com",
      devolucion: "2030-01-10",
      prestamoId: "p-2",
    });
    expect(await listarEquiposConEstado(almacen)).toEqual([
      { id, nombre: "Monitor 03", estado: "reservado", persona: "lucia.gomez@empresa.com", devolucion: "2030-01-10" },
    ]);
  });

  it("sin equipos dados de alta responde 200 con una lista vacía", async () => {
    const r = await lista();
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual([]);
  });

  it("sin sesión responde 401 «Inicia sesión con Google.»", async () => {
    const r = await app.inject({ method: "GET", url: "/api/equipos" });
    expect(r.statusCode).toBe(401);
    expect(r.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});
