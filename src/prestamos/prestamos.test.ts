import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas as rutasEquipos } from "../equipos/index.js";
import { rutas } from "./index.js";
import { ACTIVOS, hoyEnMadrid, PRESTAMOS, type Prestamo } from "./prestamos.js";

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

describe("POST /api/equipos/{id}/solicitud", () => {
  beforeEach(() => {
    // Las 12:00 del 10/11/2026 en Madrid.
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-10T11:00:00Z") });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  async function pedir(almacen: Almacen, id: string, payload?: unknown, persona = EMPLEADA) {
    const app = await servidor(persona, almacen);
    try {
      const respuesta = await app.inject({ method: "POST", url: `/api/equipos/${id}/solicitud`, payload: payload as object });
      return { codigo: respuesta.statusCode, cuerpo: respuesta.json<unknown>() };
    } finally {
      await app.close();
    }
  }

  async function estadoDe(almacen: Almacen, id: string) {
    const app = await servidor(EMPLEADA, almacen);
    try {
      const respuesta = await app.inject({ method: "GET", url: "/api/equipos" });
      return respuesta.json<{ id: string; estado: string; persona?: string }[]>().find((e) => e.id === id);
    } finally {
      await app.close();
    }
  }

  it("reserva un equipo disponible a la persona de la sesión y responde 201", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    const { codigo, cuerpo } = await pedir(almacen, id, { devolucion: "2026-11-20" });
    expect(codigo).toBe(201);
    expect(cuerpo).toEqual({
      id,
      nombre: "Portátil 07",
      estado: "reservado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(await estadoDe(almacen, id)).toMatchObject({ estado: "reservado", persona: "ana.perez@empresa.com" });
    expect(await almacen.listar(PRESTAMOS)).toHaveLength(1);
  });

  it("acepta como devolución el propio día de hoy", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    expect((await pedir(almacen, id, { devolucion: "2026-11-10" })).codigo).toBe(201);
  });

  it("una fecha anterior a hoy responde 400 y el equipo sigue disponible", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    const { codigo, cuerpo } = await pedir(almacen, id, { devolucion: "2026-11-09" });
    expect(codigo).toBe(400);
    expect(cuerpo).toEqual({ error: "La fecha de devolución ya ha pasado" });
    expect(await estadoDe(almacen, id)).toMatchObject({ estado: "disponible" });
  });

  it.each(["2026-02-30", "20/11/2026", "2026-13-01", "mañana", 20261120])(
    "la fecha %s no es válida: 400 y el equipo sigue disponible",
    async (devolucion) => {
      const almacen = almacenEnMemoria();
      const id = await altaDeEquipo(almacen, "Portátil 07");
      const { codigo, cuerpo } = await pedir(almacen, id, { devolucion });
      expect(codigo).toBe(400);
      expect(cuerpo).toEqual({ error: "La fecha de devolución no es válida" });
      expect(await estadoDe(almacen, id)).toMatchObject({ estado: "disponible" });
    },
  );

  it("sin fecha de devolución responde 400 «Falta la fecha de devolución»", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    for (const payload of [undefined, {}, { devolucion: "" }]) {
      const { codigo, cuerpo } = await pedir(almacen, id, payload);
      expect(codigo).toBe(400);
      expect(cuerpo).toEqual({ error: "Falta la fecha de devolución" });
    }
    expect(await estadoDe(almacen, id)).toMatchObject({ estado: "disponible" });
  });

  it("un equipo reservado a otra persona responde 409 y su reserva no cambia", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    await prestar(almacen, id, { persona: "luis.gomez@empresa.com", devolucion: "2026-11-25", estado: "reservado" });
    const { codigo, cuerpo } = await pedir(almacen, id, { devolucion: "2026-11-20" });
    expect(codigo).toBe(409);
    expect(cuerpo).toEqual({ error: "El equipo no está disponible" });
    expect(await estadoDe(almacen, id)).toMatchObject({ estado: "reservado", persona: "luis.gomez@empresa.com" });
  });

  it("un equipo prestado responde 409", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    await prestar(almacen, id, { persona: "luis.gomez@empresa.com", devolucion: "2026-11-25", estado: "prestado" });
    expect((await pedir(almacen, id, { devolucion: "2026-11-20" })).codigo).toBe(409);
  });

  it("de dos solicitudes simultáneas sale bien una y la otra recibe 409", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    const resultados = await Promise.all([
      pedir(almacen, id, { devolucion: "2026-11-20" }),
      pedir(almacen, id, { devolucion: "2026-11-21" }, { email: "luis.gomez@empresa.com", nombre: "Luis" }),
    ]);
    expect(resultados.map((r) => r.codigo).sort()).toEqual([201, 409]);
  });

  it("un equipo que no existe responde 404 «No existe el equipo»", async () => {
    const { codigo, cuerpo } = await pedir(almacenEnMemoria(), "no-existe", { devolucion: "2026-11-20" });
    expect(codigo).toBe(404);
    expect(cuerpo).toEqual({ error: "No existe el equipo" });
  });

  it("sin sesión responde 401 «Inicia sesión con Google.»", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    const app = await servidor(null, almacen);
    try {
      const respuesta = await app.inject({ method: "POST", url: `/api/equipos/${id}/solicitud`, payload: { devolucion: "2026-11-20" } });
      expect(respuesta.statusCode).toBe(401);
      expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
    } finally {
      await app.close();
    }
  });

  it("hoy es el día de Madrid aunque en UTC sea el anterior", () => {
    vi.setSystemTime(new Date("2026-11-09T23:30:00Z"));
    expect(hoyEnMadrid()).toBe("2026-11-10");
  });
});

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
