import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas as rutasEquipos } from "../equipos/index.js";
import { rutas } from "./index.js";

let app: FastifyInstance;
let almacen: Almacen;
let anterior: string | undefined;

const IT = "it@empresa.com";
const ANA = "ana.perez@empresa.com";
const LUIS = "luis.gomez@empresa.com";

async function servidor(): Promise<FastifyInstance> {
  const instancia = Fastify();
  instancia.decorateRequest("persona", null);
  instancia.addHook("onRequest", async (request, reply) => {
    const correo = request.headers["x-correo"];
    if (typeof correo !== "string") return reply.code(401).send({ error: "Inicia sesión con Google." });
    request.persona = { email: correo, nombre: correo };
  });
  await instancia.register(rutasEquipos, { almacen });
  await instancia.register(rutas, { almacen });
  return instancia;
}

async function altaEquipo(nombre: string): Promise<string> {
  const respuesta = await app.inject({ method: "POST", url: "/api/equipos", headers: { "x-correo": IT }, payload: { nombre } });
  return respuesta.json<{ id: string }>().id;
}

const devolver = (id: string, correo = IT) => app.inject({ method: "POST", url: `/api/equipos/${id}/devolucion`, headers: { "x-correo": correo } });
const prestar = (id: string) =>
  app.inject({ method: "POST", url: `/api/equipos/${id}/prestamo`, headers: { "x-correo": IT }, payload: { persona: LUIS, devolucion: "2026-12-10" } });

beforeEach(async () => {
  anterior = process.env["CORREOS_IT"];
  process.env["CORREOS_IT"] = IT;
  almacen = almacenEnMemoria();
  app = await servidor();
});

afterEach(async () => {
  if (anterior === undefined) delete process.env["CORREOS_IT"];
  else process.env["CORREOS_IT"] = anterior;
  await app.close();
});

describe("POST /api/equipos/{id}/devolucion", () => {
  it("un equipo prestado vuelve a disponible, sin persona ni devolución", async () => {
    const id = await altaEquipo("Monitor 03");
    await prestar(id);
    const respuesta = await devolver(id);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({ id, nombre: "Monitor 03", estado: "disponible" });
    const lista = await app.inject({ url: "/api/equipos", headers: { "x-correo": ANA } });
    expect(lista.json()).toEqual([{ id, nombre: "Monitor 03", estado: "disponible" }]);
  });

  it("el equipo devuelto se puede volver a prestar", async () => {
    const id = await altaEquipo("Monitor 03");
    await prestar(id);
    await devolver(id);
    expect((await prestar(id)).statusCode).toBe(201);
  });

  it("el movimiento del historial pasa a «devuelto»", async () => {
    const id = await altaEquipo("Monitor 03");
    await prestar(id);
    await devolver(id);
    const movimientos = await almacen.listar<{ estado: string; persona: string }>("historialPrestamos");
    expect(movimientos).toHaveLength(1);
    expect(movimientos[0]).toMatchObject({ estado: "devuelto", persona: LUIS });
  });

  it("un equipo reservado responde 409 «El equipo no está prestado» y sigue reservado", async () => {
    const id = await altaEquipo("Monitor 03");
    await app.inject({ method: "POST", url: `/api/equipos/${id}/solicitud`, headers: { "x-correo": ANA }, payload: { devolucion: "2999-12-10" } });
    const respuesta = await devolver(id);
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está prestado" });
    const lista = await app.inject({ url: "/api/equipos", headers: { "x-correo": ANA } });
    expect(lista.json<{ estado: string }[]>()[0]?.estado).toBe("reservado");
  });

  it("un equipo disponible responde 409 «El equipo no está prestado»", async () => {
    const id = await altaEquipo("Monitor 03");
    const respuesta = await devolver(id);
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está prestado" });
  });

  it("un equipo que no existe responde 404 «No existe el equipo»", async () => {
    const respuesta = await devolver("no-existe");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("quien no es de IT recibe 403 y sin sesión 401", async () => {
    const id = await altaEquipo("Monitor 03");
    await prestar(id);
    const sinPermiso = await devolver(id, ANA);
    expect(sinPermiso.statusCode).toBe(403);
    expect(sinPermiso.json()).toEqual({ error: "Solo IT puede hacer esto." });
    const sinSesion = await app.inject({ method: "POST", url: `/api/equipos/${id}/devolucion` });
    expect(sinSesion.statusCode).toBe(401);
  });
});
