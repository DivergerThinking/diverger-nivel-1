import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { crearServidor } from "../../app/server.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas as rutasEquipos } from "../equipos/index.js";
import { rutas } from "./index.js";
import { obtenerHistorial } from "./operaciones.js";

const verificarToken = (token: string) =>
  Promise.resolve(
    token === "token-it"
      ? { email: "it@empresa.com", nombre: "IT" }
      : token === "token-ana"
        ? { email: "ana.perez@empresa.com", nombre: "Ana" }
        : null,
  );

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

async function darDeAlta(id: string, nombre: string): Promise<void> {
  await almacen.guardar("equipos", id, { nombre, nombreNormalizado: nombre.toLowerCase() });
  await almacen.guardar("nombresEquipo", encodeURIComponent(nombre.toLowerCase()), { equipo: id });
}

async function guardarPrestamo(
  id: string,
  equipo: string,
  persona: string,
  devolucion: string,
  estado: "reservado" | "prestado" | "devuelto",
  creado: string,
): Promise<void> {
  await almacen.guardar("prestamos", id, { equipo, persona, devolucion, estado, creado });
}

describe("consultar el historial de un equipo (HU-SEG-02)", () => {
  it("criterio 1: primero el préstamo reservado de luis y después el devuelto de ana", async () => {
    await darDeAlta("42", "Portátil 42");
    await guardarPrestamo("p1", "42", "ana.perez@empresa.com", "2026-10-15", "devuelto", "2026-10-01T09:00:00.000Z");
    await guardarPrestamo("p2", "42", "luis.gomez@empresa.com", "2026-12-01", "reservado", "2026-11-20T09:00:00.000Z");
    const respuesta = await app.inject({
      method: "GET",
      url: "/api/equipos/42/historial",
      headers: { authorization: "Bearer token-it" },
    });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { persona: "luis.gomez@empresa.com", devolucion: "2026-12-01", estado: "reservado" },
      { persona: "ana.perez@empresa.com", devolucion: "2026-10-15", estado: "devuelto" },
    ]);
  });

  it("solo incluye los préstamos del equipo consultado", async () => {
    await darDeAlta("1", "Monitor 01");
    await darDeAlta("2", "Monitor 02");
    await guardarPrestamo("p1", "1", "ana.perez@empresa.com", "2026-10-15", "devuelto", "2026-10-01T09:00:00.000Z");
    await guardarPrestamo("p2", "2", "luis.gomez@empresa.com", "2026-12-01", "prestado", "2026-11-20T09:00:00.000Z");
    expect(await obtenerHistorial(almacen, "1")).toEqual({
      ok: true,
      valor: [{ persona: "ana.perez@empresa.com", devolucion: "2026-10-15", estado: "devuelto" }],
    });
  });

  it("un equipo sin préstamos tiene el historial vacío", async () => {
    await darDeAlta("5", "Proyector 05");
    expect(await obtenerHistorial(almacen, "5")).toEqual({ ok: true, valor: [] });
  });

  it("criterio 2: un equipo que no existe responde 404 «No existe el equipo»", async () => {
    const respuesta = await app.inject({
      method: "GET",
      url: "/api/equipos/999/historial",
      headers: { authorization: "Bearer token-it" },
    });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("quien no es de IT recibe 403 «Solo IT puede hacer esto.»", async () => {
    await darDeAlta("42", "Portátil 42");
    const respuesta = await app.inject({
      method: "GET",
      url: "/api/equipos/42/historial",
      headers: { authorization: "Bearer token-ana" },
    });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });

  it("sin sesión responde 401 «Inicia sesión con Google.»", async () => {
    const respuesta = await app.inject({ method: "GET", url: "/api/equipos/42/historial" });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});
