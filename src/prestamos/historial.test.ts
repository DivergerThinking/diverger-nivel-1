import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { COLECCION_PRESTAMOS, type PrestamoGuardado } from "./solicitud.js";

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

async function equipo(almacen: Almacen, id: string, nombre: string): Promise<void> {
  await almacen.guardar("equipos_equipos", id, { id, nombre, estado: "disponible" });
}

async function prestamo(almacen: Almacen, id: string, datos: PrestamoGuardado): Promise<void> {
  await almacen.guardar(COLECCION_PRESTAMOS, id, datos);
}

function consultar(app: FastifyInstance, id: string) {
  return app.inject({ method: "GET", url: `/api/equipos/${id}/historial` });
}

beforeEach(() => {
  vi.stubEnv("CORREOS_IT", IT);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("consultar el historial de un equipo", () => {
  it("lista los préstamos del más reciente al más antiguo con su estado", async () => {
    const almacen = almacenEnMemoria();
    await equipo(almacen, "e1", "Portátil 07");
    await prestamo(almacen, "a", {
      equipoId: "e1",
      persona: "luis.garcia@empresa.com",
      devolucion: "2026-10-15",
      estado: "devuelto",
      inicio: "2026-10-01T09:00:00.000Z",
    });
    await prestamo(almacen, "b", {
      equipoId: "e1",
      persona: "marta.ruiz@empresa.com",
      devolucion: "2026-11-20",
      estado: "reservado",
      inicio: "2026-11-06T09:00:00.000Z",
    });
    const respuesta = await consultar(await servidor(almacen, IT), "e1");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { persona: "marta.ruiz@empresa.com", devolucion: "2026-11-20", estado: "reservado" },
      { persona: "luis.garcia@empresa.com", devolucion: "2026-10-15", estado: "devuelto" },
    ]);
  });

  it("no incluye los préstamos de otros equipos", async () => {
    const almacen = almacenEnMemoria();
    await equipo(almacen, "e1", "Portátil 07");
    await equipo(almacen, "e2", "Proyector 02");
    await prestamo(almacen, "a", {
      equipoId: "e2",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
      estado: "prestado",
      inicio: "2026-11-01T09:00:00.000Z",
    });
    const respuesta = await consultar(await servidor(almacen, IT), "e1");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("responde 404 «No existe el equipo» si el id no es de ningún equipo", async () => {
    const respuesta = await consultar(await servidor(almacenEnMemoria(), IT), "nada");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 «Solo IT puede hacer esto.» a un empleado y no muestra el historial", async () => {
    const almacen = almacenEnMemoria();
    await equipo(almacen, "e1", "Portátil 07");
    await prestamo(almacen, "a", {
      equipoId: "e1",
      persona: "marta.ruiz@empresa.com",
      devolucion: "2026-11-20",
      estado: "prestado",
      inicio: "2026-11-01T09:00:00.000Z",
    });
    const respuesta = await consultar(await servidor(almacen, EMPLEADO), "e1");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });
});
