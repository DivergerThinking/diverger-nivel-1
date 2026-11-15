import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { darDeAlta } from "../equipos/equipos.js";
import { rutas } from "./index.js";
import { COLECCION_ACTIVOS, COLECCION_PRESTAMOS, consultarHistorial, entregarEquipo, esFechaReal, hoyEnMadrid, listarEquiposConEstado, listarVencidos, prestarEquipo, registrarDevolucion, solicitarEquipo, type Prestamo } from "./prestamos.js";

async function servidor(almacen: Almacen) {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _reply, hecho) => {
    request.persona = { email: "ana.perez@empresa.com", nombre: "Ana" };
    hecho();
  });
  await app.register(rutas, { almacen });
  return app;
}

async function equipoNuevo(almacen: Almacen, nombre: string): Promise<string> {
  const resultado = await darDeAlta(almacen, nombre);
  if (resultado.tipo !== "creado") throw new Error("No se ha creado el equipo");
  return resultado.equipo.id;
}

async function prestar(almacen: Almacen, equipoId: string, estado: Prestamo["estado"], persona: string, devolucion: string) {
  const id = `p-${equipoId}`;
  const prestamo: Prestamo = { id, equipoId, persona, devolucion, estado, creadoEn: "2026-11-14T10:00:00Z" };
  await almacen.guardar(COLECCION_PRESTAMOS, id, prestamo);
  if (estado !== "devuelto") await almacen.guardar(COLECCION_ACTIVOS, equipoId, { prestamoId: id });
}

async function guardarPrestamo(almacen: Almacen, p: Prestamo) {
  await almacen.guardar(COLECCION_PRESTAMOS, p.id, p);
}

describe("GET /api/prestamos/vencidos", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("responde 200 con los prestados vencidos, del más antiguo al más reciente", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const proyector = await equipoNuevo(almacen, "Proyector 02");
    const monitor = await equipoNuevo(almacen, "Monitor 03");
    await prestar(almacen, proyector, "prestado", "ana.perez@empresa.com", "2026-11-12");
    await prestar(almacen, monitor, "prestado", "luis.gomez@empresa.com", "2026-11-10");
    const app = await servidor(almacen);
    const respuesta = await app.inject("/api/prestamos/vencidos");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { id: monitor, nombre: "Monitor 03", persona: "luis.gomez@empresa.com", devolucion: "2026-11-10" },
      { id: proyector, nombre: "Proyector 02", persona: "ana.perez@empresa.com", devolucion: "2026-11-12" },
    ]);
  });

  it("no incluye los que vencen hoy, los reservados, los devueltos ni los disponibles", async () => {
    const almacen = almacenEnMemoria();
    const hoy = await equipoNuevo(almacen, "Portátil 07");
    const reservado = await equipoNuevo(almacen, "Cámara 01");
    const devuelto = await equipoNuevo(almacen, "Monitor 04");
    await equipoNuevo(almacen, "Ratón 05");
    await prestar(almacen, hoy, "prestado", "ana.perez@empresa.com", "2026-11-14");
    await prestar(almacen, reservado, "reservado", "ana.perez@empresa.com", "2026-11-01");
    await prestar(almacen, devuelto, "devuelto", "ana.perez@empresa.com", "2026-11-01");
    expect(await listarVencidos(almacen, new Date("2026-11-14T10:00:00Z"))).toEqual([]);
  });

  it("responde 403 «Solo IT puede hacer esto.» y ninguna lista a una cuenta que no es de IT", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com,soporte@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Proyector 02");
    await prestar(almacen, id, "prestado", "ana.perez@empresa.com", "2026-11-12");
    const app = await servidor(almacen);
    const respuesta = await app.inject("/api/prestamos/vencidos");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });
});

