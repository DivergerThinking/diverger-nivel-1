import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import type { Persona } from "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { listarEquipos, obtenerEquipo, rutas } from "./index.js";

let app: FastifyInstance | undefined;

async function servidor(persona: Persona | null, almacen: Almacen = almacenEnMemoria()): Promise<FastifyInstance> {
  const nuevo = Fastify();
  nuevo.decorateRequest("persona", null);
  nuevo.addHook("onRequest", (request, _reply, hecho) => {
    request.persona = persona;
    hecho();
  });
  await nuevo.register(rutas, { almacen });
  app = nuevo;
  return nuevo;
}

const it1: Persona = { email: "IT@Empresa.com", nombre: "IT" };
const ana: Persona = { email: "ana.perez@empresa.com", nombre: "Ana" };

afterEach(async () => {
  await app?.close();
  app = undefined;
  delete process.env.CORREOS_IT;
});

describe("POST /api/equipos: solo IT", () => {
  it("rechaza con 403 a una empleada y no crea ningún equipo", async () => {
    process.env.CORREOS_IT = "it@empresa.com";
    const almacen = almacenEnMemoria();
    const respuesta = await (await servidor(ana, almacen)).inject({
      method: "POST",
      url: "/api/equipos",
      payload: { nombre: "Portátil 07" },
    });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await listarEquipos(almacen)).toEqual([]);
    expect(await almacen.listar("equipos_nombres")).toEqual([]);
  });

  it("comprueba el permiso antes que el nombre", async () => {
    process.env.CORREOS_IT = "it@empresa.com";
    const respuesta = await (await servidor(ana)).inject({ method: "POST", url: "/api/equipos", payload: {} });
    expect(respuesta.statusCode).toBe(403);
  });

  it("responde 401 sin sesión", async () => {
    process.env.CORREOS_IT = "it@empresa.com";
    const respuesta = await (await servidor(null)).inject({
      method: "POST",
      url: "/api/equipos",
      payload: { nombre: "Portátil 07" },
    });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("deja dar de alta a una cuenta de la lista, aunque cambien las mayúsculas", async () => {
    process.env.CORREOS_IT = "it@empresa.com,inventario@empresa.com";
    const almacen = almacenEnMemoria();
    const respuesta = await (await servidor(it1, almacen)).inject({
      method: "POST",
      url: "/api/equipos",
      payload: { nombre: "Portátil 07" },
    });
    expect(respuesta.statusCode).toBe(201);
    const creado = respuesta.json<{ id: string; nombre: string; estado: string }>();
    expect(creado).toMatchObject({ nombre: "Portátil 07", estado: "disponible" });
    expect(await obtenerEquipo(almacen, creado.id)).toEqual({ id: creado.id, nombre: "Portátil 07" });
  });
});

describe("POST /api/equipos: alta", () => {
  it("responde 400 si el nombre falta o está vacío", async () => {
    process.env.CORREOS_IT = "it@empresa.com";
    const servidorIt = await servidor(it1);
    for (const payload of [{}, { nombre: "" }, { nombre: "   " }]) {
      const respuesta = await servidorIt.inject({ method: "POST", url: "/api/equipos", payload });
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
    }
  });

  it("responde 409 con el mismo nombre normalizado y no crea otro equipo", async () => {
    process.env.CORREOS_IT = "it@empresa.com";
    const almacen = almacenEnMemoria();
    const servidorIt = await servidor(it1, almacen);
    await servidorIt.inject({ method: "POST", url: "/api/equipos", payload: { nombre: "Portátil 07" } });
    const respuesta = await servidorIt.inject({
      method: "POST",
      url: "/api/equipos",
      payload: { nombre: "  portátil 07 " },
    });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "Ya hay un equipo con ese nombre" });
    expect(await listarEquipos(almacen)).toHaveLength(1);
  });

  it("de dos altas simultáneas con el mismo nombre, una recibe 201 y la otra 409", async () => {
    process.env.CORREOS_IT = "it@empresa.com";
    const servidorIt = await servidor(it1);
    const respuestas = await Promise.all(
      [1, 2].map(() => servidorIt.inject({ method: "POST", url: "/api/equipos", payload: { nombre: "Monitor 02" } })),
    );
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
  });

  it("admite nombres con barras y puntos", async () => {
    process.env.CORREOS_IT = "it@empresa.com";
    const respuesta = await (await servidor(it1)).inject({
      method: "POST",
      url: "/api/equipos",
      payload: { nombre: "../Sala 1/2" },
    });
    expect(respuesta.statusCode).toBe(201);
  });
});
