import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { COLECCION_ESTADOS, type EstadoGuardado } from "./estados.js";
import { rutas } from "./index.js";
import { COLECCION_PRESTAMOS, type PrestamoGuardado } from "./solicitud.js";

const IT = "it@empresa.com";
const EMPLEADO = "luis.garcia@empresa.com";
const MARTA = "marta.ruiz@empresa.com";

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

function prestar(app: FastifyInstance, id: string, cuerpo?: Record<string, unknown>) {
  return app.inject({ method: "POST", url: `/api/equipos/${id}/prestamo`, payload: cuerpo ?? {} });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("prestar un equipo en el mostrador", () => {
  it("lo deja prestado a la persona con la fecha indicada y lo apunta en el historial", async () => {
    vi.stubEnv("CORREOS_IT", IT);
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Proyector 02");
    const app = await servidor(almacen, IT);
    const respuesta = await prestar(app, "e1", { persona: MARTA, devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id: "e1",
      nombre: "Proyector 02",
      estado: "prestado",
      persona: MARTA,
      devolucion: "2026-11-20",
    });
    const lista = await app.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toEqual([respuesta.json()]);
    const historial = await almacen.listar<PrestamoGuardado>(COLECCION_PRESTAMOS);
    expect(historial).toHaveLength(1);
  });

  it("acepta una fecha de devolución que ya ha pasado", async () => {
    vi.stubEnv("CORREOS_IT", IT);
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Proyector 02");
    const app = await servidor(almacen, IT);
    const respuesta = await prestar(app, "e1", { persona: MARTA, devolucion: "2026-11-01" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toMatchObject({ estado: "prestado", persona: MARTA, devolucion: "2026-11-01" });
  });

  it("responde 400 «Faltan la persona o la fecha de devolución» sin persona y sigue disponible", async () => {
    vi.stubEnv("CORREOS_IT", IT);
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Proyector 02");
    const app = await servidor(almacen, IT);
    const respuesta = await prestar(app, "e1", { devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Faltan la persona o la fecha de devolución" });
    expect(await almacen.obtener<EstadoGuardado>(COLECCION_ESTADOS, "e1")).toBeUndefined();
    const lista = await app.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toEqual([{ id: "e1", nombre: "Proyector 02", estado: "disponible" }]);
  });

  it("responde 400 «Faltan la persona o la fecha de devolución» sin fecha", async () => {
    vi.stubEnv("CORREOS_IT", IT);
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Proyector 02");
    const app = await servidor(almacen, IT);
    const respuesta = await prestar(app, "e1", { persona: MARTA });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Faltan la persona o la fecha de devolución" });
  });

  it("responde 400 «La fecha de devolución no es válida» si la fecha no existe", async () => {
    vi.stubEnv("CORREOS_IT", IT);
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Proyector 02");
    const app = await servidor(almacen, IT);
    const respuesta = await prestar(app, "e1", { persona: MARTA, devolucion: "2026-02-30" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
    expect(await almacen.obtener<EstadoGuardado>(COLECCION_ESTADOS, "e1")).toBeUndefined();
  });

  it("responde 409 «El equipo no está disponible» si está reservado y respeta la reserva", async () => {
    vi.stubEnv("CORREOS_IT", IT);
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    const reservado: EstadoGuardado = {
      estado: "reservado",
      persona: EMPLEADO,
      devolucion: "2026-11-20",
      prestamoId: "p1",
    };
    await almacen.guardar(COLECCION_ESTADOS, "e1", reservado);
    const app = await servidor(almacen, IT);
    const respuesta = await prestar(app, "e1", { persona: MARTA, devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await almacen.obtener<EstadoGuardado>(COLECCION_ESTADOS, "e1")).toEqual(reservado);
  });

  it("responde 409 si el equipo ya está prestado", async () => {
    vi.stubEnv("CORREOS_IT", IT);
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Proyector 02");
    const app = await servidor(almacen, IT);
    await prestar(app, "e1", { persona: MARTA, devolucion: "2026-11-20" });
    const segunda = await prestar(app, "e1", { persona: EMPLEADO, devolucion: "2026-11-25" });
    expect(segunda.statusCode).toBe(409);
    expect(segunda.json()).toEqual({ error: "El equipo no está disponible" });
  });

  it("responde 404 «No existe el equipo» si el id no es de ningún equipo", async () => {
    vi.stubEnv("CORREOS_IT", IT);
    const app = await servidor(almacenEnMemoria(), IT);
    const respuesta = await prestar(app, "no-existe", { persona: MARTA, devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 «Solo IT puede hacer esto.» a un empleado y no cambia el equipo", async () => {
    vi.stubEnv("CORREOS_IT", IT);
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Proyector 02");
    const app = await servidor(almacen, EMPLEADO);
    const respuesta = await prestar(app, "e1", { persona: MARTA, devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.obtener<EstadoGuardado>(COLECCION_ESTADOS, "e1")).toBeUndefined();
  });
});