describe("GET /api/equipos/:id/historial", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("responde 200 con los préstamos del equipo, del más reciente al más antiguo", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    const otro = await equipoNuevo(almacen, "Monitor 03");
    await guardarPrestamo(almacen, { id: "p1", equipoId: id, persona: "ana.perez@empresa.com", devolucion: "2026-11-10", estado: "devuelto", creadoEn: "2026-11-01T09:00:00Z" });
    await guardarPrestamo(almacen, { id: "p2", equipoId: id, persona: "luis.gomez@empresa.com", devolucion: "2026-11-25", estado: "reservado", creadoEn: "2026-11-12T09:00:00Z" });
    await guardarPrestamo(almacen, { id: "p3", equipoId: otro, persona: "eva@empresa.com", devolucion: "2026-11-30", estado: "prestado", creadoEn: "2026-11-13T09:00:00Z" });
    await almacen.guardar(COLECCION_ACTIVOS, id, { prestamoId: "p2" });
    const app = await servidor(almacen);
    const respuesta = await app.inject(`/api/equipos/${id}/historial`);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { persona: "luis.gomez@empresa.com", devolucion: "2026-11-25", estado: "reservado" },
      { persona: "ana.perez@empresa.com", devolucion: "2026-11-10", estado: "devuelto" },
    ]);
  });

  it("responde 200 con una lista vacía si el equipo no se ha prestado nunca", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    const app = await servidor(almacen);
    const respuesta = await app.inject(`/api/equipos/${id}/historial`);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("responde 404 «No existe el equipo» si el equipo no existe", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const app = await servidor(almacenEnMemoria());
    const respuesta = await app.inject("/api/equipos/equipo-inexistente/historial");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 «Solo IT puede hacer esto.» a una cuenta que no es de IT", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    const app = await servidor(almacen);
    const respuesta = await app.inject(`/api/equipos/${id}/historial`);
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });
});

describe("POST /api/equipos/:id/entrega", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const entregar = async (almacen: Almacen, id: string) => {
    const app = await servidor(almacen);
    return app.inject({ method: "POST", url: `/api/equipos/${id}/entrega` });
  };

  it("responde 200 con el equipo prestado a quien lo pidió, con su devolución, y lo deja prestado", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    await prestar(almacen, id, "reservado", "luis.gomez@empresa.com", "2026-11-20");
    const respuesta = await entregar(almacen, id);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({ id, nombre: "Portátil 07", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" });
    expect(await listarEquiposConEstado(almacen)).toEqual([
      { id, nombre: "Portátil 07", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" },
    ]);
  });

  it("responde 409 «El equipo no está reservado» si está disponible y sigue disponible", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Monitor 03");
    const respuesta = await entregar(almacen, id);
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está reservado" });
    expect(await listarEquiposConEstado(almacen)).toEqual([{ id, nombre: "Monitor 03", estado: "disponible" }]);
  });

  it("responde 409 si el equipo ya está prestado o su préstamo está devuelto", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const prestado = await equipoNuevo(almacen, "Proyector 02");
    const devuelto = await equipoNuevo(almacen, "Monitor 03");
    await prestar(almacen, prestado, "prestado", "luis.gomez@empresa.com", "2026-11-20");
    await prestar(almacen, devuelto, "devuelto", "luis.gomez@empresa.com", "2026-11-20");
    await almacen.guardar(COLECCION_ACTIVOS, devuelto, { prestamoId: `p-${devuelto}` });
    for (const id of [prestado, devuelto]) {
      const respuesta = await entregar(almacen, id);
      expect(respuesta.statusCode).toBe(409);
      expect(respuesta.json()).toEqual({ error: "El equipo no está reservado" });
    }
  });

  it("responde 403 «Solo IT puede hacer esto.» a una cuenta que no es de IT y sigue reservado", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com,soporte@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    await prestar(almacen, id, "reservado", "ana.perez@empresa.com", "2026-11-20");
    const respuesta = await entregar(almacen, id);
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await listarEquiposConEstado(almacen)).toEqual([
      { id, nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-11-20" },
    ]);
  });

  it("responde 404 «No existe el equipo» si el equipo no existe", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const respuesta = await entregar(almacenEnMemoria(), "equipo-inexistente");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("con dos entregas a la vez, una sale bien y la otra recibe 409", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    await prestar(almacen, id, "reservado", "luis.gomez@empresa.com", "2026-11-20");
    const resultados = await Promise.all([entregarEquipo(almacen, id), entregarEquipo(almacen, id)]);
    expect(resultados.map((r) => r.tipo).sort()).toEqual(["noReservado", "prestado"]);
  });
});

