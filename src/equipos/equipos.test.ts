import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import { almacenEnMemoria } from "../../lib/datos.js";
import { listarEquipos, obtenerEquipo, rutas } from "./index.js";

// La sesión de prueba se toma de la cabecera x-correo; el servidor real la saca del token.
async function servidor() {
  const almacen = almacenEnMemoria();
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _reply, hecho) => {
    const correo = request.headers["x-correo"];
    request.persona = typeof correo === "string" ? { email: correo, nombre: correo } : null;
    hecho();
  });
  await app.register(rutas, { almacen });
  return { app, almacen };
}

beforeEach(() => {
  vi.stubEnv("CORREOS_IT", "it@empresa.com, Tecnico@Empresa.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const alta = (app: Awaited<ReturnType<typeof servidor>>["app"], payload: unknown) =>
  app.inject({ method: "POST", url: "/api/equipos", payload: payload as object, headers: { "x-correo": "it@empresa.com" } });

describe("POST /api/equipos", () => {
  it("responde 403 a una cuenta que no es de IT y no crea nada", async () => {
    const { app, almacen } = await servidor();
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos",
      payload: { nombre: "Proyector 01" },
      headers: { "x-correo": "ana.perez@empresa.com" },
    });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await listarEquipos(almacen)).toEqual([]);
  });

  it("responde 403 sin sesión y con CORREOS_IT vacío", async () => {
    const { app } = await servidor();
    expect((await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre: "A" } })).statusCode).toBe(403);
    vi.stubEnv("CORREOS_IT", "");
    expect((await alta(app, { nombre: "A" })).statusCode).toBe(403);
  });

  it("reconoce la cuenta de IT sin distinguir mayúsculas", async () => {
    const { app } = await servidor();
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos",
      payload: { nombre: "A" },
      headers: { "x-correo": "TECNICO@empresa.com" },
    });
    expect(respuesta.statusCode).toBe(201);
  });

  it("da de alta un equipo disponible con id y nombre", async () => {
    const { app, almacen } = await servidor();
    const respuesta = await alta(app, { nombre: "Portátil 07" });
    expect(respuesta.statusCode).toBe(201);
    const cuerpo = respuesta.json<{ id: string; nombre: string; estado: string }>();
    expect(cuerpo.id).toBeTruthy();
    expect(cuerpo).toEqual({ id: cuerpo.id, nombre: "Portátil 07", estado: "disponible" });
    expect(await obtenerEquipo(almacen, cuerpo.id)).toEqual({ id: cuerpo.id, nombre: "Portátil 07" });
  });

  it.each([{ nombre: "" }, { nombre: "   " }, {}, { nombre: 7 }])("rechaza el nombre %j con 400 y no crea nada", async (cuerpo) => {
    const { app, almacen } = await servidor();
    const respuesta = await alta(app, cuerpo);
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
    expect(await listarEquipos(almacen)).toEqual([]);
  });

  it("rechaza una petición sin cuerpo con 400", async () => {
    const { app } = await servidor();
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos", headers: { "x-correo": "it@empresa.com" } });
    expect(respuesta.statusCode).toBe(400);
  });

  it("rechaza con 409 un nombre repetido sin importar espacios ni mayúsculas, y sigue habiendo uno solo", async () => {
    const { app, almacen } = await servidor();
    await alta(app, { nombre: "Portátil 07" });
    const respuesta = await alta(app, { nombre: " portátil 07 " });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "Ya hay un equipo con ese nombre" });
    const equipos = await listarEquipos(almacen);
    expect(equipos.map((e) => e.nombre)).toEqual(["Portátil 07"]);
  });

  it("con dos altas a la vez del mismo nombre solo una se crea", async () => {
    const { app, almacen } = await servidor();
    const respuestas = await Promise.all([alta(app, { nombre: "Monitor 03" }), alta(app, { nombre: "monitor 03" })]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(await listarEquipos(almacen)).toHaveLength(1);
  });

  it("admite nombres con «/» y los distingue", async () => {
    const { app, almacen } = await servidor();
    expect((await alta(app, { nombre: "a/b" })).statusCode).toBe(201);
    expect((await alta(app, { nombre: "a/c" })).statusCode).toBe(201);
    expect(await listarEquipos(almacen)).toHaveLength(2);
  });
});

describe("interfaz pública", () => {
  it("obtenerEquipo devuelve undefined si no existe y listarEquipos todos los equipos", async () => {
    const { app, almacen } = await servidor();
    expect(await obtenerEquipo(almacen, "no-existe")).toBeUndefined();
    await alta(app, { nombre: "Proyector 01" });
    await alta(app, { nombre: "Monitor 03" });
    expect((await listarEquipos(almacen)).map((e) => e.nombre).sort()).toEqual(["Monitor 03", "Proyector 01"]);
  });
});
