import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { crearServidor } from "../../app/server.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas as rutasEquipos } from "../equipos/index.js";
import { rutas } from "./index.js";
import { listarVencidos, prestarEquipo } from "./operaciones.js";

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

const prestar = (id: string, payload: object, token = "token-it") =>
  app.inject({ method: "POST", url: `/api/equipos/${id}/prestamo`, headers: { authorization: `Bearer ${token}` }, payload });

describe("prestar un equipo en el mostrador (HU-GES-03)", () => {
  it("responde 201 con el equipo prestado y guarda el préstamo", async () => {
    const respuesta = await prestar("42", { persona: "luis.gomez@empresa.com", devolucion: "2026-12-01" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id: "42",
      nombre: "Portátil 07",
      estado: "prestado",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-12-01",
    });
    expect(await almacen.listar("prestamos")).toMatchObject([{ equipo: "42", persona: "luis.gomez@empresa.com", estado: "prestado" }]);
  });

  it("acepta una fecha ya pasada y el equipo aparece entre los vencidos", async () => {
    const respuesta = await prestar("42", { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(201);
    expect(await listarVencidos(almacen, "2026-11-25")).toEqual([
      { id: "42", nombre: "Portátil 07", persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" },
    ]);
  });

  it("responde 400 «Faltan la persona o la fecha de devolución» si falta una y no cambia nada", async () => {
    for (const payload of [{ devolucion: "2026-12-01" }, { persona: "luis.gomez@empresa.com" }, {}]) {
      const respuesta = await prestar("42", payload);
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "Faltan la persona o la fecha de devolución" });
    }
    expect(await almacen.obtener("estadosEquipo", "42")).toBeUndefined();
    expect(await almacen.listar("prestamos")).toEqual([]);
  });

  it("responde 400 «La fecha de devolución no es válida» con una fecha que no existe", async () => {
    const respuesta = await prestar("42", { persona: "luis.gomez@empresa.com", devolucion: "2026-02-30" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
    expect(await almacen.obtener("estadosEquipo", "42")).toBeUndefined();
  });

  it("responde 409 «El equipo no está disponible» si está reservado o prestado y no lo cambia", async () => {
    await almacen.guardar("estadosEquipo", "42", { estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-12-01" });
    const reservado = await prestar("42", { persona: "luis.gomez@empresa.com", devolucion: "2026-12-01" });
    expect(reservado.statusCode).toBe(409);
    expect(reservado.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await almacen.obtener("estadosEquipo", "42")).toMatchObject({ estado: "reservado", persona: "ana.perez@empresa.com" });
    const segundo = await prestar("42", { persona: "otra@empresa.com", devolucion: "2026-12-02" });
    expect(segundo.statusCode).toBe(409);
  });

  it("dos préstamos del mismo equipo: uno sale bien y el otro recibe 409", async () => {
    const primero = await prestar("42", { persona: "luis.gomez@empresa.com", devolucion: "2026-12-01" });
    const segundo = await prestar("42", { persona: "otra@empresa.com", devolucion: "2026-12-02" });
    expect([primero.statusCode, segundo.statusCode]).toEqual([201, 409]);
    expect(await almacen.listar("prestamos")).toHaveLength(1);
  });

  it("responde 404 «No existe el equipo» si no existe", async () => {
    const respuesta = await prestar("999", { persona: "luis.gomez@empresa.com", devolucion: "2026-12-01" });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("una cuenta que no es de IT recibe 403 y el equipo sigue disponible", async () => {
    const respuesta = await prestar("42", { persona: "luis.gomez@empresa.com", devolucion: "2026-12-01" }, "token-ana");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.obtener("estadosEquipo", "42")).toBeUndefined();
  });

  it("sin token responde 401", async () => {
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos/42/prestamo", payload: {} });
    expect(respuesta.statusCode).toBe(401);
  });

  it("prestarEquipo rechaza una persona que no es texto", async () => {
    const r = await prestarEquipo(almacen, "42", 7, "2026-12-01");
    expect(r).toEqual({ ok: false, status: 400, error: "Faltan la persona o la fecha de devolución" });
  });
});