describe("POST /api/equipos/:id/devolucion", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const devolver = async (almacen: Almacen, id: string) => {
    const app = await servidor(almacen);
    return app.inject({ method: "POST", url: `/api/equipos/${id}/devolucion` });
  };

  it("responde 200 con el equipo disponible, sin persona ni devolución, y lo deja disponible con el préstamo devuelto", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Monitor 03");
    await prestar(almacen, id, "prestado", "luis.gomez@empresa.com", "2026-11-20");
    const respuesta = await devolver(almacen, id);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({ id, nombre: "Monitor 03", estado: "disponible" });
    expect(await listarEquiposConEstado(almacen)).toEqual([{ id, nombre: "Monitor 03", estado: "disponible" }]);
    expect(await consultarHistorial(almacen, id)).toEqual([{ persona: "luis.gomez@empresa.com", devolucion: "2026-11-20", estado: "devuelto" }]);
  });

  it("responde 409 «El equipo no está prestado» si está reservado y sigue reservado", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    await prestar(almacen, id, "reservado", "ana.perez@empresa.com", "2026-11-20");
    const respuesta = await devolver(almacen, id);
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está prestado" });
    expect(await listarEquiposConEstado(almacen)).toEqual([
      { id, nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-11-20" },
    ]);
  });

  it("responde 409 si el equipo está disponible o ya devuelto", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const nuevo = await equipoNuevo(almacen, "Proyector 02");
    const devuelto = await equipoNuevo(almacen, "Monitor 03");
    await prestar(almacen, devuelto, "devuelto", "luis.gomez@empresa.com", "2026-11-20");
    await almacen.guardar(COLECCION_ACTIVOS, devuelto, { prestamoId: `p-${devuelto}` });
    for (const id of [nuevo, devuelto]) {
      const respuesta = await devolver(almacen, id);
      expect(respuesta.statusCode).toBe(409);
      expect(respuesta.json()).toEqual({ error: "El equipo no está prestado" });
    }
  });

  it("responde 404 «No existe el equipo» si el equipo no existe", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const respuesta = await devolver(almacenEnMemoria(), "equipo-inexistente");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 «Solo IT puede hacer esto.» a una cuenta que no es de IT y sigue prestado", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Monitor 03");
    await prestar(almacen, id, "prestado", "luis.gomez@empresa.com", "2026-11-20");
    const respuesta = await devolver(almacen, id);
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await listarEquiposConEstado(almacen)).toEqual([
      { id, nombre: "Monitor 03", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" },
    ]);
  });

  it("un equipo devuelto se puede volver a prestar", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Monitor 03");
    await prestar(almacen, id, "prestado", "luis.gomez@empresa.com", "2026-11-20");
    await devolver(almacen, id);
    expect((await prestarEquipo(almacen, id, "eva@empresa.com", "2026-12-01")).tipo).toBe("prestado");
  });

  it("con dos devoluciones a la vez, una sale bien y la otra recibe 409", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Monitor 03");
    await prestar(almacen, id, "prestado", "luis.gomez@empresa.com", "2026-11-20");
    const resultados = await Promise.all([registrarDevolucion(almacen, id), registrarDevolucion(almacen, id)]);
    expect(resultados.map((r) => r.tipo).sort()).toEqual(["devuelto", "noPrestado"]);
  });
});

