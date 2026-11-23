import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { listarVencidos } from "./prestamos.js";

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

async function equipo(almacen: Almacen, id: string, nombre: string, estado: "reservado" | "prestado" | null, devolucion: string) {
  await almacen.guardar("equipos_equipos", id, { id, nombre });
  if (estado) {
    await almacen.guardar("prestamos_activos", id, { id, prestamo: `p-${id}`, persona: "ana.perez@empresa.com", devolucion, estado });
  }
}

const HOY = new Date("2026-11-23T10:00:00+01:00");

beforeEach(() => {
  vi.stubEnv("CORREOS_IT", "it@empresa.com");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(HOY);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("GET /api/prestamos/vencidos", () => {
  it("responde 200 con los prestados vencidos, del más antiguo al más reciente, sin el que vence hoy", async () => {
    const { app, almacen } = await servidor();
    await equipo(almacen, "e1", "Portátil 07", "prestado", "2026-11-18");
    await equipo(almacen, "e2", "Monitor 03", "prestado", "2026-11-10");
    await equipo(almacen, "e3", "Proyector 01", "prestado", "2026-11-23");
    const respuesta = await app.inject({ method: "GET", url: "/api/prestamos/vencidos", headers: { "x-correo": "it@empresa.com" } });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { id: "e2", nombre: "Monitor 03", persona: "ana.perez@empresa.com", devolucion: "2026-11-10" },
      { id: "e1", nombre: "Portátil 07", persona: "ana.perez@empresa.com", devolucion: "2026-11-18" },
    ]);
  });

  it("responde 200 sin los equipos reservados, porque solo cuentan los prestados", async () => {
    const { app, almacen } = await servidor();
    await equipo(almacen, "e1", "Portátil 07", "reservado", "2026-11-20");
    const respuesta = await app.inject({ method: "GET", url: "/api/prestamos/vencidos", headers: { "x-correo": "it@empresa.com" } });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("responde 403 «Solo IT puede hacer esto.» a un empleado", async () => {
    const { app } = await servidor();
    const respuesta = await app.inject({ method: "GET", url: "/api/prestamos/vencidos", headers: { "x-correo": "ana.perez@empresa.com" } });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });
});

describe("listarVencidos", () => {
  it("cuenta el día en Madrid: a las 23:30 UTC del 22 ya es 23 y lo del 22 está vencido", async () => {
    const almacen = almacenEnMemoria();
    await equipo(almacen, "e1", "Portátil 07", "prestado", "2026-11-22");
    expect(await listarVencidos(almacen, new Date("2026-11-22T23:30:00Z"))).toHaveLength(1);
    expect(await listarVencidos(almacen, new Date("2026-11-22T10:00:00Z"))).toHaveLength(0);
  });
});
