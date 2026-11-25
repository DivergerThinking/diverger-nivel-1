import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { crearServidor } from "../../app/server.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas as rutasEquipos } from "../equipos/index.js";
import { rutas } from "./index.js";

const PERSONAS: Record<string, { email: string; nombre: string }> = {
  "token-it": { email: "it@empresa.com", nombre: "IT" },
  "token-ana": { email: "ana.perez@empresa.com", nombre: "Ana" },
};
const verificarToken = (token: string) => Promise.resolve(PERSONAS[token] ?? null);

let app: FastifyInstance;
let almacen: Almacen;
let correosIt: string | undefined;

beforeEach(async () => {
  correosIt = process.env["CORREOS_IT"];
  process.env["CORREOS_IT"] = "it@empresa.com";
  almacen = almacenEnMemoria();
  app = await crearServidor({ googleClientId: "cliente", verificarToken, almacen, contextos: [rutasEquipos, rutas] });
  await almacen.guardar("equipos", "42", { nombre: "Portátil 07", nombreNormalizado: "portátil 07" });
  await almacen.guardar("nombresEquipo", "portátil%2007", { equipo: "42" });
});

afterEach(async () => {
  await app.close();
  if (correosIt === undefined) delete process.env["CORREOS_IT"];
  else process.env["CORREOS_IT"] = correosIt;
});

const devolver = (id: string, token = "token-it") =>
  app.inject({ method: "POST", url: `/api/equipos/${id}/devolucion`, headers: { authorization: `Bearer ${token}` } });

describe("apuntar la devolución de un equipo (HU-GES-04)", () => {
  it("responde 200 con el equipo disponible, sin persona ni devolución, y cierra el préstamo", async () => {
    await almacen.guardar("prestamos", "p1", {
      equipo: "42",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-12-01",
      estado: "prestado",
      creado: "2026-11-01T00:00:00.000Z",
    });
    await almacen.guardar("estadosEquipo", "42", {
      estado: "prestado",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-12-01",
      prestamo: "p1",
    });
    const respuesta = await devolver("42");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({ id: "42", nombre: "Portátil 07", estado: "disponible" });
    expect(await almacen.obtener("prestamos", "p1")).toMatchObject({ estado: "devuelto", persona: "luis.gomez@empresa.com" });
    const lista = await app.inject({ method: "GET", url: "/api/equipos", headers: { authorization: "Bearer token-it" } });
    expect(lista.json()).toEqual([{ id: "42", nombre: "Portátil 07", estado: "disponible" }]);
  });

  it("responde 409 «El equipo no está prestado» si está reservado y sigue reservado", async () => {
    await almacen.guardar("estadosEquipo", "42", { estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-12-01" });
    const respuesta = await devolver("42");
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está prestado" });
    expect(await almacen.obtener("estadosEquipo", "42")).toMatchObject({ estado: "reservado", persona: "ana.perez@empresa.com" });
  });

  it("responde 409 «El equipo no está prestado» si ya está disponible", async () => {
    const respuesta = await devolver("42");
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está prestado" });
  });

  it("responde 404 «No existe el equipo» si no existe", async () => {
    const respuesta = await devolver("999");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("una cuenta que no es de IT recibe 403 y el equipo sigue prestado", async () => {
    await almacen.guardar("estadosEquipo", "42", { estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-12-01" });
    const respuesta = await devolver("42", "token-ana");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.obtener("estadosEquipo", "42")).toMatchObject({ estado: "prestado" });
  });

  it("sin token responde 401", async () => {
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos/42/devolucion" });
    expect(respuesta.statusCode).toBe(401);
  });
});
