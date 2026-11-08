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
    const perdedora = resultados.find((r) => r.codigo === 409);
    const ganadora = resultados.find((r) => r.codigo === 201);
    expect(perdedora?.cuerpo).toEqual({ error: "El equipo no está disponible" });
    expect(ganadora?.cuerpo).toMatchObject({ id, estado: "reservado" });
    expect(await almacen.listar(PRESTAMOS)).toHaveLength(1);
    expect(await almacen.listar(ACTIVOS)).toHaveLength(1);
    expect(await estadoDe(almacen, id)).toMatchObject({
      estado: "reservado",
      persona: (ganadora?.cuerpo as { persona: string }).persona,
    });
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

describe("POST /api/equipos/{id}/entrega", () => {
  async function entregar(almacen: Almacen, id: string, persona: { email: string; nombre: string } | null = IT) {
    const app = await servidor(persona, almacen);
    try {
      const respuesta = await app.inject({ method: "POST", url: `/api/equipos/${id}/entrega` });
      return { codigo: respuesta.statusCode, cuerpo: respuesta.json<unknown>() };
    } finally {
      await app.close();
    }
  }

  async function estadoDe(almacen: Almacen, id: string) {
    const app = await servidor(EMPLEADA, almacen);
    try {
      const respuesta = await app.inject({ method: "GET", url: "/api/equipos" });
      return respuesta.json<{ id: string; estado: string; persona?: string; devolucion?: string }[]>().find((e) => e.id === id);
    } finally {
      await app.close();
    }
  }

  it("un equipo reservado pasa a prestado con la misma persona y devolución", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    await prestar(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20", estado: "reservado" });
    const { codigo, cuerpo } = await entregar(almacen, id);
    expect(codigo).toBe(200);
    expect(cuerpo).toEqual({
      id,
      nombre: "Portátil 07",
      estado: "prestado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(await estadoDe(almacen, id)).toMatchObject({ estado: "prestado", persona: "ana.perez@empresa.com", devolucion: "2026-11-20" });
    expect(await almacen.listar(PRESTAMOS)).toHaveLength(1);
  });

  it("un equipo disponible responde 409 «El equipo no está reservado» y sigue disponible", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    const { codigo, cuerpo } = await entregar(almacen, id);
    expect(codigo).toBe(409);
    expect(cuerpo).toEqual({ error: "El equipo no está reservado" });
    expect(await estadoDe(almacen, id)).toMatchObject({ estado: "disponible" });
  });

  it("un equipo ya prestado responde 409 y no cambia", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    await prestar(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20", estado: "prestado" });
    const { codigo, cuerpo } = await entregar(almacen, id);
    expect(codigo).toBe(409);
    expect(cuerpo).toEqual({ error: "El equipo no está reservado" });
    expect(await estadoDe(almacen, id)).toMatchObject({ estado: "prestado", persona: "ana.perez@empresa.com" });
  });

  it("un equipo devuelto responde 409 «El equipo no está reservado»", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    await prestar(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-05", estado: "devuelto" });
    expect((await entregar(almacen, id)).codigo).toBe(409);
  });

  it("un equipo que no existe responde 404 «No existe el equipo»", async () => {
    const { codigo, cuerpo } = await entregar(almacenEnMemoria(), "no-existe");
    expect(codigo).toBe(404);
    expect(cuerpo).toEqual({ error: "No existe el equipo" });
  });

  it("una cuenta que no es de IT recibe 403 y el equipo sigue reservado", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    await prestar(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20", estado: "reservado" });
    const { codigo, cuerpo } = await entregar(almacen, id, EMPLEADA);
    expect(codigo).toBe(403);
    expect(cuerpo).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await estadoDe(almacen, id)).toMatchObject({ estado: "reservado" });
  });

  it("sin sesión responde 401 «Inicia sesión con Google.»", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    const { codigo, cuerpo } = await entregar(almacen, id, null);
    expect(codigo).toBe(401);
    expect(cuerpo).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("POST /api/equipos/{id}/prestamo", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-10T11:00:00Z") });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  async function prestarEnMostrador(
    almacen: Almacen,
    id: string,
    payload?: unknown,
    persona: { email: string; nombre: string } | null = IT,
  ) {
    const app = await servidor(persona, almacen);
    try {
      const respuesta = await app.inject({ method: "POST", url: `/api/equipos/${id}/prestamo`, payload: payload as object });
      return { codigo: respuesta.statusCode, cuerpo: respuesta.json<unknown>() };
    } finally {
      await app.close();
    }
  }

  async function estadoDe(almacen: Almacen, id: string) {
    const app = await servidor(EMPLEADA, almacen);
    try {
      const respuesta = await app.inject({ method: "GET", url: "/api/equipos" });
      return respuesta.json<{ id: string; estado: string; persona?: string; devolucion?: string }[]>().find((e) => e.id === id);
    } finally {
      await app.close();
    }
  }

  it("presta un equipo disponible y responde 201 con estado prestado, persona y devolución", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 03");
    const { codigo, cuerpo } = await prestarEnMostrador(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" });
    expect(codigo).toBe(201);
    expect(cuerpo).toEqual({
      id,
      nombre: "Monitor 03",
      estado: "prestado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(await estadoDe(almacen, id)).toMatchObject({ estado: "prestado", persona: "ana.perez@empresa.com", devolucion: "2026-11-20" });
    expect(await almacen.listar(PRESTAMOS)).toHaveLength(1);
  });

  it("acepta una devolución anterior a hoy", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 04");
    const { codigo, cuerpo } = await prestarEnMostrador(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-05" });
    expect(codigo).toBe(201);
    expect(cuerpo).toMatchObject({ estado: "prestado", devolucion: "2026-11-05" });
  });

  it("sin persona o sin fecha responde 400 «Faltan la persona o la fecha de devolución» y el equipo sigue disponible", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 03");
    for (const payload of [
      undefined,
      {},
      { devolucion: "2026-11-20" },
      { persona: "  ", devolucion: "2026-11-20" },
      { persona: "ana.perez@empresa.com" },
      { persona: "ana.perez@empresa.com", devolucion: "" },
    ]) {
      const { codigo, cuerpo } = await prestarEnMostrador(almacen, id, payload);
      expect(codigo).toBe(400);
      expect(cuerpo).toEqual({ error: "Faltan la persona o la fecha de devolución" });
    }
    expect(await estadoDe(almacen, id)).toMatchObject({ estado: "disponible" });
  });

  it.each(["2026-02-30", "20/11/2026", "2026-13-01", "mañana", 20261120])(
    "la fecha %s no es válida: 400 y el equipo sigue disponible",
    async (devolucion) => {
      const almacen = almacenEnMemoria();
      const id = await altaDeEquipo(almacen, "Monitor 03");
      const { codigo, cuerpo } = await prestarEnMostrador(almacen, id, { persona: "ana.perez@empresa.com", devolucion });
      expect(codigo).toBe(400);
      expect(cuerpo).toEqual({ error: "La fecha de devolución no es válida" });
      expect(await estadoDe(almacen, id)).toMatchObject({ estado: "disponible" });
    },
  );

  it("un equipo que no existe responde 404 «No existe el equipo»", async () => {
    const { codigo, cuerpo } = await prestarEnMostrador(almacenEnMemoria(), "no-existe", {
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(codigo).toBe(404);
    expect(cuerpo).toEqual({ error: "No existe el equipo" });
  });

  it("un equipo reservado responde 409 «El equipo no está disponible» y la reserva no cambia", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 03");
    await prestar(almacen, id, { persona: "luis.gomez@empresa.com", devolucion: "2026-11-25", estado: "reservado" });
    const { codigo, cuerpo } = await prestarEnMostrador(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" });
    expect(codigo).toBe(409);
    expect(cuerpo).toEqual({ error: "El equipo no está disponible" });
    expect(await estadoDe(almacen, id)).toMatchObject({ estado: "reservado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-25" });
  });

  it("un equipo ya prestado responde 409", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 03");
    await prestar(almacen, id, { persona: "luis.gomez@empresa.com", devolucion: "2026-11-25", estado: "prestado" });
    expect((await prestarEnMostrador(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" })).codigo).toBe(409);
  });

  it("de una solicitud y un préstamo en el mostrador simultáneos sale bien uno y el otro recibe 409", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    const app = await servidor(EMPLEADA, almacen);
    const appIT = await servidor(IT, almacen);
    try {
      const respuestas = await Promise.all([
        app.inject({ method: "POST", url: `/api/equipos/${id}/solicitud`, payload: { devolucion: "2026-11-20" } }),
        appIT.inject({
          method: "POST",
          url: `/api/equipos/${id}/prestamo`,
          payload: { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" },
        }),
      ]);
      expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
      expect(respuestas.find((r) => r.statusCode === 409)?.json()).toEqual({ error: "El equipo no está disponible" });
      expect(await almacen.listar(ACTIVOS)).toHaveLength(1);
      expect(await almacen.listar(PRESTAMOS)).toHaveLength(1);
    } finally {
      await app.close();
      await appIT.close();
    }
  });

  it("una cuenta que no es de IT recibe 403 y el equipo sigue disponible", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 03");
    const { codigo, cuerpo } = await prestarEnMostrador(
      almacen,
      id,
      { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" },
      EMPLEADA,
    );
    expect(codigo).toBe(403);
    expect(cuerpo).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await estadoDe(almacen, id)).toMatchObject({ estado: "disponible" });
  });

  it("sin sesión responde 401 «Inicia sesión con Google.»", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 03");
    const { codigo, cuerpo } = await prestarEnMostrador(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" }, null);
    expect(codigo).toBe(401);
    expect(cuerpo).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("POST /api/equipos/{id}/devolucion", () => {
  async function devolver(almacen: Almacen, id: string, persona: { email: string; nombre: string } | null = IT) {
    const app = await servidor(persona, almacen);
    try {
      const respuesta = await app.inject({ method: "POST", url: `/api/equipos/${id}/devolucion` });
      return { codigo: respuesta.statusCode, cuerpo: respuesta.json<unknown>() };
    } finally {
      await app.close();
    }
  }

  async function estadoDe(almacen: Almacen, id: string) {
    const app = await servidor(EMPLEADA, almacen);
    try {
      const respuesta = await app.inject({ method: "GET", url: "/api/equipos" });
      return respuesta.json<{ id: string; estado: string; persona?: string; devolucion?: string }[]>().find((e) => e.id === id);
    } finally {
      await app.close();
    }
  }

  it("un equipo prestado vuelve a disponible, sin persona ni devolución, y su préstamo queda devuelto", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 03");
    await prestar(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20", estado: "prestado" });
    const { codigo, cuerpo } = await devolver(almacen, id);
    expect(codigo).toBe(200);
    expect(cuerpo).toEqual({ id, nombre: "Monitor 03", estado: "disponible" });
    expect(await estadoDe(almacen, id)).toEqual({ id, nombre: "Monitor 03", estado: "disponible" });
    expect(await almacen.listar(ACTIVOS)).toHaveLength(0);
    expect(await almacen.listar<Prestamo>(PRESTAMOS)).toMatchObject([{ estado: "devuelto", persona: "ana.perez@empresa.com" }]);
  });

  it("tras la devolución el equipo se puede volver a prestar", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 03");
    await prestar(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20", estado: "prestado" });
    await devolver(almacen, id);
    const app = await servidor(IT, almacen);
    try {
      const respuesta = await app.inject({
        method: "POST",
        url: `/api/equipos/${id}/prestamo`,
        payload: { persona: "luis.gomez@empresa.com", devolucion: "2026-12-01" },
      });
      expect(respuesta.statusCode).toBe(201);
    } finally {
      await app.close();
    }
    expect(await almacen.listar(PRESTAMOS)).toHaveLength(2);
  });

  it("un equipo disponible responde 409 «El equipo no está prestado»", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 03");
    const { codigo, cuerpo } = await devolver(almacen, id);
    expect(codigo).toBe(409);
    expect(cuerpo).toEqual({ error: "El equipo no está prestado" });
    expect(await estadoDe(almacen, id)).toMatchObject({ estado: "disponible" });
  });

  it("un equipo solo reservado responde 409 y sigue reservado", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 03");
    await prestar(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20", estado: "reservado" });
    const { codigo, cuerpo } = await devolver(almacen, id);
    expect(codigo).toBe(409);
    expect(cuerpo).toEqual({ error: "El equipo no está prestado" });
    expect(await estadoDe(almacen, id)).toMatchObject({ estado: "reservado" });
  });

  it("devolver dos veces: la segunda responde 409", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 03");
    await prestar(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20", estado: "prestado" });
    expect((await devolver(almacen, id)).codigo).toBe(200);
    expect((await devolver(almacen, id)).codigo).toBe(409);
  });

  it("un equipo que no existe responde 404 «No existe el equipo»", async () => {
    const { codigo, cuerpo } = await devolver(almacenEnMemoria(), "no-existe");
    expect(codigo).toBe(404);
    expect(cuerpo).toEqual({ error: "No existe el equipo" });
  });

  it("una cuenta que no es de IT recibe 403 y el equipo sigue prestado", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 03");
    await prestar(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20", estado: "prestado" });
    const { codigo, cuerpo } = await devolver(almacen, id, EMPLEADA);
    expect(codigo).toBe(403);
    expect(cuerpo).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await estadoDe(almacen, id)).toMatchObject({ estado: "prestado" });
  });

  it("sin sesión responde 401 «Inicia sesión con Google.»", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 03");
    const { codigo, cuerpo } = await devolver(almacen, id, null);
    expect(codigo).toBe(401);
    expect(cuerpo).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("GET /api/prestamos/vencidos", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-10T11:00:00Z") });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  async function consultar(almacen: Almacen, persona: { email: string; nombre: string } | null = IT) {
    const app = await servidor(persona, almacen);
    try {
      const respuesta = await app.inject({ method: "GET", url: "/api/prestamos/vencidos" });
      return { codigo: respuesta.statusCode, cuerpo: respuesta.json<unknown>() };
    } finally {
      await app.close();
    }
  }

  it("lista los prestados con devolución anterior a hoy, del más antiguo al más reciente", async () => {
    const almacen = almacenEnMemoria();
    const monitor03 = await altaDeEquipo(almacen, "Monitor 03");
    const portatil07 = await altaDeEquipo(almacen, "Portátil 07");
    const monitor04 = await altaDeEquipo(almacen, "Monitor 04");
    const portatil08 = await altaDeEquipo(almacen, "Portátil 08");
    await prestar(almacen, monitor03, { persona: "luis.gomez@empresa.com", devolucion: "2026-11-08", estado: "prestado" });
    await prestar(almacen, portatil07, { persona: "ana.perez@empresa.com", devolucion: "2026-11-03", estado: "prestado" });
    await prestar(almacen, monitor04, { persona: "ana.perez@empresa.com", devolucion: "2026-11-10", estado: "prestado" });
    await prestar(almacen, portatil08, { persona: "ana.perez@empresa.com", devolucion: "2026-11-01", estado: "reservado" });
    const { codigo, cuerpo } = await consultar(almacen);
    expect(codigo).toBe(200);
    expect(cuerpo).toEqual([
      { id: portatil07, nombre: "Portátil 07", persona: "ana.perez@empresa.com", devolucion: "2026-11-03" },
      { id: monitor03, nombre: "Monitor 03", persona: "luis.gomez@empresa.com", devolucion: "2026-11-08" },
    ]);
  });

  it("un préstamo que vence hoy no está vencido", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 04");
    await prestar(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-10", estado: "prestado" });
    expect((await consultar(almacen)).cuerpo).toEqual([]);
  });

  it("un préstamo devuelto no aparece aunque su fecha haya pasado", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Monitor 03");
    await prestar(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-01", estado: "prestado" });
    const app = await servidor(IT, almacen);
    try {
      await app.inject({ method: "POST", url: `/api/equipos/${id}/devolucion` });
    } finally {
      await app.close();
    }
    expect((await consultar(almacen)).cuerpo).toEqual([]);
  });

  it("una cuenta que no es de IT recibe 403 y ningún préstamo", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    await prestar(almacen, id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-03", estado: "prestado" });
    const { codigo, cuerpo } = await consultar(almacen, EMPLEADA);
    expect(codigo).toBe(403);
    expect(cuerpo).toEqual({ error: "Solo IT puede hacer esto." });
  });

  it("sin sesión responde 401 «Inicia sesión con Google.»", async () => {
    const { codigo, cuerpo } = await consultar(almacenEnMemoria(), null);
    expect(codigo).toBe(401);
    expect(cuerpo).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("GET /api/equipos/{id}/historial", () => {
  async function consultar(almacen: Almacen, id: string, persona: { email: string; nombre: string } | null = IT) {
    const app = await servidor(persona, almacen);
    try {
      const respuesta = await app.inject({ method: "GET", url: `/api/equipos/${id}/historial` });
      return { codigo: respuesta.statusCode, cuerpo: respuesta.json<unknown>() };
    } finally {
      await app.close();
    }
  }

  async function guardarPrestamo(almacen: Almacen, prestamo: Prestamo) {
    await almacen.guardar(PRESTAMOS, prestamo.id, prestamo);
  }

  it("lista los préstamos del equipo del más reciente al más antiguo", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    await guardarPrestamo(almacen, {
      id: "p-1",
      equipoId: id,
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-05",
      estado: "devuelto",
      creadoEn: "2026-11-01T10:00:00Z",
    });
    await guardarPrestamo(almacen, {
      id: "p-2",
      equipoId: id,
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-11-20",
      estado: "reservado",
      creadoEn: "2026-11-06T10:00:00Z",
    });
    const { codigo, cuerpo } = await consultar(almacen, id);
    expect(codigo).toBe(200);
    expect(cuerpo).toEqual([
      { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20", estado: "reservado" },
      { persona: "ana.perez@empresa.com", devolucion: "2026-11-05", estado: "devuelto" },
    ]);
  });

  it("no incluye los préstamos de otros equipos", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    const otro = await altaDeEquipo(almacen, "Monitor 03");
    await prestar(almacen, otro, { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20", estado: "prestado" });
    expect((await consultar(almacen, id)).cuerpo).toEqual([]);
  });

  it("un equipo sin préstamos responde 200 con una lista vacía", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    const { codigo, cuerpo } = await consultar(almacen, id);
    expect(codigo).toBe(200);
    expect(cuerpo).toEqual([]);
  });

  it("un equipo que no existe responde 404 «No existe el equipo»", async () => {
    const { codigo, cuerpo } = await consultar(almacenEnMemoria(), "no-existe");
    expect(codigo).toBe(404);
    expect(cuerpo).toEqual({ error: "No existe el equipo" });
  });

  it("una cuenta que no es de IT recibe 403", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    const { codigo, cuerpo } = await consultar(almacen, id, EMPLEADA);
    expect(codigo).toBe(403);
    expect(cuerpo).toEqual({ error: "Solo IT puede hacer esto." });
  });

  it("sin sesión responde 401 «Inicia sesión con Google.»", async () => {
    const almacen = almacenEnMemoria();
    const id = await altaDeEquipo(almacen, "Portátil 07");
    const { codigo, cuerpo } = await consultar(almacen, id, null);
    expect(codigo).toBe(401);
    expect(cuerpo).toEqual({ error: "Inicia sesión con Google." });
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
