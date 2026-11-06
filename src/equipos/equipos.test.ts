import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { COLECCION_EQUIPOS, darDeAltaEquipo, normalizarNombre, type Equipo } from "./equipos.js";
import { rutas } from "./index.js";

async function servidor(email: string, almacen: Almacen = almacenEnMemoria()): Promise<FastifyInstance> {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _reply, hecho) => {
    request.persona = { email, nombre: email };
    hecho();
  });
  await app.register(rutas, { almacen });
  await app.ready();
  return app;
}

describe("alta de equipos", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("IT da de alta un equipo: 201 con id, nombre y estado «disponible»", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com");
    const almacen = almacenEnMemoria();
    const app = await servidor("it@empresa.com", almacen);
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre: "Portátil 07" } });
    expect(respuesta.statusCode).toBe(201);
    const equipo = respuesta.json<Equipo>();
    expect(equipo.id).toBeTruthy();
    expect(equipo).toMatchObject({ nombre: "Portátil 07", estado: "disponible" });
    expect(await almacen.listar(COLECCION_EQUIPOS)).toHaveLength(1);
  });

  it("un nombre vacío da 400 «Falta el nombre del equipo» y no crea ningún equipo", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com");
    const almacen = almacenEnMemoria();
    const app = await servidor("it@empresa.com", almacen);
    for (const payload of [{ nombre: "" }, { nombre: "   " }, {}, { nombre: 7 }]) {
      const respuesta = await app.inject({ method: "POST", url: "/api/equipos", payload });
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
    }
    expect(await almacen.listar(COLECCION_EQUIPOS)).toHaveLength(0);
  });

  it("sin cuerpo da 400 «Falta el nombre del equipo»", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com");
    const app = await servidor("it@empresa.com");
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
  });

  it("un nombre repetido (otras mayúsculas y espacios) da 409 y sigue habiendo un solo equipo", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com");
    const almacen = almacenEnMemoria();
    const app = await servidor("it@empresa.com", almacen);
    await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre: "Portátil 07" } });
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre: " portátil 07 " } });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "Ya hay un equipo con ese nombre" });
    expect(await almacen.listar(COLECCION_EQUIPOS)).toHaveLength(1);
  });

  it("dos altas simultáneas del mismo nombre crean un solo equipo", async () => {
    const almacen = almacenEnMemoria();
    const resultados = await Promise.all([
      darDeAltaEquipo(almacen, { nombre: "Proyector 02" }),
      darDeAltaEquipo(almacen, { nombre: "proyector 02" }),
    ]);
    expect(resultados.filter((r) => r.ok)).toHaveLength(1);
    expect(await almacen.listar(COLECCION_EQUIPOS)).toHaveLength(1);
  });

  it("un empleado que no es de IT recibe 403 y no se crea el equipo", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com");
    const almacen = almacenEnMemoria();
    const app = await servidor("luis.garcia@empresa.com", almacen);
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre: "Portátil 07" } });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.listar(COLECCION_EQUIPOS)).toHaveLength(0);
  });

  it("normaliza mayúsculas y espacios de alrededor", () => {
    expect(normalizarNombre("  Portátil 07 ")).toBe(normalizarNombre("PORTÁTIL 07"));
  });
});
