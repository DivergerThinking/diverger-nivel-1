import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { COLECCION_ESTADOS } from "./estados.js";
import { rutas } from "./index.js";
import { COLECCION_PRESTAMOS, esFechaReal, hoyEnMadrid, type PrestamoGuardado } from "./solicitud.js";

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

function pedir(app: FastifyInstance, id: string, cuerpo?: object) {
  return app.inject({ method: "POST", url: `/api/equipos/${id}/solicitud`, payload: cuerpo });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("pedir un equipo libre", () => {
  it("reserva el equipo a nombre de quien lo pide y lo anota en el historial", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-06T10:00:00+01:00") });
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    const app = await servidor(almacen, "luis.garcia@empresa.com");
    const respuesta = await pedir(app, "e1", { devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id: "e1",
      nombre: "Portátil 07",
      estado: "reservado",
      persona: "luis.garcia@empresa.com",
      devolucion: "2026-11-20",
    });
    const lista = await app.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toEqual([respuesta.json()]);
    const prestamos = await almacen.listar<PrestamoGuardado>(COLECCION_PRESTAMOS);
    expect(prestamos).toHaveLength(1);
    expect(prestamos[0]).toMatchObject({ equipoId: "e1", persona: "luis.garcia@empresa.com", estado: "reservado" });
  });

  it("acepta la fecha de hoy en Madrid", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-06T23:30:00Z") }); // 00:30 del día 7 en Madrid
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    const respuesta = await pedir(await servidor(almacen, "luis.garcia@empresa.com"), "e1", {
      devolucion: "2026-11-07",
    });
    expect(respuesta.statusCode).toBe(201);
  });

  it("rechaza una fecha que ya ha pasado en Madrid (00:30 del 7 de noviembre) y el equipo sigue disponible", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-06T23:30:00Z") });
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    const app = await servidor(almacen, "luis.garcia@empresa.com");
    const respuesta = await pedir(app, "e1", { devolucion: "2026-11-06" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución ya ha pasado" });
    expect(await almacen.obtener(COLECCION_ESTADOS, "e1")).toBeUndefined();
  });

  it("rechaza una fecha que no existe (2026-02-30) y el equipo sigue disponible", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    const respuesta = await pedir(await servidor(almacen, "luis.garcia@empresa.com"), "e1", {
      devolucion: "2026-02-30",
    });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
    expect(await almacen.obtener(COLECCION_ESTADOS, "e1")).toBeUndefined();
  });

  it.each(["20/11/2026", "mañana", "2026-1-5"])("rechaza el formato «%s»", async (devolucion) => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    const respuesta = await pedir(await servidor(almacen, "luis.garcia@empresa.com"), "e1", { devolucion });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
  });

  it("sin fecha de devolución responde 400 «Falta la fecha de devolución»", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    const app = await servidor(almacen, "luis.garcia@empresa.com");
    for (const cuerpo of [undefined, {}, { devolucion: "" }]) {
      const respuesta = await pedir(app, "e1", cuerpo);
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "Falta la fecha de devolución" });
    }
  });

  it("un equipo reservado a otra persona responde 409 y la reserva no cambia", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-06T10:00:00+01:00") });
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    await pedir(await servidor(almacen, "marta.ruiz@empresa.com"), "e1", { devolucion: "2026-11-20" });
    const respuesta = await pedir(await servidor(almacen, "luis.garcia@empresa.com"), "e1", {
      devolucion: "2026-11-25",
    });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await almacen.obtener(COLECCION_ESTADOS, "e1")).toMatchObject({
      estado: "reservado",
      persona: "marta.ruiz@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(await almacen.listar(COLECCION_PRESTAMOS)).toHaveLength(1);
  });

  it("un equipo prestado responde 409", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Proyector 02");
    await almacen.guardar(COLECCION_ESTADOS, "e1", {
      estado: "prestado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-25",
      prestamoId: "p1",
    });
    const respuesta = await pedir(await servidor(almacen, "luis.garcia@empresa.com"), "e1", {
      devolucion: "2999-01-01",
    });
    expect(respuesta.statusCode).toBe(409);
  });

  it("un equipo que no existe responde 404 «No existe el equipo»", async () => {
    const respuesta = await pedir(await servidor(almacenEnMemoria(), "luis.garcia@empresa.com"), "nada", {
      devolucion: "2999-01-01",
    });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });
});

describe("fechas", () => {
  it("hoyEnMadrid usa el horario de Madrid", () => {
    expect(hoyEnMadrid(new Date("2026-11-06T23:30:00Z"))).toBe("2026-11-07");
    expect(hoyEnMadrid(new Date("2026-07-06T21:59:00Z"))).toBe("2026-07-06");
    expect(hoyEnMadrid(new Date("2026-07-06T22:00:00Z"))).toBe("2026-07-07");
  });

  it("esFechaReal distingue fechas que existen", () => {
    expect(esFechaReal("2028-02-29")).toBe(true);
    expect(esFechaReal("2026-02-29")).toBe(false);
    expect(esFechaReal("2026-13-01")).toBe(false);
    expect(esFechaReal("2026-04-31")).toBe(false);
  });
});
