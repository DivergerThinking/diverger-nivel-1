import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import type { Persona } from "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { COLECCION_ACTIVOS, COLECCION_PRESTAMOS, type Prestamo } from "./prestamos.js";

let app: FastifyInstance | undefined;

async function servidor(persona: Persona | null, almacen: Almacen): Promise<FastifyInstance> {
  const nuevo = Fastify();
  nuevo.decorateRequest("persona", null);
  nuevo.addHook("onRequest", (request, _reply, hecho) => {
    request.persona = persona;
    hecho();
  });
  await nuevo.register(rutas, { almacen });
  app = nuevo;
  return nuevo;
}

const empleada: Persona = { email: "luis@empresa.com", nombre: "Luis" };

async function darDeAlta(almacen: Almacen, id: string, nombre: string): Promise<void> {
  await almacen.guardar("equipos_equipos", id, { id, nombre });
}

async function conPrestamo(almacen: Almacen, equipo: string, estado: Prestamo["estado"], activo = true): Promise<void> {
  const prestamo: Prestamo = {
    id: `p-${equipo}-${estado}`,
    equipo,
    persona: "ana.perez@empresa.com",
    devolucion: "2026-11-20",
    estado,
    creado: "2026-11-08T10:00:00.000Z",
  };
  await almacen.guardar(COLECCION_PRESTAMOS, prestamo.id, prestamo);
  if (activo) await almacen.guardar(COLECCION_ACTIVOS, equipo, { prestamo: prestamo.id });
}

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("GET /api/equipos", () => {
  it("lista un equipo disponible sin persona ni devolución y otro prestado con ambas", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    await darDeAlta(almacen, "e2", "Monitor 02");
    await conPrestamo(almacen, "e2", "prestado");
    const respuesta = await (await servidor(empleada, almacen)).inject({ method: "GET", url: "/api/equipos" });
    expect(respuesta.statusCode).toBe(200);
    const equipos = respuesta.json<Record<string, unknown>[]>();
    expect(equipos).toHaveLength(2);
    expect(equipos).toContainEqual({ id: "e1", nombre: "Portátil 07", estado: "disponible" });
    expect(equipos).toContainEqual({
      id: "e2",
      nombre: "Monitor 02",
      estado: "prestado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
  });

  it("muestra persona y devolución de un equipo reservado", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    await conPrestamo(almacen, "e1", "reservado");
    const respuesta = await (await servidor(empleada, almacen)).inject({ method: "GET", url: "/api/equipos" });
    expect(respuesta.json()).toEqual([
      { id: "e1", nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-11-20" },
    ]);
  });

  it("un equipo con el préstamo devuelto y sin activo vuelve a estar disponible", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    await conPrestamo(almacen, "e1", "devuelto", false);
    const respuesta = await (await servidor(empleada, almacen)).inject({ method: "GET", url: "/api/equipos" });
    expect(respuesta.json()).toEqual([{ id: "e1", nombre: "Portátil 07", estado: "disponible" }]);
  });

  it("responde 200 con una lista vacía si no hay equipos", async () => {
    const respuesta = await (await servidor(empleada, almacenEnMemoria())).inject({ method: "GET", url: "/api/equipos" });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("responde 401 sin sesión", async () => {
    const respuesta = await (await servidor(null, almacenEnMemoria())).inject({ method: "GET", url: "/api/equipos" });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});
