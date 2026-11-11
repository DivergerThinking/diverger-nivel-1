import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { devolverEquipo } from "./prestamos.js";

const TECNICO = { email: "tecnico@empresa.com", nombre: "Técnico de IT" };
const ANA = "ana.perez@empresa.com";

async function conPortatil(estado: "reservado" | "prestado" | "disponible"): Promise<Almacen> {
  const almacen = almacenEnMemoria();
  await almacen.guardar("equipos_equipos", "pc-07", { id: "pc-07", nombre: "Portátil 07" });
  if (estado === "disponible") return almacen;
  await almacen.guardar("prestamos_estados", "pc-07", {
    estado,
    persona: ANA,
    devolucion: "2026-11-20",
    prestamoId: "p-1",
  });
  await almacen.guardar("prestamos_prestamos", "p-1", {
    id: "p-1",
    equipoId: "pc-07",
    persona: ANA,
    devolucion: "2026-11-20",
    estado,
    creadoEn: "2026-11-11T10:00:00.000Z",
  });
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

describe("devolverEquipo", () => {
  it("deja el equipo disponible sin persona ni devolución y marca su préstamo como devuelto", async () => {
    const almacen = await conPortatil("prestado");
    expect(await devolverEquipo(almacen, "pc-07")).toEqual({ id: "pc-07", nombre: "Portátil 07", estado: "disponible" });
    expect(await almacen.obtener("prestamos_estados", "pc-07")).toEqual({ estado: "disponible" });
    expect(await almacen.obtener("prestamos_prestamos", "p-1")).toMatchObject({ estado: "devuelto", persona: ANA });
  });

  it("rechaza un equipo que no existe y uno que no está prestado", async () => {
    await expect(devolverEquipo(await conPortatil("prestado"), "x")).rejects.toMatchObject({
      codigo: 404,
      message: "No existe el equipo",
    });
    await expect(devolverEquipo(await conPortatil("disponible"), "pc-07")).rejects.toMatchObject({
      codigo: 409,
      message: "El equipo no está prestado",
    });
  });

  it("no devuelve dos veces el mismo equipo", async () => {
    const almacen = await conPortatil("prestado");
    await devolverEquipo(almacen, "pc-07");
    await expect(devolverEquipo(almacen, "pc-07")).rejects.toMatchObject({
      codigo: 409,
      message: "El equipo no está prestado",
    });
  });
});

describe("POST /api/equipos/{id}/devolucion (HU-GES-04)", () => {
  it("criterio 1: un técnico de IT recibe 200 con el equipo disponible, sin persona ni devolución", async () => {
    const app = await servidor(await conPortatil("prestado"));
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos/pc-07/devolucion" });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({ id: "pc-07", nombre: "Portátil 07", estado: "disponible" });
    const lista = await app.inject({ url: "/api/equipos" });
    expect(lista.json()).toEqual([{ id: "pc-07", nombre: "Portátil 07", estado: "disponible" }]);
    await app.close();
  });

  it("criterio 2: un equipo reservado da 409 «El equipo no está prestado» y la reserva no cambia", async () => {
    const app = await servidor(await conPortatil("reservado"));
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos/pc-07/devolucion" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está prestado" });
    const lista = await app.inject({ url: "/api/equipos" });
    expect(lista.json()).toEqual([
      { id: "pc-07", nombre: "Portátil 07", estado: "reservado", persona: ANA, devolucion: "2026-11-20" },
    ]);
    await app.close();
  });

  it("criterio 3: un equipo que no existe da 404 «No existe el equipo»", async () => {
    const app = await servidor(await conPortatil("prestado"));
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos/no-existe/devolucion" });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
    await app.close();
  });

  it("una cuenta que no es de IT recibe 403 y el equipo sigue prestado", async () => {
    const almacen = await conPortatil("prestado");
    const app = await servidor(almacen, { email: ANA, nombre: "Ana Pérez" });
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos/pc-07/devolucion" });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.obtener("prestamos_estados", "pc-07")).toMatchObject({ estado: "prestado" });
    await app.close();
  });
});
