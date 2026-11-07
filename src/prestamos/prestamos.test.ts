import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { hoyEnMadrid } from "./prestamos.js";

let almacen: Almacen;

beforeEach(() => {
  almacen = almacenEnMemoria();
});

// La sesión se toma de la cabecera «x-correo», como la dejaría el servidor en request.persona.
async function servidor() {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _reply, hecho) => {
    const correo = request.headers["x-correo"];
    if (typeof correo === "string") request.persona = { email: correo, nombre: correo };
    hecho();
  });
  await app.register(rutas, { almacen });
  return app;
}

// Deja un equipo en el catálogo como lo hace el alta del contexto «equipos».
async function darDeAlta(id: string, nombre: string) {
  await almacen.guardar("equipos", id, { nombre, nombreNormalizado: nombre.toLowerCase() });
  await almacen.guardar("equipos_nombres", encodeURIComponent(nombre.toLowerCase()), { equipoId: id });
}

async function reservar(equipoId: string, persona: string, devolucion: string) {
  await almacen.guardar("prestamos_activos", equipoId, { equipoId, persona, devolucion, estado: "reservado" });
}

async function listar(correo?: string) {
  const app = await servidor();
  return app.inject({ method: "GET", url: "/api/equipos", headers: correo ? { "x-correo": correo } : {} });
}

async function solicitar(id: string, cuerpo: object | undefined, correo?: string) {
  const app = await servidor();
  return app.inject({
    method: "POST",
    url: `/api/equipos/${id}/solicitud`,
    headers: correo ? { "x-correo": correo } : {},
    ...(cuerpo === undefined ? {} : { payload: cuerpo }),
  });
}

