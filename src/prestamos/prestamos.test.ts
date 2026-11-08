import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas as rutasEquipos } from "../equipos/index.js";
import { rutas } from "./index.js";
import { ACTIVOS, PRESTAMOS, type Prestamo } from "./prestamos.js";

const IT = { email: "it@empresa.com", nombre: "IT" };
const EMPLEADA = { email: "ana.perez@empresa.com", nombre: "Ana" };

let antes: string | undefined;
beforeEach(() => {
  antes = process.env["CORREOS_IT"];
  process.env["CORREOS_IT"] = "it@empresa.com";
});
afterEach(() => {
  if (antes === undefined) delete process.env["CORREOS_IT"];
  else process.env["CORREOS_IT"] = antes;
});

async function servidor(persona: { email: string; nombre: string } | null, almacen: Almacen): Promise<FastifyInstance> {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _reply, hecho) => {
    request.persona = persona;
    hecho();
  });
  await app.register(rutasEquipos, { almacen });
  await app.register(rutas, { almacen });
  return app;
}

async function altaDeEquipo(almacen: Almacen, nombre: string): Promise<string> {
  const app = await servidor(IT, almacen);
  try {
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre } });
    return respuesta.json<{ id: string }>().id;
  } finally {
    await app.close();
  }
}

async function prestar(almacen: Almacen, equipoId: string, datos: Omit<Prestamo, "id" | "equipoId" | "creadoEn">) {
  const prestamo: Prestamo = { id: `p-${equipoId}`, equipoId, creadoEn: "2026-11-01T10:00:00Z", ...datos };
  await almacen.guardar(PRESTAMOS, prestamo.id, prestamo);
  await almacen.guardar(ACTIVOS, equipoId, { prestamoId: prestamo.id });
}

describe("GET /api/equipos", () => {
  it("lista un equipo disponible sin persona ni devolución y uno prestado con ambas", async () => {
    const almacen = almacenEnMemoria();
    await altaDeEquipo(almacen, "Portátil 07");
    const proyector = await altaDeEquipo(almacen, "Proyector 02");
    await prestar(almacen, proyector, { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20", estado: "prestado" });
    const app = await servidor(EMPLEADA, almacen);
    try {
      const respuesta = await app.inject({ method: "GET", url: "/api/equipos" });
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.json()).toEqual([
        { id: expect.any(String) as string, nombre: "Portátil 07", estado: "disponible" },
        {
          id: proyector,
          nombre: "Proyector 02",
          estado: "prestado",
          persona: "luis.gomez@empresa.com",
          devolucion: "2026-11-20",
        },
      ]);
    } finally {
      await app.close();
    }
  });

  it("un equipo reservado sale con estado reservado, persona y devolución", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 03");
    await prestar(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-25", estado: "reservado" });
    const app = await servidor(EMPLEADA, almacen);
    try {
      const respuesta = await app.inject({ method: "GET", url: "/api/equipos" });
      expect(respuesta.json()).toEqual([
        { id, nombre: "Monitor 03", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-11-25" },
      ]);
    } finally {
      await app.close();
    }
  });

  it("un equipo devuelto, sin préstamo activo, sale disponible", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 03");
    await almacen.guardar(PRESTAMOS, "p-1", {
      id: "p-1",
      equipoId: id,
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-10",
      estado: "devuelto",
      creadoEn: "2026-11-01T10:00:00Z",
    } satisfies Prestamo);
    const app = await servidor(EMPLEADA, almacen);
    try {
      const respuesta = await app.inject({ method: "GET", url: "/api/equipos" });
      expect(respuesta.json()).toEqual([{ id, nombre: "Monitor 03", estado: "disponible" }]);
    } finally {
      await app.close();
    }
  });

  it("sin equipos responde 200 con una lista vacía", async () => {
    const app = await servidor(EMPLEADA, almacenEnMemoria());
    try {
      const respuesta = await app.inject({ method: "GET", url: "/api/equipos" });
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.json()).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it("sin sesión responde 401 «Inicia sesión con Google.» y ningún equipo", async () => {
    const almacen = almacenEnMemoria();
    await altaDeEquipo(almacen, "Portátil 07");
    const app = await servidor(null, almacen);
    try {
      const respuesta = await app.inject({ method: "GET", url: "/api/equipos" });
      expect(respuesta.statusCode).toBe(401);
      expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
    } finally {
      await app.close();
    }
  });
});
