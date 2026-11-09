import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { tokenDeCabecera } from "../../lib/auth.js";
import { rutas as rutasEquipos } from "../equipos/index.js";
import { COLECCION_ACTIVOS } from "./prestamo.js";
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