describe("POST /api/equipos/:id/prestamo", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const prestarEnMostrador = async (almacen: Almacen, id: string, cuerpo: unknown) => {
    const app = await servidor(almacen);
    return app.inject({ method: "POST", url: `/api/equipos/${id}/prestamo`, payload: cuerpo as object });
  };

  it("responde 201 con el equipo prestado a la persona con su devolución y lo deja prestado", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Monitor 03");
    const respuesta = await prestarEnMostrador(almacen, id, { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({ id, nombre: "Monitor 03", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" });
    expect(await listarEquiposConEstado(almacen)).toEqual([
      { id, nombre: "Monitor 03", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" },
    ]);
  });

  it("acepta una devolución anterior a hoy", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Monitor 03");
    const respuesta = await prestarEnMostrador(almacen, id, { persona: "luis.gomez@empresa.com", devolucion: "2026-11-10" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({ id, nombre: "Monitor 03", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-10" });
  });

  it("responde 400 «Faltan la persona o la fecha de devolución» sin persona, sin fecha o sin cuerpo y sigue disponible", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Monitor 03");
    for (const cuerpo of [{ devolucion: "2026-11-20" }, { persona: "luis.gomez@empresa.com" }, { persona: "", devolucion: "2026-11-20" }, {}]) {
      const respuesta = await prestarEnMostrador(almacen, id, cuerpo);
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "Faltan la persona o la fecha de devolución" });
    }
    expect(await listarEquiposConEstado(almacen)).toEqual([{ id, nombre: "Monitor 03", estado: "disponible" }]);
  });

  it("responde 400 «La fecha de devolución no es válida» con «2026-02-30» y sigue disponible", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Monitor 03");
    const respuesta = await prestarEnMostrador(almacen, id, { persona: "luis.gomez@empresa.com", devolucion: "2026-02-30" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
    expect(await listarEquiposConEstado(almacen)).toEqual([{ id, nombre: "Monitor 03", estado: "disponible" }]);
  });

  it("responde 409 «El equipo no está disponible» si está reservado y sigue reservado", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    await prestar(almacen, id, "reservado", "ana.perez@empresa.com", "2026-11-18");
    const respuesta = await prestarEnMostrador(almacen, id, { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await listarEquiposConEstado(almacen)).toEqual([
      { id, nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-11-18" },
    ]);
  });

  it("presta de nuevo un equipo cuyo préstamo anterior está devuelto", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Monitor 03");
    await prestar(almacen, id, "devuelto", "ana.perez@empresa.com", "2026-11-12");
    await almacen.guardar(COLECCION_ACTIVOS, id, { prestamoId: `p-${id}` });
    const respuesta = await prestarEnMostrador(almacen, id, { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(201);
  });

  it("responde 403 «Solo IT puede hacer esto.» a una cuenta que no es de IT y sigue disponible", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com,soporte@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Monitor 03");
    const respuesta = await prestarEnMostrador(almacen, id, { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await listarEquiposConEstado(almacen)).toEqual([{ id, nombre: "Monitor 03", estado: "disponible" }]);
  });

  it("responde 404 «No existe el equipo» si el equipo no existe", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const respuesta = await prestarEnMostrador(almacenEnMemoria(), "equipo-inexistente", { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("con un préstamo y una solicitud a la vez, una sale bien y la otra recibe 409", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Monitor 03");
    const resultados = await Promise.all([
      prestarEquipo(almacen, id, "luis.gomez@empresa.com", "2026-11-21"),
      solicitarEquipo(almacen, id, "ana.perez@empresa.com", "2026-11-20"),
    ]);
    expect(resultados.filter((r) => r.tipo === "noDisponible")).toHaveLength(1);
    expect(await almacen.listar(COLECCION_PRESTAMOS)).toHaveLength(1);
  });
});

describe("POST /api/equipos/:id/solicitud", () => {
  const pedir = async (almacen: Almacen, id: string, cuerpo: unknown) => {
    const app = await servidor(almacen);
    return app.inject({ method: "POST", url: `/api/equipos/${id}/solicitud`, payload: cuerpo as object });
  };

  it("responde 201 con el equipo reservado a nombre de la persona del token y lo deja reservado", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    const respuesta = await pedir(almacen, id, { devolucion: "2999-11-20" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id,
      nombre: "Portátil 07",
      estado: "reservado",
      persona: "ana.perez@empresa.com",
      devolucion: "2999-11-20",
    });
    expect(await listarEquiposConEstado(almacen)).toEqual([
      { id, nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2999-11-20" },
    ]);
  });

  it("acepta la fecha de hoy", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    const respuesta = await pedir(almacen, id, { devolucion: hoyEnMadrid() });
    expect(respuesta.statusCode).toBe(201);
  });

  it("responde 409 «El equipo no está disponible» si está prestado y no lo cambia", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Proyector 02");
    await prestar(almacen, id, "prestado", "luis.gomez@empresa.com", "2999-11-25");
    const respuesta = await pedir(almacen, id, { devolucion: "2999-11-20" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await listarEquiposConEstado(almacen)).toEqual([
      { id, nombre: "Proyector 02", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2999-11-25" },
    ]);
  });

  it("responde 409 si el equipo ya está reservado", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Proyector 02");
    await prestar(almacen, id, "reservado", "luis.gomez@empresa.com", "2999-11-25");
    const respuesta = await pedir(almacen, id, { devolucion: "2999-11-20" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
  });

  it("con dos solicitudes a la vez, una sale bien y la otra recibe 409", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    const respuestas = await Promise.all([pedir(almacen, id, { devolucion: "2999-11-20" }), pedir(almacen, id, { devolucion: "2999-11-21" })]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
  });

  it("un equipo devuelto se puede volver a pedir", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    await prestar(almacen, id, "devuelto", "luis.gomez@empresa.com", "2999-11-25");
    await almacen.guardar(COLECCION_ACTIVOS, id, { prestamoId: `p-${id}` });
    const respuesta = await pedir(almacen, id, { devolucion: "2999-11-20" });
    expect(respuesta.statusCode).toBe(201);
  });

  it("responde 404 «No existe el equipo» si el equipo no existe", async () => {
    const respuesta = await pedir(almacenEnMemoria(), "equipo-inexistente", { devolucion: "2999-11-20" });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 400 «Falta la fecha de devolución» sin fecha o sin cuerpo", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    for (const cuerpo of [{}, { devolucion: "" }, { devolucion: 20 }]) {
      const respuesta = await pedir(almacen, id, cuerpo);
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "Falta la fecha de devolución" });
    }
    const app = await servidor(almacen);
    const sinCuerpo = await app.inject({ method: "POST", url: `/api/equipos/${id}/solicitud` });
    expect(sinCuerpo.statusCode).toBe(400);
    expect(sinCuerpo.json()).toEqual({ error: "Falta la fecha de devolución" });
  });

  it("responde 400 «La fecha de devolución no es válida» si no es una fecha real", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    for (const devolucion of ["2999-02-30", "mañana", "20-11-2999", "2999-13-01"]) {
      const respuesta = await pedir(almacen, id, { devolucion });
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
    }
  });

  it("responde 400 «La fecha de devolución ya ha pasado» si es anterior a hoy y no reserva", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    const respuesta = await pedir(almacen, id, { devolucion: "2000-01-01" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución ya ha pasado" });
    expect(await listarEquiposConEstado(almacen)).toEqual([{ id, nombre: "Portátil 07", estado: "disponible" }]);
  });
});

describe("solicitarEquipo con la fecha de hoy en Madrid", () => {
  const ahora = new Date("2026-11-14T10:00:00Z");

  it("acepta la devolución de hoy (14 de noviembre de 2026) y reserva el equipo", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    const resultado = await solicitarEquipo(almacen, id, "ana.perez@empresa.com", "2026-11-14", ahora);
    expect(resultado).toEqual({
      tipo: "reservado",
      equipo: { id, nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-11-14" },
    });
  });

  it("rechaza la devolución de ayer y el equipo sigue disponible", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    expect(await solicitarEquipo(almacen, id, "ana.perez@empresa.com", "2026-11-13", ahora)).toEqual({ tipo: "fechaPasada" });
    expect(await listarEquiposConEstado(almacen)).toEqual([{ id, nombre: "Portátil 07", estado: "disponible" }]);
  });

  it("cuenta el día de Madrid: a las 23:30 UTC ya es el día siguiente", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    const tarde = new Date("2026-11-14T23:30:00Z");
    expect(await solicitarEquipo(almacen, id, "ana.perez@empresa.com", "2026-11-14", tarde)).toEqual({ tipo: "fechaPasada" });
  });

  it("rechaza una fecha inexistente o ausente y el equipo sigue disponible", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    expect(await solicitarEquipo(almacen, id, "ana.perez@empresa.com", "2026-02-30", ahora)).toEqual({ tipo: "fechaNoValida" });
    expect(await solicitarEquipo(almacen, id, "ana.perez@empresa.com", undefined, ahora)).toEqual({ tipo: "sinFecha" });
    expect(await listarEquiposConEstado(almacen)).toEqual([{ id, nombre: "Portátil 07", estado: "disponible" }]);
  });
});

describe("peticiones simultáneas sobre el mismo equipo", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const NO_DISPONIBLE = { error: "El equipo no está disponible" };

  it("con dos solicitudes de personas distintas, una recibe 201 reservado a su nombre y la otra 409", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Monitor 03");
    const [app1, app2] = await Promise.all([servidor(almacen), servidor(almacen)]);
    const respuestas = await Promise.all([
      app1.inject({ method: "POST", url: `/api/equipos/${id}/solicitud`, payload: { devolucion: "2999-11-20" } }),
      app2.inject({ method: "POST", url: `/api/equipos/${id}/solicitud`, payload: { devolucion: "2999-11-20" } }),
    ]);
    const buenas = respuestas.filter((r) => r.statusCode === 201);
    const malas = respuestas.filter((r) => r.statusCode === 409);
    expect(buenas).toHaveLength(1);
    expect(malas).toHaveLength(1);
    expect(buenas[0]?.json()).toMatchObject({ nombre: "Monitor 03", estado: "reservado", persona: "ana.perez@empresa.com" });
    expect(malas[0]?.json()).toEqual(NO_DISPONIBLE);
  });

  it("con una solicitud y un préstamo en el mostrador por HTTP, uno recibe 201, el otro 409 y el equipo queda a nombre de una sola persona", async () => {
    vi.stubEnv("CORREOS_IT", "ana.perez@empresa.com");
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Monitor 03");
    const app = await servidor(almacen);
    const respuestas = await Promise.all([
      app.inject({ method: "POST", url: `/api/equipos/${id}/solicitud`, payload: { devolucion: "2999-11-20" } }),
      app.inject({ method: "POST", url: `/api/equipos/${id}/prestamo`, payload: { persona: "luis.gomez@empresa.com", devolucion: "2999-11-21" } }),
    ]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(respuestas.find((r) => r.statusCode === 409)?.json()).toEqual(NO_DISPONIBLE);
    const equipos = await listarEquiposConEstado(almacen);
    expect(equipos).toHaveLength(1);
    expect(equipos[0]?.persona).toBe(respuestas.find((r) => r.statusCode === 201)?.json<{ persona: string }>().persona);
    expect(await almacen.listar(COLECCION_PRESTAMOS)).toHaveLength(1);
  });

  it("con 20 solicitudes de 20 empleados, exactamente una recibe 201, 19 reciben 409 y el historial tiene una sola reserva", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    const resultados = await Promise.all(
      Array.from({ length: 20 }, (_, i) => solicitarEquipo(almacen, id, `empleado${i}@empresa.com`, "2999-11-20")),
    );
    expect(resultados.filter((r) => r.tipo === "reservado")).toHaveLength(1);
    expect(resultados.filter((r) => r.tipo === "noDisponible")).toHaveLength(19);
    const historial = await consultarHistorial(almacen, id);
    expect(historial).toHaveLength(1);
    expect(historial?.[0]?.estado).toBe("reservado");
  });

  it("con 20 solicitudes por HTTP, 19 respuestas son 409 «El equipo no está disponible»", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    const app = await servidor(almacen);
    const respuestas = await Promise.all(
      Array.from({ length: 20 }, () => app.inject({ method: "POST", url: `/api/equipos/${id}/solicitud`, payload: { devolucion: "2999-11-20" } })),
    );
    expect(respuestas.filter((r) => r.statusCode === 201)).toHaveLength(1);
    const rechazadas = respuestas.filter((r) => r.statusCode === 409);
    expect(rechazadas).toHaveLength(19);
    for (const r of rechazadas) expect(r.json()).toEqual(NO_DISPONIBLE);
    expect(await almacen.listar(COLECCION_PRESTAMOS)).toHaveLength(1);
  });
});

