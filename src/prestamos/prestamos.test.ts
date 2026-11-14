import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { darDeAlta } from "../equipos/equipos.js";
import { rutas } from "./index.js";
import { COLECCION_ACTIVOS, COLECCION_PRESTAMOS, listarEquiposConEstado, type Prestamo } from "./prestamos.js";

async function servidor(almacen: Almacen) {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _reply, hecho) => {
    request.persona = { email: "ana.perez@empresa.com", nombre: "Ana" };
    hecho();
  });
  await app.register(rutas, { almacen });
  return app;
}

async function equipoNuevo(almacen: Almacen, nombre: string): Promise<string> {
  const resultado = await darDeAlta(almacen, nombre);
  if (resultado.tipo !== "creado") throw new Error("No se ha creado el equipo");
  return resultado.equipo.id;
}

async function prestar(almacen: Almacen, equipoId: string, estado: Prestamo["estado"], persona: string, devolucion: string) {
  const id = `p-${equipoId}`;
  const prestamo: Prestamo = { id, equipoId, persona, devolucion, estado, creadoEn: "2026-11-14T10:00:00Z" };
  await almacen.guardar(COLECCION_PRESTAMOS, id, prestamo);
  if (estado !== "devuelto") await almacen.guardar(COLECCION_ACTIVOS, equipoId, { prestamoId: id });
}

async function guardarPrestamo(almacen: Almacen, p: Prestamo) {
  await almacen.guardar(COLECCION_PRESTAMOS, p.id, p);
}

describe("GET /api/equipos/:id/historial", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("responde 200 con los préstamos del equipo, del más reciente al más antiguo", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    const otro = await equipoNuevo(almacen, "Monitor 03");
    await guardarPrestamo(almacen, { id: "p1", equipoId: id, persona: "ana.perez@empresa.com", devolucion: "2026-11-10", estado: "devuelto", creadoEn: "2026-11-01T09:00:00Z" });
    await guardarPrestamo(almacen, { id: "p2", equipoId: id, persona: "luis.gomez@empresa.com", devolucion: "2026-11-25", estado: "reservado", creadoEn: "2026-11-12T09:00:00Z" });
    await guardarPrestamo(almacen, { id: "p3", equipoId: otro, persona: "eva@empresa.com", devolucion: "2026-11-30", estado: "prestado", creadoEn: "2026-11-13T09:00:00Z" });
    await almacen.guardar(COLECCION_ACTIVOS, id, { prestamoId: "p2" });
    const app = await servidor(almacen);
    const respuesta = await app.inject(`/api/equipos/${id}/historial`);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { persona: "luis.gomez@empresa.com", devolucion: "2026-11-25", estado: "reservado" },
      { persona: "ana.perez@empresa.com", devolucion: "2026-11-10", estado: "devuelto" },
    ]);
  });

  it("responde 200 con una lista vacía si el equipo no se ha prestado nunca", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    const app = await servidor(almacen);
    const respuesta = await app.inject(`/api/equipos/${id}/historial`);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("responde 404 «No existe el equipo» si el equipo no existe", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const app = await servidor(almacenEnMemoria());
    const respuesta = await app.inject("/api/equipos/equipo-inexistente/historial");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 «Solo IT puede hacer esto.» a una cuenta que no es de IT", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    const app = await servidor(almacen);
    const respuesta = await app.inject(`/api/equipos/${id}/historial`);
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });
});

describe("GET /api/equipos", () => {
  it("responde 200 con la lista de equipos, disponibles y sin persona ni fecha", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    const app = await servidor(almacen);
    const respuesta = await app.inject("/api/equipos");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([{ id, nombre: "Portátil 07", estado: "disponible" }]);
  });

  it("responde 200 con una lista vacía si no hay equipos", async () => {
    const app = await servidor(almacenEnMemoria());
    const respuesta = await app.inject("/api/equipos");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("enseña la persona y la devolución de un equipo prestado o reservado", async () => {
    const almacen = almacenEnMemoria();
    const proyector = await equipoNuevo(almacen, "Proyector 02");
    const monitor = await equipoNuevo(almacen, "Monitor 03");
    await prestar(almacen, proyector, "prestado", "ana.perez@empresa.com", "2026-11-20");
    await prestar(almacen, monitor, "reservado", "luis.gomez@empresa.com", "2026-11-25");
    const equipos = await listarEquiposConEstado(almacen);
    expect(equipos).toContainEqual({
      id: proyector,
      nombre: "Proyector 02",
      estado: "prestado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(equipos).toContainEqual({
      id: monitor,
      nombre: "Monitor 03",
      estado: "reservado",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-11-25",
    });
  });

  it("un equipo con el préstamo devuelto vuelve a estar disponible", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    await prestar(almacen, id, "devuelto", "ana.perez@empresa.com", "2026-11-20");
    expect(await listarEquiposConEstado(almacen)).toEqual([{ id, nombre: "Portátil 07", estado: "disponible" }]);
  });
});
