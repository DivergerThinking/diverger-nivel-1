import Fastify, { type FastifyInstance } from "fastify";
import { describe, expect, it } from "vitest";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { COLECCION_ESTADOS, type EquipoConEstado } from "./estados.js";
import { rutas } from "./index.js";

async function servidor(almacen: Almacen): Promise<FastifyInstance> {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _reply, hecho) => {
    request.persona = { email: "empleado@empresa.com", nombre: "Empleado" };
    hecho();
  });
  await app.register(rutas, { almacen });
  await app.ready();
  return app;
}

async function darDeAlta(almacen: Almacen, id: string, nombre: string): Promise<void> {
  await almacen.guardar("equipos_equipos", id, { id, nombre, estado: "disponible" });
}

async function listar(app: FastifyInstance): Promise<EquipoConEstado[]> {
  const respuesta = await app.inject({ method: "GET", url: "/api/equipos" });
  expect(respuesta.statusCode).toBe(200);
  return respuesta.json<EquipoConEstado[]>();
}

describe("ver los equipos y su estado", () => {
  it("un equipo reservado muestra persona y devolución, y uno libre no", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    await darDeAlta(almacen, "e2", "Monitor 03");
    await almacen.guardar(COLECCION_ESTADOS, "e1", {
      estado: "reservado",
      persona: "luis.garcia@empresa.com",
      devolucion: "2026-11-20",
      prestamoId: "p1",
    });
    const equipos = await listar(await servidor(almacen));
    expect(equipos).toEqual([
      { id: "e2", nombre: "Monitor 03", estado: "disponible" },
      {
        id: "e1",
        nombre: "Portátil 07",
        estado: "reservado",
        persona: "luis.garcia@empresa.com",
        devolucion: "2026-11-20",
      },
    ]);
  });

  it("un equipo prestado muestra el estado «prestado» con su persona y devolución", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Proyector 02");
    await almacen.guardar(COLECCION_ESTADOS, "e1", {
      estado: "prestado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-25",
      prestamoId: "p2",
    });
    const [equipo] = await listar(await servidor(almacen));
    expect(equipo).toMatchObject({ estado: "prestado", persona: "ana.perez@empresa.com", devolucion: "2026-11-25" });
  });

  it("un equipo devuelto aparece disponible, sin persona ni devolución, y no sale quien lo tuvo", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    // Al devolver, el documento de estado se borra; el préstamo queda en el historial como «devuelto».
    await almacen.guardar("prestamos_prestamos", "p1", {
      equipoId: "e1",
      persona: "luis.garcia@empresa.com",
      devolucion: "2026-11-01",
      estado: "devuelto",
      inicio: "2026-10-20T08:00:00.000Z",
    });
    const app = await servidor(almacen);
    const respuesta = await app.inject({ method: "GET", url: "/api/equipos" });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([{ id: "e1", nombre: "Portátil 07", estado: "disponible" }]);
    expect(respuesta.body).not.toContain("luis.garcia@empresa.com");
  });

  it("sin equipos da una lista vacía", async () => {
    expect(await listar(await servidor(almacenEnMemoria()))).toEqual([]);
  });
});
