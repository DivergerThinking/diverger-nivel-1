import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { devolverEquipo, entregarEquipo, obtenerHistorial, prestarEquipo, solicitarEquipo } from "./prestamos.js";

async function servidor() {
  const almacen = almacenEnMemoria();
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _reply, hecho) => {
    const correo = request.headers["x-correo"];
    request.persona = typeof correo === "string" ? { email: correo, nombre: correo } : null;
    hecho();
  });
  await app.register(rutas, { almacen });
  return { app, almacen };
}

async function equipo(almacen: Almacen, id: string, nombre: string) {
  await almacen.guardar("equipos_equipos", id, { id, nombre });
}

beforeEach(() => {
  vi.stubEnv("CORREOS_IT", "it@empresa.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/equipos/{id}/historial", () => {
  it("responde 200 con los préstamos del equipo, del más reciente al más antiguo", async () => {
    const { app, almacen } = await servidor();
    await equipo(almacen, "e1", "Portátil 07");
    await equipo(almacen, "e2", "Monitor 03");
    await prestarEquipo(almacen, "e1", "ana.perez@empresa.com", "2026-10-15", new Date("2026-10-01T10:00:00Z"));
    await devolverEquipo(almacen, "e1");
    await prestarEquipo(almacen, "e2", "otra.persona@empresa.com", "2026-10-20", new Date("2026-10-02T10:00:00Z"));
    await solicitarEquipo(almacen, "e1", "luis.garcia@empresa.com", "2026-12-15", new Date("2026-11-20T10:00:00Z"));
    const respuesta = await app.inject({ method: "GET", url: "/api/equipos/e1/historial", headers: { "x-correo": "it@empresa.com" } });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { persona: "luis.garcia@empresa.com", devolucion: "2026-12-15", estado: "reservado" },
      { persona: "ana.perez@empresa.com", devolucion: "2026-10-15", estado: "devuelto" },
    ]);
  });

  it("responde 200 con la lista vacía si el equipo no ha tenido préstamos", async () => {
    const { app, almacen } = await servidor();
    await equipo(almacen, "e1", "Portátil 07");
    const respuesta = await app.inject({ method: "GET", url: "/api/equipos/e1/historial", headers: { "x-correo": "it@empresa.com" } });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("responde 404 «No existe el equipo» si el id no existe", async () => {
    const { app } = await servidor();
    const respuesta = await app.inject({ method: "GET", url: "/api/equipos/nada/historial", headers: { "x-correo": "it@empresa.com" } });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 «Solo IT puede hacer esto.» a un empleado", async () => {
    const { app, almacen } = await servidor();
    await equipo(almacen, "e1", "Portátil 07");
    const respuesta = await app.inject({ method: "GET", url: "/api/equipos/e1/historial", headers: { "x-correo": "ana.perez@empresa.com" } });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });
});

describe("obtenerHistorial", () => {
  it("refleja el estado de cada préstamo: reservado, prestado y devuelto", async () => {
    const almacen = almacenEnMemoria();
    await equipo(almacen, "e1", "Portátil 07");
    await solicitarEquipo(almacen, "e1", "ana.perez@empresa.com", "2026-12-15", new Date("2026-11-20T10:00:00Z"));
    await entregarEquipo(almacen, "e1");
    expect(await obtenerHistorial(almacen, "e1")).toEqual({
      ok: true,
      historial: [{ persona: "ana.perez@empresa.com", devolucion: "2026-12-15", estado: "prestado" }],
    });
    await devolverEquipo(almacen, "e1");
    expect(await obtenerHistorial(almacen, "e1")).toEqual({
      ok: true,
      historial: [{ persona: "ana.perez@empresa.com", devolucion: "2026-12-15", estado: "devuelto" }],
    });
  });
});
