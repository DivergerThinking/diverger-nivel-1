import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { normalizarNombre, rutas } from "./index.js";

const original = process.env["CORREOS_IT"];
let almacen: Almacen;

beforeEach(() => {
  process.env["CORREOS_IT"] = "it@empresa.com";
  almacen = almacenEnMemoria();
});
afterEach(() => {
  if (original === undefined) delete process.env["CORREOS_IT"];
  else process.env["CORREOS_IT"] = original;
});

// La sesión se toma de la cabecera «x-correo», como la dejaría el servidor en request.persona.
async function servidor() {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _reply, hecho) => {
    const correo = request.headers["x-correo"];
    if (typeof correo === "string") request.persona = { email: correo, nombre: correo };
    hecho();
  });
  await app.register(rutas, { almacen });
  return app;
}

async function alta(cuerpo: unknown, correo = "it@empresa.com") {
  const app = await servidor();
  return app.inject({ method: "POST", url: "/api/equipos", headers: { "x-correo": correo }, payload: cuerpo as object });
}

describe("nombre normalizado", () => {
  it("recorta los espacios y pasa a minúsculas", () => {
    expect(normalizarNombre("  PORTÁTIL 07 ")).toBe("portátil 07");
  });
});

describe("POST /api/equipos", () => {
  it("da de alta un equipo disponible", async () => {
    const respuesta = await alta({ nombre: "Portátil 07" });
    expect(respuesta.statusCode).toBe(201);
    const equipo = respuesta.json<{ id: string; nombre: string; estado: string }>();
    expect(typeof equipo.id).toBe("string");
    expect(equipo.id).not.toBe("");
    expect({ nombre: equipo.nombre, estado: equipo.estado }).toEqual({ nombre: "Portátil 07", estado: "disponible" });
    expect(await almacen.listar("equipos")).toHaveLength(1);
    expect(await almacen.listar("equipos_nombres")).toHaveLength(1);
  });

  it("con el nombre vacío responde 400 y no crea nada", async () => {
    const respuesta = await alta({ nombre: "" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
    expect(await almacen.listar("equipos")).toHaveLength(0);
  });

  it("con el nombre solo de espacios responde 400", async () => {
    const respuesta = await alta({ nombre: "   " });
    expect(respuesta.statusCode).toBe(400);
  });

  it("con el cuerpo {} responde 400 y no crea nada", async () => {
    const respuesta = await alta({});
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
    expect(await almacen.listar("equipos")).toHaveLength(0);
  });

  it("con un nombre que no es texto responde 400", async () => {
    const respuesta = await alta({ nombre: 7 });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
  });

  it("con un nombre repetido en otras mayúsculas responde 409 y sigue habiendo uno", async () => {
    await alta({ nombre: "Portátil 07" });
    const respuesta = await alta({ nombre: "PORTÁTIL 07" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "Ya hay un equipo con ese nombre" });
    expect(await almacen.listar("equipos")).toHaveLength(1);
  });

  it("con un nombre repetido con espacios alrededor responde 409 y sigue habiendo uno", async () => {
    await alta({ nombre: "Portátil 07" });
    const respuesta = await alta({ nombre: " portátil 07 " });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "Ya hay un equipo con ese nombre" });
    expect(await almacen.listar("equipos")).toHaveLength(1);
  });

  it("dos altas simultáneas del mismo nombre: una 201 y otra 409", async () => {
    const respuestas = await Promise.all([alta({ nombre: "Monitor 01" }), alta({ nombre: "monitor 01" })]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(await almacen.listar("equipos")).toHaveLength(1);
  });

  it("acepta nombres con barras", async () => {
    const respuesta = await alta({ nombre: "Proyector A/B" });
    expect(respuesta.statusCode).toBe(201);
  });

  it("una cuenta que no es de IT recibe 403 y no se crea nada", async () => {
    const respuesta = await alta({ nombre: "Portátil 07" }, "ana.perez@empresa.com");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.listar("equipos")).toHaveLength(0);
  });
});
