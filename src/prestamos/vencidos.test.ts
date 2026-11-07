import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { COLECCION_ESTADOS, type EstadoGuardado } from "./estados.js";
import { rutas } from "./index.js";

const IT = "it@empresa.com";
const EMPLEADO = "luis.garcia@empresa.com";

async function servidor(almacen: Almacen, email: string): Promise<FastifyInstance> {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _reply, hecho) => {
    request.persona = { email, nombre: email };
    hecho();
  });
  await app.register(rutas, { almacen });
  await app.ready();
  return app;
}

async function ocupar(
  almacen: Almacen,
  id: string,
  nombre: string,
  estado: "reservado" | "prestado",
  devolucion: string,
  persona = "marta.ruiz@empresa.com",
): Promise<void> {
  await almacen.guardar("equipos_equipos", id, { id, nombre, estado: "disponible" });
  const guardado: EstadoGuardado = { estado, persona, devolucion, prestamoId: `p-${id}` };
  await almacen.guardar(COLECCION_ESTADOS, id, guardado);
}

function consultar(app: FastifyInstance) {
  return app.inject({ method: "GET", url: "/api/prestamos/vencidos" });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-06T10:00:00Z"));
  vi.stubEnv("CORREOS_IT", IT);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("ver los préstamos vencidos", () => {
  it("lista los prestados con devolución anterior a hoy, del más antiguo al más reciente", async () => {
    const almacen = almacenEnMemoria();
    await ocupar(almacen, "e1", "Portátil 07", "prestado", "2026-11-01");
    await ocupar(almacen, "e2", "Proyector 02", "prestado", "2026-10-20");
    await ocupar(almacen, "e3", "Monitor 03", "prestado", "2026-11-06");
    await ocupar(almacen, "e4", "Portátil 09", "reservado", "2026-11-10");
    const respuesta = await consultar(await servidor(almacen, IT));
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { id: "e2", nombre: "Proyector 02", persona: "marta.ruiz@empresa.com", devolucion: "2026-10-20" },
      { id: "e1", nombre: "Portátil 07", persona: "marta.ruiz@empresa.com", devolucion: "2026-11-01" },
    ]);
  });

  it("incluye un préstamo del mostrador con devolución apuntada con retraso", async () => {
    const almacen = almacenEnMemoria();
    await ocupar(almacen, "e5", "Proyector 05", "prestado", "2026-11-01");
    const respuesta = await consultar(await servidor(almacen, IT));
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { id: "e5", nombre: "Proyector 05", persona: "marta.ruiz@empresa.com", devolucion: "2026-11-01" },
    ]);
  });

  it("usa el día de Madrid: la devolución de hoy no vence aunque en UTC ya sea otro día", async () => {
    vi.setSystemTime(new Date("2026-11-06T23:30:00Z"));
    const almacen = almacenEnMemoria();
    await ocupar(almacen, "e1", "Monitor 03", "prestado", "2026-11-06");
    await ocupar(almacen, "e2", "Monitor 04", "prestado", "2026-11-07");
    const respuesta = await consultar(await servidor(almacen, IT));
    expect(respuesta.json()).toEqual([
      { id: "e1", nombre: "Monitor 03", persona: "marta.ruiz@empresa.com", devolucion: "2026-11-06" },
    ]);
  });

  it("responde lista vacía si no hay vencidos", async () => {
    const respuesta = await consultar(await servidor(almacenEnMemoria(), IT));
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("responde 403 «Solo IT puede hacer esto.» a un empleado y no muestra préstamos", async () => {
    const almacen = almacenEnMemoria();
    await ocupar(almacen, "e1", "Portátil 07", "prestado", "2026-11-01");
    const respuesta = await consultar(await servidor(almacen, EMPLEADO));
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });
});
