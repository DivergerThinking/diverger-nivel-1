import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { obtenerHistorial } from "./prestamos.js";

const TECNICO = { email: "tecnico@empresa.com", nombre: "Técnico de IT" };
const ANA = "ana.perez@empresa.com";
const LUIS = "luis.gomez@empresa.com";

async function conPrestamo(
  almacen: Almacen,
  id: string,
  equipoId: string,
  persona: string,
  devolucion: string,
  estado: "reservado" | "prestado" | "devuelto",
  creadoEn: string,
): Promise<void> {
  await almacen.guardar("prestamos_prestamos", id, { id, equipoId, persona, devolucion, estado, creadoEn });
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

describe("GET /api/equipos/:id/historial", () => {
  it("lista los préstamos del equipo del más reciente al más antiguo", async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "pc-07", { id: "pc-07", nombre: "Portátil 07" });
    await conPrestamo(almacen, "p1", "pc-07", LUIS, "2026-10-15", "devuelto", "2026-10-01T09:00:00.000Z");
    await conPrestamo(almacen, "p2", "pc-07", ANA, "2026-11-20", "reservado", "2026-11-10T09:00:00.000Z");
    const app = await servidor(almacen);

    const respuesta = await app.inject({ method: "GET", url: "/api/equipos/pc-07/historial" });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { persona: ANA, devolucion: "2026-11-20", estado: "reservado" },
      { persona: LUIS, devolucion: "2026-10-15", estado: "devuelto" },
    ]);
  });

  it("no incluye los préstamos de otros equipos", async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "pc-07", { id: "pc-07", nombre: "Portátil 07" });
    await conPrestamo(almacen, "p1", "mon-03", LUIS, "2026-10-15", "devuelto", "2026-10-01T09:00:00.000Z");
    const app = await servidor(almacen);

    const respuesta = await app.inject({ method: "GET", url: "/api/equipos/pc-07/historial" });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("responde 404 «No existe el equipo» si el equipo no existe", async () => {
    const app = await servidor(almacenEnMemoria());

    const respuesta = await app.inject({ method: "GET", url: "/api/equipos/no-existe/historial" });

    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 a una cuenta que no es de IT", async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "pc-07", { id: "pc-07", nombre: "Portátil 07" });
    const app = await servidor(almacen, { email: ANA, nombre: "Ana" });

    const respuesta = await app.inject({ method: "GET", url: "/api/equipos/pc-07/historial" });

    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });
});

describe("obtenerHistorial", () => {
  it("refleja el ciclo completo: prestado, devuelto y reservado de nuevo", async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "pc-07", { id: "pc-07", nombre: "Portátil 07" });
    const app = await servidor(almacen);
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date("2026-10-01T09:00:00.000Z"));
      await app.inject({ method: "POST", url: "/api/equipos/pc-07/prestamo", payload: { persona: LUIS, devolucion: "2026-10-15" } });
      await app.inject({ method: "POST", url: "/api/equipos/pc-07/devolucion" });
      vi.setSystemTime(new Date("2026-11-10T09:00:00.000Z"));
      await app.inject({ method: "POST", url: "/api/equipos/pc-07/solicitud", payload: { devolucion: "2026-11-20" } });
    } finally {
      vi.useRealTimers();
    }

    const historial = await obtenerHistorial(almacen, "pc-07");

    expect(historial.map((e) => e.estado)).toEqual(["reservado", "devuelto"]);
    expect(historial.map((e) => e.devolucion)).toEqual(["2026-11-20", "2026-10-15"]);
  });
});
