import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { crearServidor } from "../../app/server.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { listarEquipos, obtenerEquipo, rutas } from "./index.js";

const IT = { email: "it@empresa.com", nombre: "IT" };
const ANA = { email: "ana.perez@empresa.com", nombre: "Ana" };
const PERSONAS = new Map([
  ["token-it", IT],
  ["token-ana", ANA],
]);
const verificarToken = (token: string) => Promise.resolve(PERSONAS.get(token) ?? null);

let app: FastifyInstance;
let almacen: Almacen;
let correosIt: string | undefined;

beforeEach(async () => {
  correosIt = process.env["CORREOS_IT"];
  process.env["CORREOS_IT"] = "it@empresa.com";
  almacen = almacenEnMemoria();
  app = await crearServidor({ googleClientId: "cliente", verificarToken, almacen, contextos: [rutas] });
});

afterEach(async () => {
  await app.close();
  if (correosIt === undefined) delete process.env["CORREOS_IT"];
  else process.env["CORREOS_IT"] = correosIt;
});

const alta = (nombre: unknown, token = "token-it") =>
  app.inject({ method: "POST", url: "/api/equipos", headers: { authorization: `Bearer ${token}` }, payload: { nombre } });

describe("sesión de la API de equipos (HU-ACC-01)", () => {
  it("sin token responde 401 «Inicia sesión con Google.»", async () => {
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre: "Portátil 07" } });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("con un token de otro cliente OAuth responde 401 y no crea ningún equipo", async () => {
    const respuesta = await alta("Portátil 07", "token-de-otro-cliente");
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
    expect(await almacen.listar("equipos")).toEqual([]);
  });

  it("con un token válido de IT atiende la petición", async () => {
    expect((await alta("Portátil 07")).statusCode).toBe(201);
  });
});

describe("alta de equipos", () => {
  it("crea el equipo disponible con su id y nombre", async () => {
    const respuesta = await alta("Portátil 07");
    expect(respuesta.statusCode).toBe(201);
    const cuerpo = respuesta.json<{ id: string; nombre: string; estado: string }>();
    expect(cuerpo.id).not.toBe("");
    expect({ nombre: cuerpo.nombre, estado: cuerpo.estado }).toEqual({ nombre: "Portátil 07", estado: "disponible" });
    expect(await obtenerEquipo(almacen, cuerpo.id)).toEqual({
      id: cuerpo.id,
      nombre: "Portátil 07",
      nombreNormalizado: "portátil 07",
    });
  });

  it("rechaza un nombre repetido aunque cambien mayúsculas o espacios, sin crear otro equipo", async () => {
    await alta("Portátil 07");
    const respuesta = await alta(" portátil 07 ");
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "Ya hay un equipo con ese nombre" });
    expect(await almacen.listar("equipos")).toHaveLength(1);
  });

  it("con dos altas a la vez del mismo nombre, una sale bien y la otra recibe 409", async () => {
    const respuestas = await Promise.all([alta("Monitor 03"), alta("MONITOR 03")]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(await almacen.listar("equipos")).toHaveLength(1);
  });

  it.each([[""], ["   "], [undefined], [42]])("con el nombre %j responde 400 «Falta el nombre del equipo»", async (nombre) => {
    const respuesta = await alta(nombre);
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
  });

  it("responde 403 «Solo IT puede hacer esto.» a una cuenta que no es de IT y no crea el equipo", async () => {
    const respuesta = await alta("Portátil 07", "token-ana");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.listar("equipos")).toEqual([]);
  });

  it("reconoce a IT sin distinguir mayúsculas en el correo", async () => {
    process.env["CORREOS_IT"] = "IT@Empresa.com, inventario@empresa.com";
    expect((await alta("Portátil 07")).statusCode).toBe(201);
  });
});

describe("listarEquipos", () => {
  it("devuelve los equipos con su id, ordenados por nombre, y una lista vacía si no hay", async () => {
    expect(await listarEquipos(almacen)).toEqual([]);
    const monitor = (await alta("Monitor 03")).json<{ id: string }>();
    const portatil = (await alta("Portátil 07")).json<{ id: string }>();
    expect(await listarEquipos(almacen)).toEqual([
      { id: monitor.id, nombre: "Monitor 03", nombreNormalizado: "monitor 03" },
      { id: portatil.id, nombre: "Portátil 07", nombreNormalizado: "portátil 07" },
    ]);
  });
});

describe("obtenerEquipo", () => {
  it("devuelve undefined si el equipo no existe", async () => {
    expect(await obtenerEquipo(almacen, "999")).toBeUndefined();
  });
});
