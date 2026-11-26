import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { exigirIT, listarEquipos, obtenerEquipo, rutas } from "./index.js";

let app: FastifyInstance;
let almacen: Almacen;
let anterior: string | undefined;

/** Servidor con la sesión simulada: la persona es el correo de la cabecera x-correo. */
async function servidor(): Promise<FastifyInstance> {
  const instancia = Fastify();
  instancia.decorateRequest("persona", null);
  instancia.addHook("onRequest", (request, _reply, hecho) => {
    const correo = request.headers["x-correo"];
    request.persona = typeof correo === "string" ? { email: correo, nombre: correo } : null;
    hecho();
  });
  await instancia.register(rutas, { almacen });
  instancia.get("/api/prueba/solo-it", { preHandler: exigirIT }, () => ({ lista: [] }));
  return instancia;
}

const alta = (correo: string, cuerpo: unknown) =>
  app.inject({ method: "POST", url: "/api/equipos", headers: { "x-correo": correo }, payload: cuerpo as object });

beforeEach(async () => {
  anterior = process.env["CORREOS_IT"];
  almacen = almacenEnMemoria();
  app = await servidor();
});

afterEach(async () => {
  if (anterior === undefined) delete process.env["CORREOS_IT"];
  else process.env["CORREOS_IT"] = anterior;
  await app.close();
});

describe("POST /api/equipos", () => {
  it("una cuenta de IT, aunque con otras mayúsculas, da de alta el equipo en estado disponible", async () => {
    process.env["CORREOS_IT"] = "it@empresa.com,inventario@empresa.com";
    const respuesta = await alta("IT@Empresa.com",{ nombre: "Monitor 03" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({ id: expect.any(String) as string, nombre: "Monitor 03", estado: "disponible" });
    expect(await listarEquipos(almacen)).toHaveLength(1);
  });

  it("una cuenta que no es de IT recibe 403 y el equipo no se crea", async () => {
    process.env["CORREOS_IT"] = "it@empresa.com";
    const respuesta = await alta("ana.perez@empresa.com", { nombre: "Monitor 03" });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await listarEquipos(almacen)).toEqual([]);
  });

  it("sin CORREOS_IT nadie es de IT", async () => {
    delete process.env["CORREOS_IT"];
    expect((await alta("it@empresa.com", { nombre: "Monitor 03" })).statusCode).toBe(403);
  });

  it("sin nombre recibe 400 «Falta el nombre del equipo»", async () => {
    process.env["CORREOS_IT"] = "it@empresa.com";
    for (const cuerpo of [{ nombre: "" }, { nombre: "   " }, {}, { nombre: 7 }]) {
      const respuesta = await alta("it@empresa.com", cuerpo);
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
    }
    expect(await listarEquipos(almacen)).toEqual([]);
  });

  it("un nombre igual salvo mayúsculas o espacios recibe 409 «Ya hay un equipo con ese nombre»", async () => {
    process.env["CORREOS_IT"] = "it@empresa.com";
    expect((await alta("it@empresa.com", { nombre: "Portátil 07" })).statusCode).toBe(201);
    for (const nombre of [" portátil 07 ", "PORTÁTIL 07", "Portátil 07"]) {
      const respuesta = await alta("it@empresa.com", { nombre });
      expect(respuesta.statusCode).toBe(409);
      expect(respuesta.json()).toEqual({ error: "Ya hay un equipo con ese nombre" });
    }
    expect(await listarEquipos(almacen)).toHaveLength(1);
  });

  it("un nombre distinto sí se da de alta", async () => {
    process.env["CORREOS_IT"] = "it@empresa.com";
    await alta("it@empresa.com", { nombre: "Portátil 07" });
    expect((await alta("it@empresa.com", { nombre: "Portátil 08" })).statusCode).toBe(201);
    expect(await listarEquipos(almacen)).toHaveLength(2);
  });

  it("dos altas simultáneas del mismo nombre: una recibe 201 y la otra 409", async () => {
    process.env["CORREOS_IT"] = "it@empresa.com";
    const respuestas = await Promise.all([
      alta("it@empresa.com", { nombre: "Monitor 03" }),
      alta("it@empresa.com", { nombre: " monitor 03" }),
    ]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(await listarEquipos(almacen)).toHaveLength(1);
  });
});

describe("exigirIT en otras rutas", () => {
  it("la cuenta de servicio del inventario pasa y un empleado recibe 403", async () => {
    process.env["CORREOS_IT"] = "it@empresa.com,inventario@empresa.com";
    const servicio = await app.inject({ url: "/api/prueba/solo-it", headers: { "x-correo": "inventario@empresa.com" } });
    expect(servicio.statusCode).toBe(200);
    const empleada = await app.inject({ url: "/api/prueba/solo-it", headers: { "x-correo": "ana.perez@empresa.com" } });
    expect(empleada.statusCode).toBe(403);
    expect(empleada.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });
});

describe("consultas para otros contextos", () => {
  it("obtenerEquipo y listarEquipos devuelven los equipos dados de alta", async () => {
    process.env["CORREOS_IT"] = "it@empresa.com";
    const creado = (await alta("it@empresa.com", { nombre: "Portátil 07" })).json<{ id: string }>();
    expect(await obtenerEquipo(almacen, creado.id)).toEqual({ id: creado.id, nombre: "Portátil 07", estado: "disponible" });
    expect(await obtenerEquipo(almacen, "no-existe")).toBeUndefined();
    expect(await listarEquipos(almacen)).toHaveLength(1);
  });
});
