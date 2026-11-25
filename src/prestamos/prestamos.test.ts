import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { crearServidor } from "../../app/server.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas as rutasEquipos } from "../equipos/index.js";
import { rutas } from "./index.js";

const ANA = { email: "ana.perez@empresa.com", nombre: "Ana" };
const verificarToken = (token: string) => Promise.resolve(token === "token-ana" ? ANA : null);

let app: FastifyInstance;
let almacen: Almacen;
let correosIt: string | undefined;

beforeEach(async () => {
  correosIt = process.env["CORREOS_IT"];
  process.env["CORREOS_IT"] = "it@empresa.com";
  almacen = almacenEnMemoria();
  app = await crearServidor({ googleClientId: "cliente", verificarToken, almacen, contextos: [rutasEquipos, rutas] });
});

afterEach(async () => {
  await app.close();
  if (correosIt === undefined) delete process.env["CORREOS_IT"];
  else process.env["CORREOS_IT"] = correosIt;
});

const listar = (token?: string) =>
  app.inject({ method: "GET", url: "/api/equipos", ...(token ? { headers: { authorization: `Bearer ${token}` } } : {}) });

describe("sesión de la API de préstamos (HU-ACC-01)", () => {
  it("con un token válido de Google responde 200 con la lista de equipos", async () => {
    await almacen.guardar("equipos", "42", { nombre: "Portátil 07", nombreNormalizado: "portátil 07" });
    await almacen.guardar("nombresEquipo", "portátil%2007", { equipo: "42" });
    const respuesta = await listar("token-ana");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([{ id: "42", nombre: "Portátil 07", estado: "disponible" }]);
  });

  it("sin token responde 401 «Inicia sesión con Google.»", async () => {
    const respuesta = await listar();
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("con un token emitido para otro cliente OAuth responde 401 en la solicitud y el equipo no cambia", async () => {
    await almacen.guardar("estadosEquipo", "42", { estado: "disponible" });
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos/42/solicitud",
      headers: { authorization: "Bearer token-de-otro-cliente" },
      payload: { devolucion: "2026-12-01" },
    });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
    expect(await almacen.obtener("estadosEquipo", "42")).toEqual({ estado: "disponible" });
    expect(await almacen.listar("prestamos")).toEqual([]);
  });
});

describe("lista de equipos", () => {
  it("responde 200 con una lista vacía si no hay equipos", async () => {
    const respuesta = await listar("token-ana");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("enseña el estado, la persona y la devolución de los equipos reservados o prestados", async () => {
    await almacen.guardar("equipos", "1", { nombre: "Portátil 07", nombreNormalizado: "portátil 07" });
    await almacen.guardar("nombresEquipo", "portátil%2007", { equipo: "1" });
    await almacen.guardar("equipos", "2", { nombre: "Proyector 02", nombreNormalizado: "proyector 02" });
    await almacen.guardar("nombresEquipo", "proyector%2002", { equipo: "2" });
    await almacen.guardar("estadosEquipo", "2", {
      estado: "prestado",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-12-01",
    });
    const respuesta = await listar("token-ana");
    expect(respuesta.json()).toEqual([
      { id: "1", nombre: "Portátil 07", estado: "disponible" },
      { id: "2", nombre: "Proyector 02", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-12-01" },
    ]);
  });
});