describe("hoyEnMadrid y esFechaReal", () => {
  it("usa el día de Madrid, no el UTC", () => {
    expect(hoyEnMadrid(new Date("2026-11-14T23:30:00Z"))).toBe("2026-11-15");
    expect(hoyEnMadrid(new Date("2026-11-14T10:00:00Z"))).toBe("2026-11-14");
  });

  it("distingue fechas reales de las que no lo son", () => {
    expect(esFechaReal("2028-02-29")).toBe(true);
    expect(esFechaReal("2026-02-29")).toBe(false);
    expect(esFechaReal("2026-02-30")).toBe(false);
  });
});

describe("GET /api/equipos", () => {
  it("responde 200 con la lista de equipos, disponibles y sin persona ni fecha", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    const app = await servidor(almacen);
    const respuesta = await app.inject("/api/equipos");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([{ id, nombre: "Portátil 07", estado: "disponible" }]);
  });

  it("responde 200 con una lista vacía si no hay equipos", async () => {
    const app = await servidor(almacenEnMemoria());
    const respuesta = await app.inject("/api/equipos");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("enseña la persona y la devolución de un equipo prestado o reservado", async () => {
    const almacen = almacenEnMemoria();
    const proyector = await equipoNuevo(almacen, "Proyector 02");
    const monitor = await equipoNuevo(almacen, "Monitor 03");
    await prestar(almacen, proyector, "prestado", "ana.perez@empresa.com", "2026-11-20");
    await prestar(almacen, monitor, "reservado", "luis.gomez@empresa.com", "2026-11-25");
    const equipos = await listarEquiposConEstado(almacen);
    expect(equipos).toContainEqual({
      id: proyector,
      nombre: "Proyector 02",
      estado: "prestado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(equipos).toContainEqual({
      id: monitor,
      nombre: "Monitor 03",
      estado: "reservado",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-11-25",
    });
  });

  it("un equipo con el préstamo devuelto vuelve a estar disponible", async () => {
    const almacen = almacenEnMemoria();
    const id = await equipoNuevo(almacen, "Portátil 07");
    await prestar(almacen, id, "devuelto", "ana.perez@empresa.com", "2026-11-20");
    expect(await listarEquiposConEstado(almacen)).toEqual([{ id, nombre: "Portátil 07", estado: "disponible" }]);
  });
});
