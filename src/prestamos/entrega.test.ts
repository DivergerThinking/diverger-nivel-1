import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { COLECCION_ESTADOS, type EstadoGuardado } from "./estados.js";
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

async function darDeAlta(almacen: Almacen, id: string, nombre: string): Promise<void> {
  await almacen.guardar("equipos_equipos", id, { id, nombre, estado: "disponible" });
}

async function reservar(almacen: Almacen, id: string): Promise<void> {
  const prestamo: PrestamoGuardado = {
    equipoId: id,
    persona: EMPLEADO,
    devolucion: "2026-11-20",
    estado: "reservado",
    inicio: "2026-11-06T09:00:00.000Z",
  };
  const estado: EstadoGuardado = { estado: "reservado", persona: EMPLEADO, devolucion: "2026-11-20", prestamoId: "p1" };
  await almacen.guardar(COLECCION_PRESTAMOS, "p1", prestamo);
  await almacen.guardar(COLECCION_ESTADOS, id, estado);
}

function entregar(app: FastifyInstance, id: string) {
  return app.inject({ method: "POST", url: `/api/equipos/${id}/entrega` });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("entregar un equipo reservado", () => {
  it("lo pasa a prestado con la misma persona y devolución y actualiza el historial", async () => {
    vi.stubEnv("CORREOS_IT", IT);
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    await reservar(almacen, "e1");
    const app = await servidor(almacen, IT);
    const respuesta = await entregar(app, "e1");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({
      id: "e1",
      nombre: "Portátil 07",
      estado: "prestado",
      persona: EMPLEADO,
      devolucion: "2026-11-20",
    });
    const lista = await app.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toEqual([respuesta.json()]);
    expect(await almacen.obtener<PrestamoGuardado>(COLECCION_PRESTAMOS, "p1")).toMatchObject({ estado: "prestado" });
  });

  it("responde 409 «El equipo no está reservado» si está disponible y sigue disponible", async () => {
    vi.stubEnv("CORREOS_IT", IT);
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e2", "Monitor 03");
    const app = await servidor(almacen, IT);
    const respuesta = await entregar(app, "e2");
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está reservado" });
    const lista = await app.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toEqual([{ id: "e2", nombre: "Monitor 03", estado: "disponible" }]);
  });

  it("responde 409 si el equipo ya está prestado", async () => {
    vi.stubEnv("CORREOS_IT", IT);
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    await reservar(almacen, "e1");
    const app = await servidor(almacen, IT);
    await entregar(app, "e1");
    const segunda = await entregar(app, "e1");
    expect(segunda.statusCode).toBe(409);
    expect(segunda.json()).toEqual({ error: "El equipo no está reservado" });
  });

  it("responde 404 «No existe el equipo» si el id no es de ningún equipo", async () => {
    vi.stubEnv("CORREOS_IT", IT);
    const app = await servidor(almacenEnMemoria(), IT);
    const respuesta = await entregar(app, "no-existe");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 «Solo IT puede hacer esto.» a un empleado y no cambia el equipo", async () => {
    vi.stubEnv("CORREOS_IT", IT);
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    await reservar(almacen, "e1");
    const app = await servidor(almacen, EMPLEADO);
    const respuesta = await entregar(app, "e1");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.obtener<EstadoGuardado>(COLECCION_ESTADOS, "e1")).toMatchObject({ estado: "reservado" });
  });
});
