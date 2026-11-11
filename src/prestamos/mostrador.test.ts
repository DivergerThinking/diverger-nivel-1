import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { prestarEquipo, solicitarEquipo } from "./prestamos.js";

const TECNICO = { email: "tecnico@empresa.com", nombre: "Técnico de IT" };
const ANA = "ana.perez@empresa.com";
const LUIS = "luis.gomez@empresa.com";

async function conMonitorDisponible(): Promise<Almacen> {
  const almacen = almacenEnMemoria();
  await almacen.guardar("equipos_equipos", "mon-03", { id: "mon-03", nombre: "Monitor 03" });
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

describe("prestarEquipo", () => {
  it("deja el equipo prestado y guarda un préstamo prestado", async () => {
    const almacen = await conMonitorDisponible();
    expect(await prestarEquipo(almacen, "mon-03", ANA, "2026-11-20")).toEqual({
      id: "mon-03",
      nombre: "Monitor 03",
      estado: "prestado",
      persona: ANA,
      devolucion: "2026-11-20",
    });
    const estado = await almacen.obtener<{ prestamoId: string }>("prestamos_estados", "mon-03");
    expect(estado).toMatchObject({ estado: "prestado", persona: ANA });
    expect(await almacen.obtener("prestamos_prestamos", estado?.prestamoId ?? "")).toMatchObject({
      equipoId: "mon-03",
      persona: ANA,
      estado: "prestado",
    });
  });

  it("admite una fecha de devolución pasada", async () => {
    const equipo = await prestarEquipo(await conMonitorDisponible(), "mon-03", ANA, "2026-11-05");
    expect(equipo).toMatchObject({ estado: "prestado", devolucion: "2026-11-05" });
  });

  it("rechaza un equipo que no existe", async () => {
    await expect(prestarEquipo(await conMonitorDisponible(), "x", ANA, "2026-11-20")).rejects.toMatchObject({
      codigo: 404,
      message: "No existe el equipo",
    });
  });

  it("de dos préstamos y solicitudes simultáneos, solo uno gana", async () => {
    const almacen = await conMonitorDisponible();
    const resultados = await Promise.allSettled([
      solicitarEquipo(almacen, "mon-03", LUIS, "2026-11-20", "2026-11-11"),
      prestarEquipo(almacen, "mon-03", ANA, "2026-11-20"),
    ]);
    expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rechazo = resultados.find((r) => r.status === "rejected");
    expect(rechazo).toMatchObject({ reason: { codigo: 409, message: "El equipo no está disponible" } });
  });
});

describe("POST /api/equipos/{id}/prestamo (HU-GES-03)", () => {
  it("criterio 1: un técnico de IT recibe 201 con el equipo prestado, la persona y la devolución", async () => {
    const app = await servidor(await conMonitorDisponible());
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos/mon-03/prestamo",
      payload: { persona: ANA, devolucion: "2026-11-20" },
    });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id: "mon-03",
      nombre: "Monitor 03",
      estado: "prestado",
      persona: ANA,
      devolucion: "2026-11-20",
    });
    await app.close();
  });

  it("criterio 2: una devolución pasada se admite con 201 y el préstamo queda prestado", async () => {
    const almacen = await conMonitorDisponible();
    const app = await servidor(almacen);
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos/mon-03/prestamo",
      payload: { persona: ANA, devolucion: "2026-11-05" },
    });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toMatchObject({ estado: "prestado", devolucion: "2026-11-05" });
    expect(await almacen.listar("prestamos_prestamos")).toEqual([
      expect.objectContaining({ equipoId: "mon-03", estado: "prestado", devolucion: "2026-11-05" }),
    ]);
    await app.close();
  });

  it("criterio 3: sin persona da 400 «Faltan la persona o la fecha de devolución» y el equipo sigue disponible", async () => {
    const app = await servidor(await conMonitorDisponible());
    for (const payload of [{ devolucion: "2026-11-20" }, { persona: ANA }, {}]) {
      const respuesta = await app.inject({ method: "POST", url: "/api/equipos/mon-03/prestamo", payload });
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "Faltan la persona o la fecha de devolución" });
    }
    const lista = await app.inject({ url: "/api/equipos" });
    expect(lista.json()).toEqual([{ id: "mon-03", nombre: "Monitor 03", estado: "disponible" }]);
    await app.close();
  });

  it("criterio 4: un equipo reservado da 409 «El equipo no está disponible» y la reserva no cambia", async () => {
    const almacen = await conMonitorDisponible();
    await solicitarEquipo(almacen, "mon-03", LUIS, "2026-11-20", "2026-11-11");
    const app = await servidor(almacen);
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos/mon-03/prestamo",
      payload: { persona: ANA, devolucion: "2026-11-20" },
    });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
    const lista = await app.inject({ url: "/api/equipos" });
    expect(lista.json()).toEqual([
      { id: "mon-03", nombre: "Monitor 03", estado: "reservado", persona: LUIS, devolucion: "2026-11-20" },
    ]);
    await app.close();
  });

  it("criterio 5: una fecha que no existe da 400 «La fecha de devolución no es válida» y el equipo sigue disponible", async () => {
    const app = await servidor(await conMonitorDisponible());
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos/mon-03/prestamo",
      payload: { persona: ANA, devolucion: "2026-02-30" },
    });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
    const lista = await app.inject({ url: "/api/equipos" });
    expect(lista.json()).toEqual([{ id: "mon-03", nombre: "Monitor 03", estado: "disponible" }]);
    await app.close();
  });

  it("criterio 6: una solicitud y un préstamo simultáneos dan un 201, un 409 y un solo dueño", async () => {
    const almacen = await conMonitorDisponible();
    const app = await servidor(almacen);
    const [prestamo, solicitud] = await Promise.all([
      app.inject({ method: "POST", url: "/api/equipos/mon-03/prestamo", payload: { persona: ANA, devolucion: "2026-11-20" } }),
      app.inject({ method: "POST", url: "/api/equipos/mon-03/solicitud", payload: { devolucion: "2026-11-20" } }),
    ]);
    const codigos = [prestamo.statusCode, solicitud.statusCode].sort();
    expect(codigos).toEqual([201, 409]);
    const perdedora = prestamo.statusCode === 409 ? prestamo : solicitud;
    expect(perdedora.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await almacen.listar("prestamos_prestamos")).toHaveLength(1);
    await app.close();
  });

  it("una cuenta que no es de IT recibe 403 y el equipo sigue disponible", async () => {
    const almacen = await conMonitorDisponible();
    const app = await servidor(almacen, { email: ANA, nombre: "Ana Pérez" });
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos/mon-03/prestamo",
      payload: { persona: ANA, devolucion: "2026-11-20" },
    });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.obtener("prestamos_estados", "mon-03")).toBeUndefined();
    await app.close();
  });

  it("un equipo que no existe da 404 «No existe el equipo»", async () => {
    const app = await servidor(await conMonitorDisponible());
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos/no-existe/prestamo",
      payload: { persona: ANA, devolucion: "2026-11-20" },
    });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
    await app.close();
  });
});
