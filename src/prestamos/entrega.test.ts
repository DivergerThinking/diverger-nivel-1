import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { entregarEquipo } from "./prestamos.js";

const TECNICO = { email: "tecnico@empresa.com", nombre: "Técnico de IT" };
const ANA = "ana.perez@empresa.com";

async function conPortatilReservado(): Promise<Almacen> {
  const almacen = almacenEnMemoria();
  await almacen.guardar("equipos_equipos", "pc-07", { id: "pc-07", nombre: "Portátil 07" });
  await almacen.guardar("prestamos_estados", "pc-07", {
    estado: "reservado",
    persona: ANA,
    devolucion: "2026-11-20",
    prestamoId: "p-1",
  });
  await almacen.guardar("prestamos_prestamos", "p-1", {
    id: "p-1",
    equipoId: "pc-07",
    persona: ANA,
    devolucion: "2026-11-20",
    estado: "reservado",
    creadoEn: "2026-11-11T10:00:00.000Z",
  });
  return almacen;
}

async function conPortatilDisponible(): Promise<Almacen> {
  const almacen = almacenEnMemoria();
  await almacen.guardar("equipos_equipos", "pc-07", { id: "pc-07", nombre: "Portátil 07" });
  return almacen;
}

async function servidor(almacen: Almacen, persona = TECNICO): Promise<FastifyInstance> {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request) => {
    request.persona = persona;
    return Promise.resolve();
  });
  await app.register(rutas, { almacen });
  return app;
}

beforeEach(() => {
  vi.stubEnv("CORREOS_IT", TECNICO.email);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("entregarEquipo", () => {
  it("deja el equipo prestado con la misma persona y devolución y marca su préstamo como prestado", async () => {
    const almacen = await conPortatilReservado();
    expect(await entregarEquipo(almacen, "pc-07")).toEqual({
      id: "pc-07",
      nombre: "Portátil 07",
      estado: "prestado",
      persona: ANA,
      devolucion: "2026-11-20",
    });
    expect(await almacen.obtener("prestamos_estados", "pc-07")).toMatchObject({ estado: "prestado", prestamoId: "p-1" });
    expect(await almacen.obtener("prestamos_prestamos", "p-1")).toMatchObject({ estado: "prestado" });
  });

  it("rechaza un equipo que no existe y uno que no está reservado", async () => {
    await expect(entregarEquipo(await conPortatilReservado(), "x")).rejects.toMatchObject({
      codigo: 404,
      message: "No existe el equipo",
    });
    await expect(entregarEquipo(await conPortatilDisponible(), "pc-07")).rejects.toMatchObject({
      codigo: 409,
      message: "El equipo no está reservado",
    });
  });

  it("no entrega dos veces el mismo equipo", async () => {
    const almacen = await conPortatilReservado();
    await entregarEquipo(almacen, "pc-07");
    await expect(entregarEquipo(almacen, "pc-07")).rejects.toMatchObject({
      codigo: 409,
      message: "El equipo no está reservado",
    });
  });
});

describe("POST /api/equipos/{id}/entrega (HU-GES-02)", () => {
  it("criterio 1: un técnico de IT recibe 200 con el equipo prestado, la persona y la devolución", async () => {
    const app = await servidor(await conPortatilReservado());
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos/pc-07/entrega" });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({
      id: "pc-07",
      nombre: "Portátil 07",
      estado: "prestado",
      persona: ANA,
      devolucion: "2026-11-20",
    });
    const lista = await app.inject({ url: "/api/equipos" });
    expect(lista.json()).toEqual([
      { id: "pc-07", nombre: "Portátil 07", estado: "prestado", persona: ANA, devolucion: "2026-11-20" },
    ]);
    await app.close();
  });

  it("criterio 2: un equipo disponible da 409 «El equipo no está reservado» y sigue disponible", async () => {
    const app = await servidor(await conPortatilDisponible());
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos/pc-07/entrega" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está reservado" });
    const lista = await app.inject({ url: "/api/equipos" });
    expect(lista.json()).toEqual([{ id: "pc-07", nombre: "Portátil 07", estado: "disponible" }]);
    await app.close();
  });

  it("criterio 3: un equipo que no existe da 404 «No existe el equipo»", async () => {
    const app = await servidor(await conPortatilReservado());
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos/no-existe/entrega" });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
    await app.close();
  });

  it("una cuenta que no es de IT recibe 403 y el equipo sigue reservado", async () => {
    const almacen = await conPortatilReservado();
    const app = await servidor(almacen, { email: ANA, nombre: "Ana Pérez" });
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos/pc-07/entrega" });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.obtener("prestamos_estados", "pc-07")).toMatchObject({ estado: "reservado" });
    await app.close();
  });
});