describe("POST /api/equipos/{id}/solicitud", () => {
  it("reserva un equipo disponible a nombre de la persona de la sesión", async () => {
    await darDeAlta("e1", "Portátil 07");

    const respuesta = await solicitar("e1", { devolucion: "2026-11-20" }, "ana.perez@empresa.com");

    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id: "e1",
      nombre: "Portátil 07",
      estado: "reservado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(await almacen.obtener("prestamos_activos", "e1")).toMatchObject({
      equipoId: "e1",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
      estado: "reservado",
    });
    expect(await almacen.listar("prestamos_historial")).toHaveLength(1);
  });

  it("el equipo reservado aparece en la lista con su estado", async () => {
    await darDeAlta("e1", "Portátil 07");
    await solicitar("e1", { devolucion: "2026-11-20" }, "ana.perez@empresa.com");
    const [equipo] = (await listar("luis.gomez@empresa.com")).json<Record<string, unknown>[]>();
    expect(equipo).toMatchObject({ estado: "reservado", persona: "ana.perez@empresa.com" });
  });

  it("un equipo reservado a otra persona responde 409 y la reserva no cambia", async () => {
    await darDeAlta("e1", "Portátil 07");
    await reservar("e1", "luis.gomez@empresa.com", "2026-11-15");

    const respuesta = await solicitar("e1", { devolucion: "2026-11-20" }, "ana.perez@empresa.com");

    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await almacen.obtener("prestamos_activos", "e1")).toMatchObject({
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-11-15",
    });
    expect(await almacen.listar("prestamos_historial")).toHaveLength(0);
  });

  it("un equipo prestado responde 409", async () => {
    await darDeAlta("e1", "Portátil 07");
    await almacen.guardar("prestamos_activos", "e1", {
      equipoId: "e1",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-11-15",
      estado: "prestado",
    });
    const respuesta = await solicitar("e1", { devolucion: "2026-11-20" }, "ana.perez@empresa.com");
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
  });

  it("con dos solicitudes simultáneas una sale bien y la otra recibe 409", async () => {
    await darDeAlta("e1", "Portátil 07");
    const [a, b] = await Promise.all([
      solicitar("e1", { devolucion: "2026-11-20" }, "ana.perez@empresa.com"),
      solicitar("e1", { devolucion: "2026-11-21" }, "luis.gomez@empresa.com"),
    ]);
    expect([a.statusCode, b.statusCode].sort()).toEqual([201, 409]);
  });

  it("con diez solicitudes simultáneas de personas distintas una devuelve 201 y las otras nueve 409", async () => {
    await darDeAlta("e1", "Portátil 07");
    const personas = Array.from({ length: 10 }, (_, i) => `empleado${i}@empresa.com`);

    const respuestas = await Promise.all(personas.map((p) => solicitar("e1", { devolucion: "2026-11-20" }, p)));

    const exitosas = respuestas.filter((r) => r.statusCode === 201);
    const rechazadas = respuestas.filter((r) => r.statusCode === 409);
    expect(exitosas).toHaveLength(1);
    expect(rechazadas).toHaveLength(9);
    for (const r of rechazadas) expect(r.json()).toEqual({ error: "El equipo no está disponible" });
    const ganadora = exitosas[0]?.json<{ persona: string }>().persona;
    expect(await almacen.listar("prestamos_activos")).toEqual([
      expect.objectContaining({ equipoId: "e1", persona: ganadora, estado: "reservado" }),
    ]);
    expect(await almacen.listar("prestamos_historial")).toHaveLength(1);
  });

  it("un equipo que no existe responde 404", async () => {
    const respuesta = await solicitar("no-existe", { devolucion: "2026-11-20" }, "ana.perez@empresa.com");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("sin fecha de devolución responde 400 y no reserva", async () => {
    await darDeAlta("e1", "Portátil 07");
    const respuesta = await solicitar("e1", {}, "ana.perez@empresa.com");
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Falta la fecha de devolución" });
    expect(await almacen.obtener("prestamos_activos", "e1")).toBeUndefined();
  });

  it("sin sesión responde 401 y no reserva", async () => {
    await darDeAlta("e1", "Portátil 07");
    const respuesta = await solicitar("e1", { devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
    expect(await almacen.obtener("prestamos_activos", "e1")).toBeUndefined();
  });
});

describe("POST /api/equipos/{id}/entrega", () => {
  const IT = "it@empresa.com";
  let correosIT: string | undefined;

  beforeEach(() => {
    correosIT = process.env["CORREOS_IT"];
    process.env["CORREOS_IT"] = IT;
  });
  afterEach(() => {
    if (correosIT === undefined) delete process.env["CORREOS_IT"];
    else process.env["CORREOS_IT"] = correosIT;
  });

  async function entregar(id: string, correo?: string) {
    const app = await servidor();
    return app.inject({
      method: "POST",
      url: `/api/equipos/${id}/entrega`,
      headers: correo ? { "x-correo": correo } : {},
    });
  }

  it("entrega un equipo reservado y conserva su persona y su fecha", async () => {
    await darDeAlta("e1", "Portátil 07");
    await solicitar("e1", { devolucion: "2026-11-20" }, "ana.perez@empresa.com");

    const respuesta = await entregar("e1", IT);

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({
      id: "e1",
      nombre: "Portátil 07",
      estado: "prestado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(await almacen.obtener("prestamos_activos", "e1")).toMatchObject({ estado: "prestado" });
    const [equipo] = (await listar("luis.gomez@empresa.com")).json<Record<string, unknown>[]>();
    expect(equipo).toMatchObject({ estado: "prestado", persona: "ana.perez@empresa.com" });
  });

  it("pasa la entrada del historial de reservado a prestado, sin añadir otra", async () => {
    await darDeAlta("e1", "Portátil 07");
    await solicitar("e1", { devolucion: "2026-11-20" }, "ana.perez@empresa.com");
    const [antes] = await almacen.listar<{ creado: string }>("prestamos_historial");

    await entregar("e1", IT);

    const entradas = await almacen.listar("prestamos_historial");
    expect(entradas).toEqual([
      {
        equipoId: "e1",
        persona: "ana.perez@empresa.com",
        devolucion: "2026-11-20",
        estado: "prestado",
        creado: antes?.creado,
      },
    ]);
  });

  it("una reserva sin id de historial deja una entrada nueva", async () => {
    await darDeAlta("e1", "Portátil 07");
    await reservar("e1", "ana.perez@empresa.com", "2026-11-20");
    const respuesta = await entregar("e1", IT);
    expect(respuesta.statusCode).toBe(200);
    expect(await almacen.listar("prestamos_historial")).toHaveLength(1);
  });

  it("un equipo disponible responde 409 y sigue disponible", async () => {
    await darDeAlta("e1", "Portátil 07");
    const respuesta = await entregar("e1", IT);
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está reservado" });
    expect(await almacen.obtener("prestamos_activos", "e1")).toBeUndefined();
  });

  it("un equipo ya prestado responde 409", async () => {
    await darDeAlta("e1", "Portátil 07");
    await solicitar("e1", { devolucion: "2026-11-20" }, "ana.perez@empresa.com");
    await entregar("e1", IT);
    const respuesta = await entregar("e1", IT);
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está reservado" });
  });

  it("un equipo que no existe responde 404", async () => {
    const respuesta = await entregar("no-existe", IT);
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("una cuenta que no es de IT responde 403 y el equipo sigue reservado", async () => {
    await darDeAlta("e1", "Portátil 07");
    await reservar("e1", "ana.perez@empresa.com", "2026-11-20");
    const respuesta = await entregar("e1", "ana.perez@empresa.com");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.obtener("prestamos_activos", "e1")).toMatchObject({ estado: "reservado" });
  });

  it("sin sesión responde 401", async () => {
    await darDeAlta("e1", "Portátil 07");
    await reservar("e1", "ana.perez@empresa.com", "2026-11-20");
    const respuesta = await entregar("e1");
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
    expect(await almacen.obtener("prestamos_activos", "e1")).toMatchObject({ estado: "reservado" });
  });
});

describe("POST /api/equipos/{id}/prestamo", () => {
  const IT = "it@empresa.com";
  const ANA = "ana.perez@empresa.com";
  let correosIT: string | undefined;

  beforeEach(() => {
    correosIT = process.env["CORREOS_IT"];
    process.env["CORREOS_IT"] = IT;
    // Solo se falsea Date, para que el servidor siga funcionando con los temporizadores reales.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-10T12:00:00+01:00"));
  });
  afterEach(() => {
    vi.useRealTimers();
    if (correosIT === undefined) delete process.env["CORREOS_IT"];
    else process.env["CORREOS_IT"] = correosIT;
  });

  async function prestar(id: string, cuerpo: object | undefined, correo?: string) {
    const app = await servidor();
    return app.inject({
      method: "POST",
      url: `/api/equipos/${id}/prestamo`,
      headers: correo ? { "x-correo": correo } : {},
      ...(cuerpo === undefined ? {} : { payload: cuerpo }),
    });
  }

  it("presta un equipo disponible a la persona indicada", async () => {
    await darDeAlta("e1", "Monitor 03");

    const respuesta = await prestar("e1", { persona: ANA, devolucion: "2026-11-20" }, IT);

    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id: "e1",
      nombre: "Monitor 03",
      estado: "prestado",
      persona: ANA,
      devolucion: "2026-11-20",
    });
    expect(await almacen.obtener("prestamos_activos", "e1")).toMatchObject({ persona: ANA, estado: "prestado" });
    expect(await almacen.listar("prestamos_historial")).toMatchObject([
      { equipoId: "e1", persona: ANA, devolucion: "2026-11-20", estado: "prestado" },
    ]);
  });

  it("admite una fecha de devolución anterior a hoy", async () => {
    await darDeAlta("e1", "Monitor 03");
    const respuesta = await prestar("e1", { persona: ANA, devolucion: "2026-11-03" }, IT);
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toMatchObject({ estado: "prestado", devolucion: "2026-11-03" });
  });

  it("sin persona responde 400 y el equipo sigue disponible", async () => {
    await darDeAlta("e1", "Monitor 03");
    const respuesta = await prestar("e1", { devolucion: "2026-11-20" }, IT);
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Faltan la persona o la fecha de devolución" });
    expect(await almacen.obtener("prestamos_activos", "e1")).toBeUndefined();
  });

  it("sin fecha responde 400 y el equipo sigue disponible", async () => {
    await darDeAlta("e1", "Monitor 03");
    const respuesta = await prestar("e1", { persona: ANA }, IT);
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Faltan la persona o la fecha de devolución" });
    expect(await almacen.obtener("prestamos_activos", "e1")).toBeUndefined();
  });

  it("sin cuerpo responde 400", async () => {
    await darDeAlta("e1", "Monitor 03");
    const respuesta = await prestar("e1", undefined, IT);
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Faltan la persona o la fecha de devolución" });
  });

  it("una fecha inexistente responde 400 y el equipo sigue disponible", async () => {
    await darDeAlta("e1", "Monitor 03");
    const respuesta = await prestar("e1", { persona: ANA, devolucion: "2026-02-30" }, IT);
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
    expect(await almacen.obtener("prestamos_activos", "e1")).toBeUndefined();
  });

  it("un equipo que no existe responde 404", async () => {
    const respuesta = await prestar("no-existe", { persona: ANA, devolucion: "2026-11-20" }, IT);
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("un equipo reservado responde 409 y la reserva no cambia", async () => {
    await darDeAlta("e1", "Monitor 03");
    await reservar("e1", "luis.gomez@empresa.com", "2026-11-15");

    const respuesta = await prestar("e1", { persona: ANA, devolucion: "2026-11-20" }, IT);

    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await almacen.obtener("prestamos_activos", "e1")).toMatchObject({
      persona: "luis.gomez@empresa.com",
      estado: "reservado",
    });
    expect(await almacen.listar("prestamos_historial")).toHaveLength(0);
  });

  it("con una solicitud y un préstamo simultáneos una sale bien y la otra recibe 409", async () => {
    await darDeAlta("e1", "Monitor 03");
    const [a, b] = await Promise.all([
      solicitar("e1", { devolucion: "2026-11-20" }, ANA),
      prestar("e1", { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" }, IT),
    ]);
    expect([a.statusCode, b.statusCode].sort()).toEqual([201, 409]);
    const rechazada = a.statusCode === 409 ? a : b;
    expect(rechazada.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await almacen.listar("prestamos_activos")).toHaveLength(1);
    expect(await almacen.listar("prestamos_historial")).toHaveLength(1);
  });

  it("una cuenta que no es de IT responde 403 y el equipo sigue disponible", async () => {
    await darDeAlta("e1", "Monitor 03");
    const respuesta = await prestar("e1", { persona: ANA, devolucion: "2026-11-20" }, ANA);
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.obtener("prestamos_activos", "e1")).toBeUndefined();
  });

  it("sin sesión responde 401", async () => {
    await darDeAlta("e1", "Monitor 03");
    const respuesta = await prestar("e1", { persona: ANA, devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
    expect(await almacen.obtener("prestamos_activos", "e1")).toBeUndefined();
  });
});

describe("fecha de devolución de la solicitud", () => {
  beforeEach(() => {
    // Solo se falsea Date, para que el servidor siga funcionando con los temporizadores reales.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-10T12:00:00+01:00"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("la fecha de hoy reserva el equipo", async () => {
    await darDeAlta("e1", "Portátil 07");
    const respuesta = await solicitar("e1", { devolucion: "2026-11-10" }, "ana.perez@empresa.com");
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toMatchObject({ estado: "reservado", devolucion: "2026-11-10" });
  });

  it("una fecha pasada responde 400 y el equipo sigue disponible", async () => {
    await darDeAlta("e1", "Portátil 07");
    const respuesta = await solicitar("e1", { devolucion: "2026-11-09" }, "ana.perez@empresa.com");
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución ya ha pasado" });
    expect(await almacen.obtener("prestamos_activos", "e1")).toBeUndefined();
    expect(await almacen.listar("prestamos_historial")).toHaveLength(0);
  });

  it("una fecha inexistente responde 400 y el equipo sigue disponible", async () => {
    await darDeAlta("e1", "Portátil 07");
    const respuesta = await solicitar("e1", { devolucion: "2026-02-30" }, "ana.perez@empresa.com");
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
    expect(await almacen.obtener("prestamos_activos", "e1")).toBeUndefined();
  });

  it("un texto que no es AAAA-MM-DD responde 400", async () => {
    await darDeAlta("e1", "Portátil 07");
    const respuesta = await solicitar("e1", { devolucion: "mañana" }, "ana.perez@empresa.com");
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
  });

  it("sin fecha responde 400 y el equipo sigue disponible", async () => {
    await darDeAlta("e1", "Portátil 07");
    const respuesta = await solicitar("e1", {}, "ana.perez@empresa.com");
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Falta la fecha de devolución" });
    expect(await almacen.obtener("prestamos_activos", "e1")).toBeUndefined();
  });
});

describe("hoyEnMadrid", () => {
  it("usa el día de Madrid, no el de UTC", () => {
    expect(hoyEnMadrid(new Date("2026-11-09T23:30:00Z"))).toBe("2026-11-10");
    expect(hoyEnMadrid(new Date("2026-07-09T22:30:00Z"))).toBe("2026-07-10");
  });
});

describe("GET /api/equipos", () => {
  it("lista cada equipo con su estado, y persona y devolucion solo si está reservado", async () => {
    await darDeAlta("e1", "Portátil 07");
    await darDeAlta("e2", "Proyector 01");
    await reservar("e2", "ana.perez@empresa.com", "2026-11-20");

    const respuesta = await listar("luis.gomez@empresa.com");

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { id: "e1", nombre: "Portátil 07", estado: "disponible" },
      { id: "e2", nombre: "Proyector 01", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-11-20" },
    ]);
  });

  it("un equipo disponible no lleva persona ni devolucion", async () => {
    await darDeAlta("e1", "Portátil 07");
    const [equipo] = (await listar("luis.gomez@empresa.com")).json<Record<string, unknown>[]>();
    expect(equipo).not.toHaveProperty("persona");
    expect(equipo).not.toHaveProperty("devolucion");
  });

  it("un equipo prestado se lista con persona y devolucion", async () => {
    await darDeAlta("e1", "Monitor 01");
    await almacen.guardar("prestamos_activos", "e1", {
      equipoId: "e1",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-05",
      estado: "prestado",
    });
    const respuesta = await listar("luis.gomez@empresa.com");
    expect(respuesta.json()).toEqual([
      { id: "e1", nombre: "Monitor 01", estado: "prestado", persona: "ana.perez@empresa.com", devolucion: "2026-11-05" },
    ]);
  });

  it("sin equipos responde 200 con una lista vacía", async () => {
    const respuesta = await listar("luis.gomez@empresa.com");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("sin sesión responde 401 y no lista ningún equipo", async () => {
    await darDeAlta("e1", "Portátil 07");
    const respuesta = await listar();
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});
