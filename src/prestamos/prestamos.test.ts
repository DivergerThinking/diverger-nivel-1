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

describe("pedir un equipo disponible (HU-SOL-02)", () => {
  const pedir = (id: string, payload: object) =>
    app.inject({
      method: "POST",
      url: `/api/equipos/${id}/solicitud`,
      headers: { authorization: "Bearer token-ana" },
      payload,
    });

  beforeEach(async () => {
    await almacen.guardar("equipos", "42", { nombre: "Portátil 07", nombreNormalizado: "portátil 07" });
    await almacen.guardar("nombresEquipo", "portátil%2007", { equipo: "42" });
  });

  it("responde 201 con el equipo reservado a quien lo pide y guarda el préstamo", async () => {
    const respuesta = await pedir("42", { devolucion: "2999-12-01" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id: "42",
      nombre: "Portátil 07",
      estado: "reservado",
      persona: "ana.perez@empresa.com",
      devolucion: "2999-12-01",
    });
    expect(await almacen.listar("prestamos")).toMatchObject([{ equipo: "42", persona: "ana.perez@empresa.com", estado: "reservado" }]);
  });

  it("responde 400 con el mensaje del contrato y el equipo sigue disponible", async () => {
    const casos: [object, string][] = [
      [{ devolucion: "2000-01-01" }, "La fecha de devolución ya ha pasado"],
      [{ devolucion: "2026-02-30" }, "La fecha de devolución no es válida"],
      [{}, "Falta la fecha de devolución"],
    ];
    for (const [payload, error] of casos) {
      const respuesta = await pedir("42", payload);
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error });
    }
    expect(await almacen.obtener("estadosEquipo", "42")).toBeUndefined();
    expect((await listar("token-ana")).json()).toEqual([{ id: "42", nombre: "Portátil 07", estado: "disponible" }]);
  });

  it("responde 409 si el equipo ya está reservado a otra persona y 404 si no existe", async () => {
    await almacen.guardar("estadosEquipo", "42", { estado: "reservado", persona: "luis.gomez@empresa.com", devolucion: "2999-12-01" });
    const ocupado = await pedir("42", { devolucion: "2999-12-01" });
    expect(ocupado.statusCode).toBe(409);
    expect(ocupado.json()).toEqual({ error: "El equipo no está disponible" });
    const inexistente = await pedir("999", { devolucion: "2999-12-01" });
    expect(inexistente.statusCode).toBe(404);
    expect(inexistente.json()).toEqual({ error: "No existe el equipo" });
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
