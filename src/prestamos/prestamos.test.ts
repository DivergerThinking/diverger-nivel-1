import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const ana: Persona = { email: "ana.perez@empresa.com", nombre: "Ana" };

function pedir(servidorListo: FastifyInstance, id: string, cuerpo: unknown) {
  return servidorListo.inject({ method: "POST", url: `/api/equipos/${id}/solicitud`, payload: cuerpo as object });
}

describe("POST /api/equipos/{id}/solicitud", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-09T10:00:00+01:00"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reserva un equipo disponible a nombre de quien lo pide", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const app1 = await servidor(ana, almacen);
    const respuesta = await pedir(app1, "eq-7", { devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id: "eq-7",
      nombre: "Portátil 07",
      estado: "reservado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    const lista = await app1.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toContainEqual(expect.objectContaining({ id: "eq-7", estado: "reservado" }));
  });

  it("acepta la fecha de hoy en Madrid", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const respuesta = await pedir(await servidor(ana, almacen), "eq-7", { devolucion: "2026-11-09" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toMatchObject({ estado: "reservado", devolucion: "2026-11-09" });
  });

  it("hoy es el día de Madrid aunque en UTC sea otro", async () => {
    vi.setSystemTime(new Date("2026-11-09T23:30:00Z"));
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const app1 = await servidor(ana, almacen);
    expect((await pedir(app1, "eq-7", { devolucion: "2026-11-09" })).statusCode).toBe(400);
    expect((await pedir(app1, "eq-7", { devolucion: "2026-11-10" })).statusCode).toBe(201);
  });

  it("rechaza una fecha anterior a hoy y el equipo sigue disponible", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const app1 = await servidor(ana, almacen);
    const respuesta = await pedir(app1, "eq-7", { devolucion: "2026-11-08" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución ya ha pasado" });
    const lista = await app1.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toEqual([{ id: "eq-7", nombre: "Portátil 07", estado: "disponible" }]);
  });

  it.each(["2026-02-30", "20-11-2026", "mañana", "2026-13-01"])("rechaza la fecha no válida %s", async (devolucion) => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const respuesta = await pedir(await servidor(ana, almacen), "eq-7", { devolucion });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
  });

  it("rechaza una fecha que no es texto", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const respuesta = await pedir(await servidor(ana, almacen), "eq-7", { devolucion: 20261120 });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
  });

  it("rechaza una solicitud sin fecha", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const respuesta = await pedir(await servidor(ana, almacen), "eq-7", {});
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Falta la fecha de devolución" });
  });

  it("responde 409 si el equipo está prestado", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    await conPrestamo(almacen, "eq-7", "prestado");
    const respuesta = await pedir(await servidor(ana, almacen), "eq-7", { devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
  });

  it("responde 409 si el equipo ya está reservado y no cambia la reserva", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const app1 = await servidor(ana, almacen);
    await pedir(app1, "eq-7", { devolucion: "2026-11-20" });
    const respuesta = await pedir(app1, "eq-7", { devolucion: "2026-12-01" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await almacen.listar(COLECCION_PRESTAMOS)).toHaveLength(1);
  });

  it("de dos solicitudes simultáneas de personas distintas una recibe 201 y la otra 409", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const app1 = await servidor(ana, almacen);
    const app2 = await servidor({ email: "luis.gomez@empresa.com", nombre: "Luis" }, almacen);
    const [r1, r2] = await Promise.all([
      pedir(app1, "eq-7", { devolucion: "2026-11-20" }),
      pedir(app2, "eq-7", { devolucion: "2026-11-20" }),
    ]);
    const respuestas = [r1, r2];
    const ganadora = respuestas.find((r) => r.statusCode === 201);
    const perdedora = respuestas.find((r) => r.statusCode === 409);
    expect(ganadora).toBeDefined();
    expect(perdedora?.json()).toEqual({ error: "El equipo no está disponible" });
    expect(ganadora?.json()).toMatchObject({ id: "eq-7", estado: "reservado" });
    expect(await almacen.listar(COLECCION_PRESTAMOS)).toHaveLength(1);
    const lista = await app2.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toEqual([
      expect.objectContaining({ id: "eq-7", estado: "reservado", persona: (ganadora?.json() as { persona: string }).persona }),
    ]);
  });

  it("una solicitud y un préstamo en el mostrador simultáneos no se quedan el mismo equipo", async () => {
    vi.stubEnv("CORREOS_IT", "tecnico@empresa.com");
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const app1 = await servidor(ana, almacen);
    const app2 = await servidor({ email: "tecnico@empresa.com", nombre: "Técnico" }, almacen);
    const respuestas = await Promise.all([
      pedir(app1, "eq-7", { devolucion: "2026-11-20" }),
      app2.inject({
        method: "POST",
        url: "/api/equipos/eq-7/prestamo",
        payload: { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" },
      }),
    ]);
    vi.unstubAllEnvs();
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(await almacen.listar(COLECCION_PRESTAMOS)).toHaveLength(1);
  });

  it("responde 404 si el equipo no existe", async () => {
    const respuesta = await pedir(await servidor(ana, almacenEnMemoria()), "eq-99", { devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 401 sin sesión", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const respuesta = await pedir(await servidor(null, almacen), "eq-7", { devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("POST /api/equipos/{id}/entrega", () => {
  const tecnica: Persona = { email: "tecnico@empresa.com", nombre: "Técnico" };

  beforeEach(() => {
    vi.stubEnv("CORREOS_IT", "tecnico@empresa.com");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function entregar(servidorListo: FastifyInstance, id: string) {
    return servidorListo.inject({ method: "POST", url: `/api/equipos/${id}/entrega` });
  }

  it("entrega un equipo reservado con la persona y la devolución de la solicitud", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    await conPrestamo(almacen, "eq-7", "reservado");
    const app1 = await servidor(tecnica, almacen);
    const respuesta = await entregar(app1, "eq-7");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({
      id: "eq-7",
      nombre: "Portátil 07",
      estado: "prestado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    const lista = await app1.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toContainEqual(expect.objectContaining({ id: "eq-7", estado: "prestado" }));
  });

  it("responde 409 si el equipo está disponible y sigue disponible", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const app1 = await servidor(tecnica, almacen);
    const respuesta = await entregar(app1, "eq-7");
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está reservado" });
    const lista = await app1.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toEqual([{ id: "eq-7", nombre: "Portátil 07", estado: "disponible" }]);
  });

  it("responde 409 si el equipo ya está prestado", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    await conPrestamo(almacen, "eq-7", "prestado");
    const respuesta = await entregar(await servidor(tecnica, almacen), "eq-7");
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está reservado" });
  });

  it("responde 404 si el equipo no existe", async () => {
    const respuesta = await entregar(await servidor(tecnica, almacenEnMemoria()), "eq-99");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 si la cuenta no es de IT y no cambia el equipo", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    await conPrestamo(almacen, "eq-7", "reservado");
    const app1 = await servidor(empleada, almacen);
    const respuesta = await entregar(app1, "eq-7");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    const lista = await app1.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toContainEqual(expect.objectContaining({ id: "eq-7", estado: "reservado" }));
  });

  it("responde 401 sin sesión", async () => {
    const respuesta = await entregar(await servidor(null, almacenEnMemoria()), "eq-7");
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("POST /api/equipos/{id}/prestamo", () => {
  const tecnica: Persona = { email: "tecnico@empresa.com", nombre: "Técnico" };

  beforeEach(() => {
    vi.stubEnv("CORREOS_IT", "tecnico@empresa.com");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-09T10:00:00+01:00"));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  function prestar(servidorListo: FastifyInstance, id: string, cuerpo: unknown) {
    return servidorListo.inject({ method: "POST", url: `/api/equipos/${id}/prestamo`, payload: cuerpo as object });
  }

  it("presta un equipo disponible a la persona indicada", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const app1 = await servidor(tecnica, almacen);
    const respuesta = await prestar(app1, "eq-7", { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id: "eq-7",
      nombre: "Portátil 07",
      estado: "prestado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    const lista = await app1.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toContainEqual(expect.objectContaining({ id: "eq-7", estado: "prestado" }));
  });

  it("acepta una fecha anterior a hoy", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const respuesta = await prestar(await servidor(tecnica, almacen), "eq-7", {
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-05",
    });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toMatchObject({ estado: "prestado", devolucion: "2026-11-05" });
  });

  it("rechaza un préstamo sin persona", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const respuesta = await prestar(await servidor(tecnica, almacen), "eq-7", { devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Faltan la persona o la fecha de devolución" });
  });

  it("rechaza un préstamo sin fecha y el equipo sigue disponible", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const app1 = await servidor(tecnica, almacen);
    const respuesta = await prestar(app1, "eq-7", { persona: "ana.perez@empresa.com" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Faltan la persona o la fecha de devolución" });
    const lista = await app1.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toEqual([{ id: "eq-7", nombre: "Portátil 07", estado: "disponible" }]);
  });

  it.each(["2026-02-30", "20-11-2026", "2026-13-01"])("rechaza la fecha no válida %s", async (devolucion) => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const respuesta = await prestar(await servidor(tecnica, almacen), "eq-7", { persona: "ana.perez@empresa.com", devolucion });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
  });

  it("responde 409 si el equipo está reservado y no crea otro préstamo", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    await conPrestamo(almacen, "eq-7", "reservado");
    const respuesta = await prestar(await servidor(tecnica, almacen), "eq-7", {
      persona: "luis@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await almacen.listar(COLECCION_PRESTAMOS)).toHaveLength(1);
  });

  it("de dos préstamos simultáneos uno recibe 201 y el otro 409", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const app1 = await servidor(tecnica, almacen);
    const respuestas = await Promise.all([
      prestar(app1, "eq-7", { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" }),
      prestar(app1, "eq-7", { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" }),
    ]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(respuestas.find((r) => r.statusCode === 409)?.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await almacen.listar(COLECCION_PRESTAMOS)).toHaveLength(1);
    const lista = await app1.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toEqual([expect.objectContaining({ id: "eq-7", estado: "prestado" })]);
  });

  it("responde 404 si el equipo no existe", async () => {
    const respuesta = await prestar(await servidor(tecnica, almacenEnMemoria()), "eq-99", {
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 si la cuenta no es de IT y no presta el equipo", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const respuesta = await prestar(await servidor(empleada, almacen), "eq-7", {
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.listar(COLECCION_PRESTAMOS)).toHaveLength(0);
  });

  it("responde 401 sin sesión", async () => {
    const respuesta = await prestar(await servidor(null, almacenEnMemoria()), "eq-7", {
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("POST /api/equipos/{id}/devolucion", () => {
  const tecnica: Persona = { email: "tecnico@empresa.com", nombre: "Técnico" };

  beforeEach(() => {
    vi.stubEnv("CORREOS_IT", "tecnico@empresa.com");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function devolver(servidorListo: FastifyInstance, id: string) {
    return servidorListo.inject({ method: "POST", url: `/api/equipos/${id}/devolucion` });
  }

  it("apunta la devolución de un equipo prestado y queda disponible", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    await conPrestamo(almacen, "eq-7", "prestado");
    const app1 = await servidor(tecnica, almacen);
    const respuesta = await devolver(app1, "eq-7");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({ id: "eq-7", nombre: "Portátil 07", estado: "disponible" });
    const lista = await app1.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toEqual([{ id: "eq-7", nombre: "Portátil 07", estado: "disponible" }]);
  });

  it("conserva el préstamo como devuelto y el equipo se puede volver a prestar", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    await conPrestamo(almacen, "eq-7", "prestado");
    const app1 = await servidor(tecnica, almacen);
    await devolver(app1, "eq-7");
    expect(await almacen.listar<Prestamo>(COLECCION_PRESTAMOS)).toEqual([expect.objectContaining({ estado: "devuelto" })]);
    expect(await almacen.obtener(COLECCION_ACTIVOS, "eq-7")).toBeUndefined();
    const nuevo = await app1.inject({
      method: "POST",
      url: "/api/equipos/eq-7/prestamo",
      payload: { persona: "luis.gomez@empresa.com", devolucion: "2026-12-01" },
    });
    expect(nuevo.statusCode).toBe(201);
  });

  it("responde 409 si el equipo está reservado y sigue reservado", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    await conPrestamo(almacen, "eq-7", "reservado");
    const app1 = await servidor(tecnica, almacen);
    const respuesta = await devolver(app1, "eq-7");
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está prestado" });
    const lista = await app1.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toContainEqual(expect.objectContaining({ id: "eq-7", estado: "reservado" }));
  });

  it("responde 409 si el equipo está disponible", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    const respuesta = await devolver(await servidor(tecnica, almacen), "eq-7");
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está prestado" });
  });

  it("responde 404 si el equipo no existe", async () => {
    const respuesta = await devolver(await servidor(tecnica, almacenEnMemoria()), "eq-99");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 si la cuenta no es de IT y el equipo sigue prestado", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "eq-7", "Portátil 07");
    await conPrestamo(almacen, "eq-7", "prestado");
    const app1 = await servidor(empleada, almacen);
    const respuesta = await devolver(app1, "eq-7");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    const lista = await app1.inject({ method: "GET", url: "/api/equipos" });
    expect(lista.json()).toContainEqual(expect.objectContaining({ id: "eq-7", estado: "prestado" }));
  });

  it("responde 401 sin sesión", async () => {
    const respuesta = await devolver(await servidor(null, almacenEnMemoria()), "eq-7");
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("GET /api/prestamos/vencidos", () => {
  const tecnica: Persona = { email: "tecnico@empresa.com", nombre: "Técnico" };

  beforeEach(() => {
    vi.stubEnv("CORREOS_IT", "tecnico@empresa.com");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-09T10:00:00+01:00"));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  function vencidos(servidorListo: FastifyInstance) {
    return servidorListo.inject({ method: "GET", url: "/api/prestamos/vencidos" });
  }

  async function prestar(almacen: Almacen, equipo: string, devolucion: string, estado: Prestamo["estado"] = "prestado") {
    const prestamo: Prestamo = {
      id: `p-${equipo}`,
      equipo,
      persona: "ana.perez@empresa.com",
      devolucion,
      estado,
      creado: "2026-10-01T10:00:00.000Z",
    };
    await almacen.guardar(COLECCION_PRESTAMOS, prestamo.id, prestamo);
    if (estado !== "devuelto") await almacen.guardar(COLECCION_ACTIVOS, equipo, { prestamo: prestamo.id });
  }

  it("lista los prestados con devolución anterior a hoy, del más antiguo al más reciente, sin el que vence hoy", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e7", "Portátil 07");
    await darDeAlta(almacen, "e2", "Monitor 02");
    await darDeAlta(almacen, "e1", "Proyector 01");
    await prestar(almacen, "e7", "2026-11-05");
    await prestar(almacen, "e2", "2026-11-01");
    await prestar(almacen, "e1", "2026-11-09");
    const respuesta = await vencidos(await servidor(tecnica, almacen));
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { id: "e2", nombre: "Monitor 02", persona: "ana.perez@empresa.com", devolucion: "2026-11-01" },
      { id: "e7", nombre: "Portátil 07", persona: "ana.perez@empresa.com", devolucion: "2026-11-05" },
    ]);
  });

  it("no incluye un equipo reservado aunque su fecha haya pasado", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e7", "Portátil 07");
    await prestar(almacen, "e7", "2026-11-05", "reservado");
    const respuesta = await vencidos(await servidor(tecnica, almacen));
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("no incluye un préstamo ya devuelto", async () => {
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e7", "Portátil 07");
    await prestar(almacen, "e7", "2026-11-05", "devuelto");
    expect((await vencidos(await servidor(tecnica, almacen))).json()).toEqual([]);
  });

  it("hoy es el día de Madrid aunque en UTC sea otro", async () => {
    vi.setSystemTime(new Date("2026-11-09T23:30:00Z"));
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e7", "Portátil 07");
    await prestar(almacen, "e7", "2026-11-09");
    expect((await vencidos(await servidor(tecnica, almacen))).json()).toEqual([
      { id: "e7", nombre: "Portátil 07", persona: "ana.perez@empresa.com", devolucion: "2026-11-09" },
    ]);
  });

  it("responde 403 si la cuenta no es de IT", async () => {
    const respuesta = await vencidos(await servidor(empleada, almacenEnMemoria()));
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });

  it("responde 401 sin sesión", async () => {
    const respuesta = await vencidos(await servidor(null, almacenEnMemoria()));
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
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
