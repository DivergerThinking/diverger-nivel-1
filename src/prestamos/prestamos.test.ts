import Fastify from "fastify";
import { describe, expect, it } from "vitest";
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
