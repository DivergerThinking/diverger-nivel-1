import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { tokenDeCabecera } from "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { obtenerHistorial, type Prestamo } from "./prestamos.js";

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

async function prepararPortatil(): Promise<string> {
  const id = "portatil-07";
  await almacen.guardar("equipos_equipos", id, { id, nombre: "Portátil 07" });
  await almacen.guardar("equipos_equipos", "otro", { id: "otro", nombre: "Monitor 01" });
  const prestamos: Prestamo[] = [
    { id: "p2", equipoId: id, persona: "luis.gomez@empresa.com", devolucion: "2026-11-20", estado: "reservado", creadoEn: "2026-11-06T10:00:00.000Z" },
    { id: "p1", equipoId: id, persona: "ana.perez@empresa.com", devolucion: "2026-11-05", estado: "devuelto", creadoEn: "2026-11-01T10:00:00.000Z" },
    { id: "p3", equipoId: "otro", persona: "pedro@empresa.com", devolucion: "2026-11-07", estado: "prestado", creadoEn: "2026-11-03T10:00:00.000Z" },
  ];
  for (const prestamo of prestamos) await almacen.guardar("prestamos_historial", prestamo.id, prestamo);
  return id;
}

const historial = (token: string, id: string) =>
  app.inject({ method: "GET", url: `/api/equipos/${id}/historial`, headers: { authorization: `Bearer ${token}` } });

describe("obtenerHistorial", () => {
  it("lista los préstamos del equipo del más reciente al más antiguo, sin los de otros equipos", async () => {
    const id = await prepararPortatil();
    expect(await obtenerHistorial(almacen, id)).toEqual([
      { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20", estado: "reservado" },
      { persona: "ana.perez@empresa.com", devolucion: "2026-11-05", estado: "devuelto" },
    ]);
  });

  it("devuelve una lista vacía si el equipo no ha tenido préstamos", async () => {
    await almacen.guardar("equipos_equipos", "nuevo", { id: "nuevo", nombre: "Monitor 09" });
    expect(await obtenerHistorial(almacen, "nuevo")).toEqual([]);
  });

  it("devuelve undefined si el equipo no existe", async () => {
    expect(await obtenerHistorial(almacen, "no-existe")).toBeUndefined();
  });
});

describe("GET /api/equipos/:id/historial", () => {
  it("responde 200 a IT con el más reciente primero", async () => {
    const id = await prepararPortatil();
    const respuesta = await historial("it", id);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20", estado: "reservado" },
      { persona: "ana.perez@empresa.com", devolucion: "2026-11-05", estado: "devuelto" },
    ]);
  });

  it("responde 404 si el equipo no existe", async () => {
    const respuesta = await historial("it", "no-existe");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 a quien no es de IT, sin historial", async () => {
    const id = await prepararPortatil();
    const respuesta = await historial("luis", id);
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });

  it("responde 401 sin token de identidad", async () => {
    const respuesta = await app.inject({ method: "GET", url: "/api/equipos/x/historial" });
    expect(respuesta.statusCode).toBe(401);
  });
});
