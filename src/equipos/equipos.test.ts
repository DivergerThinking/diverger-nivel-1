import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { listarEquipos, obtenerEquipo, rutas } from "./index.js";

const anterior = process.env["CORREOS_IT"];
beforeEach(() => {
  process.env["CORREOS_IT"] = "it@empresa.com";
});
afterEach(() => {
  if (anterior === undefined) delete process.env["CORREOS_IT"];
  else process.env["CORREOS_IT"] = anterior;
});

async function servidor(almacen: Almacen, email = "it@empresa.com") {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _reply, hecho) => {
    request.persona = { email, nombre: "Persona" };
    hecho();
  });
  await app.register(rutas, { almacen });
  return app;
}

const alta = (app: Awaited<ReturnType<typeof servidor>>, payload: unknown) =>
  app.inject({ method: "POST", url: "/api/equipos", payload: payload as object });

describe("POST /api/equipos", () => {
  it("da de alta «Portátil 07»: 201 con id nuevo, nombre y estado «disponible»", async () => {
    const almacen = almacenEnMemoria();
    const app = await servidor(almacen);
    const respuesta = await alta(app, { nombre: "Portátil 07" });
    expect(respuesta.statusCode).toBe(201);
    const cuerpo = respuesta.json<{ id: string; nombre: string; estado: string }>();
    expect(cuerpo.id).not.toBe("");
    expect(cuerpo).toEqual({ id: cuerpo.id, nombre: "Portátil 07", estado: "disponible" });
    expect(await obtenerEquipo(almacen, cuerpo.id)).toEqual({ id: cuerpo.id, nombre: "Portátil 07" });
  });

  it("con el nombre vacío responde 400 «Falta el nombre del equipo» y no crea nada", async () => {
    const almacen = almacenEnMemoria();
    const app = await servidor(almacen);
    for (const cuerpo of [{ nombre: "" }, { nombre: "   " }, {}]) {
      const respuesta = await alta(app, cuerpo);
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
    }
    expect(await listarEquipos(almacen)).toEqual([]);
  });

  it("con « portátil 07 » ya dado de alta «Portátil 07» responde 409 y sigue habiendo uno", async () => {
    const almacen = almacenEnMemoria();
    const app = await servidor(almacen);
    await alta(app, { nombre: "Portátil 07" });
    const respuesta = await alta(app, { nombre: " portátil 07 " });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "Ya hay un equipo con ese nombre" });
    expect(await listarEquipos(almacen)).toHaveLength(1);
  });

  it("dos altas a la vez del mismo nombre: una 201 y otra 409", async () => {
    const almacen = almacenEnMemoria();
    const app = await servidor(almacen);
    const respuestas = await Promise.all([alta(app, { nombre: "Monitor" }), alta(app, { nombre: "MONITOR" })]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(await listarEquipos(almacen)).toHaveLength(1);
  });

  it("admite nombres con «/» y «.» como clave", async () => {
    const almacen = almacenEnMemoria();
    const app = await servidor(almacen);
    expect((await alta(app, { nombre: "a/b" })).statusCode).toBe(201);
    expect((await alta(app, { nombre: ".." })).statusCode).toBe(201);
    expect((await alta(app, { nombre: "A/B" })).statusCode).toBe(409);
  });

  it("una cuenta que no es de IT recibe 403 «Solo IT puede hacer esto.» y no se crea nada", async () => {
    const almacen = almacenEnMemoria();
    const app = await servidor(almacen, "ana.perez@empresa.com");
    const respuesta = await alta(app, { nombre: "Portátil 07" });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await listarEquipos(almacen)).toEqual([]);
  });
});

describe("lectura para otros contextos", () => {
  it("obtenerEquipo devuelve undefined si no existe", async () => {
    expect(await obtenerEquipo(almacenEnMemoria(), "no-existe")).toBeUndefined();
  });
});
