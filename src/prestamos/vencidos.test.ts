import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { listarVencidos } from "./prestamos.js";

const TECNICO = { email: "tecnico@empresa.com", nombre: "Técnico de IT" };
const ANA = "ana.perez@empresa.com";

async function conEquipo(
  almacen: Almacen,
  id: string,
  nombre: string,
  estado: "reservado" | "prestado",
  devolucion: string,
): Promise<void> {
  await almacen.guardar("equipos_equipos", id, { id, nombre });
  await almacen.guardar("prestamos_estados", id, { estado, persona: ANA, devolucion, prestamoId: `p-${id}` });
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
  // El 11 de noviembre de 2026 a las 10:00 en Madrid.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T09:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("GET /api/prestamos/vencidos", () => {
  it("devuelve los prestados con devolución anterior a hoy, del más antiguo al más reciente", async () => {
    const almacen = almacenEnMemoria();
    await conEquipo(almacen, "pc-07", "Portátil 07", "prestado", "2026-11-05");
    await conEquipo(almacen, "mon-03", "Monitor 03", "prestado", "2026-11-01");
    await conEquipo(almacen, "pro-02", "Proyector 02", "prestado", "2026-11-11");
    const app = await servidor(almacen);

    const respuesta = await app.inject({ method: "GET", url: "/api/prestamos/vencidos" });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { id: "mon-03", nombre: "Monitor 03", persona: ANA, devolucion: "2026-11-01" },
      { id: "pc-07", nombre: "Portátil 07", persona: ANA, devolucion: "2026-11-05" },
    ]);
  });

  it("no incluye un equipo reservado aunque su devolución sea anterior a hoy", async () => {
    const almacen = almacenEnMemoria();
    await conEquipo(almacen, "pc-07", "Portátil 07", "reservado", "2026-11-05");
    const app = await servidor(almacen);

    const respuesta = await app.inject({ method: "GET", url: "/api/prestamos/vencidos" });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("cuenta el día de Madrid: a las 23:30 UTC ya es el día siguiente", async () => {
    const almacen = almacenEnMemoria();
    await conEquipo(almacen, "pc-07", "Portátil 07", "prestado", "2026-11-11");
    const app = await servidor(almacen);
    vi.setSystemTime(new Date("2026-11-11T23:30:00.000Z"));

    const respuesta = await app.inject({ method: "GET", url: "/api/prestamos/vencidos" });

    expect(respuesta.json()).toHaveLength(1);
  });

  it("responde 403 a una cuenta que no es de IT", async () => {
    const app = await servidor(almacenEnMemoria(), { email: ANA, nombre: "Ana" });

    const respuesta = await app.inject({ method: "GET", url: "/api/prestamos/vencidos" });

    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });
});

describe("listarVencidos", () => {
  it("ordena por fecha y, a igual fecha, por nombre", async () => {
    const almacen = almacenEnMemoria();
    await conEquipo(almacen, "b", "Monitor 03", "prestado", "2026-11-01");
    await conEquipo(almacen, "a", "Cable 01", "prestado", "2026-11-01");

    const vencidos = await listarVencidos(almacen, "2026-11-11");

    expect(vencidos.map((v) => v.nombre)).toEqual(["Cable 01", "Monitor 03"]);
  });
});
