import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { crearServidor } from "../../app/server.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas as rutasDeEquipos } from "../equipos/index.js";
import { rutas } from "./index.js";
import { hoyEnMadrid, listarVencidos, solicitarEquipo } from "./prestamos.js";

const PERSONAS: Record<string, { email: string; nombre: string }> = {
  it: { email: "it@empresa.com", nombre: "IT" },
  inventario: { email: "inventario@empresa.com", nombre: "Inventario" },
  ana: { email: "ana.perez@empresa.com", nombre: "Ana" },
  luis: { email: "luis.gomez@empresa.com", nombre: "Luis" },
};
const verificarToken = (token: string) => Promise.resolve(PERSONAS[token] ?? null);

const original = process.env.CORREOS_IT;
let app: FastifyInstance;
let almacen: Almacen;

beforeEach(async () => {
  process.env.CORREOS_IT = "it@empresa.com,inventario@empresa.com";
  almacen = almacenEnMemoria();
  app = await crearServidor({ googleClientId: "cliente", verificarToken, almacen, contextos: [rutasDeEquipos, rutas] });
});

afterEach(async () => {
  await app.close();
  if (original === undefined) delete process.env.CORREOS_IT;
  else process.env.CORREOS_IT = original;
});

const con = (token: string) => ({ authorization: `Bearer ${token}` });

async function darDeAlta(nombre: string): Promise<string> {
  const respuesta = await app.inject({ method: "POST", url: "/api/equipos", headers: con("it"), payload: { nombre } });
  return respuesta.json<{ id: string }>().id;
}

const solicitar = (token: string, id: string, cuerpo: object) =>
  app.inject({ method: "POST", url: `/api/equipos/${id}/solicitud`, headers: con(token), payload: cuerpo });

describe("acceso con la cuenta de Google (HU-ACC-01)", () => {
  it("reserva el equipo a nombre del correo del token", async () => {
    const id = await darDeAlta("Portátil 07");
    const respuesta = await solicitar("ana", id, { devolucion: "2999-11-20" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id,
      nombre: "Portátil 07",
      estado: "reservado",
      persona: "ana.perez@empresa.com",
      devolucion: "2999-11-20",
    });
  });

  it("deja listar los equipos a la cuenta de servicio del inventario", async () => {
    const id = await darDeAlta("Portátil 07");
    const respuesta = await app.inject({ url: "/api/equipos", headers: con("inventario") });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([{ id, nombre: "Portátil 07", estado: "disponible" }]);
  });

  it("responde 401 sin token de identidad", async () => {
    const respuesta = await app.inject("/api/prestamos/vencidos");
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("responde 401 si el token no se verifica (correo sin verificar u otro cliente OAuth)", async () => {
    const respuesta = await app.inject({ url: "/api/equipos", headers: con("luis-sin-verificar") });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("GET /api/equipos", () => {
  it("enseña el estado de cada equipo, con persona y devolución si no está disponible", async () => {
    const libre = await darDeAlta("Monitor 03");
    const pedido = await darDeAlta("Portátil 07");
    await solicitar("luis", pedido, { devolucion: "2999-11-20" });
    const lista = (await app.inject({ url: "/api/equipos", headers: con("ana") })).json<unknown[]>();
    expect(lista).toEqual([
      { id: libre, nombre: "Monitor 03", estado: "disponible" },
      { id: pedido, nombre: "Portátil 07", estado: "reservado", persona: "luis.gomez@empresa.com", devolucion: "2999-11-20" },
    ]);
  });
});

describe("ver los equipos y su estado (HU-SOL-01)", () => {
  it("enseña disponible sin persona ni devolución y prestado con persona y devolución", async () => {
    const libre = await darDeAlta("Portátil 07");
    const prestado = await darDeAlta("Monitor 03");
    await almacen.guardar("prestamos_estados", prestado, {
      equipoId: prestado,
      estado: "prestado",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-11-20",
      prestamoId: "prestamo-1",
    });
    const respuesta = await app.inject({ url: "/api/equipos", headers: con("ana") });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { id: prestado, nombre: "Monitor 03", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" },
      { id: libre, nombre: "Portátil 07", estado: "disponible" },
    ]);
  });

  it("responde 401 sin token de identidad y no lista ningún equipo", async () => {
    await darDeAlta("Portátil 07");
    const respuesta = await app.inject("/api/equipos");
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("POST /api/equipos/{id}/solicitud", () => {
  it("responde 400 si falta la fecha", async () => {
    const id = await darDeAlta("Portátil 07");
    const respuesta = await solicitar("ana", id, {});
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Falta la fecha de devolución" });
  });

  it("responde 400 si la fecha no existe o no es una fecha", async () => {
    const id = await darDeAlta("Portátil 07");
    for (const devolucion of ["2026-02-30", "mañana", 5]) {
      const respuesta = await solicitar("ana", id, { devolucion });
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
    }
    const [equipo] = (await app.inject({ url: "/api/equipos", headers: con("ana") })).json<{ estado: string }[]>();
    expect(equipo?.estado).toBe("disponible");
  });

  it("responde 400 si la fecha ya ha pasado y deja el equipo disponible", async () => {
    const id = await darDeAlta("Portátil 07");
    const respuesta = await solicitar("ana", id, { devolucion: "2000-01-01" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución ya ha pasado" });
    const [equipo] = (await app.inject({ url: "/api/equipos", headers: con("ana") })).json<{ estado: string }[]>();
    expect(equipo?.estado).toBe("disponible");
  });

  it("acepta la fecha de hoy en Madrid y rechaza la del día anterior", async () => {
    const id = await darDeAlta("Portátil 07");
    await expect(solicitarEquipo(almacen, id, "ana.perez@empresa.com", "2026-11-14", "2026-11-15")).rejects.toThrow(
      "La fecha de devolución ya ha pasado",
    );
    const equipo = await solicitarEquipo(almacen, id, "ana.perez@empresa.com", "2026-11-15", "2026-11-15");
    expect(equipo.estado).toBe("reservado");
  });

  it("responde 409 si el equipo ya está reservado", async () => {
    const id = await darDeAlta("Monitor 03");
    await solicitar("luis", id, { devolucion: "2999-11-20" });
    const respuesta = await solicitar("ana", id, { devolucion: "2999-11-20" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
    const [equipo] = (await app.inject({ url: "/api/equipos", headers: con("ana") })).json<
      { estado: string; persona?: string }[]
    >();
    expect(equipo).toMatchObject({ estado: "reservado", persona: "luis.gomez@empresa.com" });
  });

  it("responde 404 si el id no es de ningún equipo", async () => {
    const respuesta = await solicitar("ana", "no-existe", { devolucion: "2999-11-20" });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("reserva una sola vez si dos solicitudes llegan a la vez", async () => {
    const id = await darDeAlta("Proyector 01");
    const respuestas = await Promise.all([
      solicitar("ana", id, { devolucion: "2999-11-20" }),
      solicitar("luis", id, { devolucion: "2999-11-20" }),
    ]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    const ganadora = respuestas.find((r) => r.statusCode === 201);
    const perdedora = respuestas.find((r) => r.statusCode === 409);
    expect(ganadora?.json()).toMatchObject({ id, estado: "reservado" });
    expect(perdedora?.json()).toEqual({ error: "El equipo no está disponible" });
    const lista = (await app.inject({ url: "/api/equipos", headers: con("ana") })).json<{ id: string; persona?: string }[]>();
    expect(lista.find((equipo) => equipo.id === id)?.persona).toBe(ganadora?.json<{ persona: string }>().persona);
    expect(await almacen.listar("prestamos_historial")).toHaveLength(1);
  });
});

describe("POST /api/equipos/{id}/entrega (HU-PRE-01)", () => {
  const entregar = (token: string, id: string) =>
    app.inject({ method: "POST", url: `/api/equipos/${id}/entrega`, headers: con(token) });

  it("pasa a prestado un equipo reservado, con la misma persona y devolución", async () => {
    const id = await darDeAlta("Portátil 07");
    await solicitar("ana", id, { devolucion: "2999-11-20" });
    const respuesta = await entregar("it", id);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({
      id,
      nombre: "Portátil 07",
      estado: "prestado",
      persona: "ana.perez@empresa.com",
      devolucion: "2999-11-20",
    });
    const [equipo] = (await app.inject({ url: "/api/equipos", headers: con("ana") })).json<{ estado: string }[]>();
    expect(equipo?.estado).toBe("prestado");
  });

  it("marca como prestado el préstamo del historial", async () => {
    const id = await darDeAlta("Portátil 07");
    await solicitar("ana", id, { devolucion: "2999-11-20" });
    await entregar("it", id);
    const historial = await almacen.listar<{ estado: string }>("prestamos_historial");
    expect(historial.map((p) => p.estado)).toEqual(["prestado"]);
  });

  it("responde 409 si el equipo está disponible y lo deja disponible", async () => {
    const id = await darDeAlta("Monitor 03");
    const respuesta = await entregar("it", id);
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está reservado" });
    const [equipo] = (await app.inject({ url: "/api/equipos", headers: con("ana") })).json<{ estado: string }[]>();
    expect(equipo?.estado).toBe("disponible");
  });

  it("responde 409 si el equipo ya está prestado", async () => {
    const id = await darDeAlta("Monitor 03");
    await solicitar("ana", id, { devolucion: "2999-11-20" });
    await entregar("it", id);
    const respuesta = await entregar("it", id);
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está reservado" });
  });

  it("responde 404 si el id no es de ningún equipo", async () => {
    const respuesta = await entregar("it", "no-existe");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 a quien no es de IT y no cambia el equipo", async () => {
    const id = await darDeAlta("Portátil 07");
    await solicitar("ana", id, { devolucion: "2999-11-20" });
    const respuesta = await entregar("ana", id);
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    const [equipo] = (await app.inject({ url: "/api/equipos", headers: con("ana") })).json<{ estado: string }[]>();
    expect(equipo?.estado).toBe("reservado");
  });

  it("responde 401 sin token de identidad", async () => {
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos/x/entrega" });
    expect(respuesta.statusCode).toBe(401);
  });
});

describe("POST /api/equipos/{id}/prestamo (HU-PRE-02)", () => {
  const prestar = (token: string, id: string, cuerpo: object) =>
    app.inject({ method: "POST", url: `/api/equipos/${id}/prestamo`, headers: con(token), payload: cuerpo });
  const estadoDe = async (id: string) =>
    (await app.inject({ url: "/api/equipos", headers: con("it") })).json<{ id: string; estado: string; persona?: string }[]>().find(
      (equipo) => equipo.id === id,
    );

  it("presta un equipo disponible a la persona indicada", async () => {
    const id = await darDeAlta("Proyector 01");
    const respuesta = await prestar("it", id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id,
      nombre: "Proyector 01",
      estado: "prestado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(await estadoDe(id)).toMatchObject({ estado: "prestado", persona: "ana.perez@empresa.com" });
    const historial = await almacen.listar<{ estado: string; persona: string }>("prestamos_historial");
    expect(historial).toMatchObject([{ estado: "prestado", persona: "ana.perez@empresa.com" }]);
  });

  it("admite una fecha de devolución pasada, porque IT apunta préstamos con retraso", async () => {
    const id = await darDeAlta("Proyector 01");
    const respuesta = await prestar("it", id, { persona: "luis.gomez@empresa.com", devolucion: "2026-11-10" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toMatchObject({ estado: "prestado", devolucion: "2026-11-10" });
  });

  it("responde 400 si falta la persona o la fecha y deja el equipo disponible", async () => {
    const id = await darDeAlta("Proyector 01");
    for (const cuerpo of [{ devolucion: "2026-11-20" }, { persona: "ana.perez@empresa.com" }, { persona: " ", devolucion: "2026-11-20" }, {}]) {
      const respuesta = await prestar("it", id, cuerpo);
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "Faltan la persona o la fecha de devolución" });
    }
    expect((await estadoDe(id))?.estado).toBe("disponible");
  });

  it("responde 400 si la fecha no existe o no es una fecha y deja el equipo disponible", async () => {
    const id = await darDeAlta("Proyector 01");
    for (const devolucion of ["2026-02-30", "mañana", 5]) {
      const respuesta = await prestar("it", id, { persona: "ana.perez@empresa.com", devolucion });
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
    }
    expect((await estadoDe(id))?.estado).toBe("disponible");
  });

  it("responde 409 si el equipo está reservado y lo deja a nombre de quien lo reservó", async () => {
    const id = await darDeAlta("Monitor 03");
    await solicitar("luis", id, { devolucion: "2999-11-20" });
    const respuesta = await prestar("it", id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await estadoDe(id)).toMatchObject({ estado: "reservado", persona: "luis.gomez@empresa.com" });
  });

  it("responde 409 si el equipo ya está prestado", async () => {
    const id = await darDeAlta("Monitor 03");
    await prestar("it", id, { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" });
    const respuesta = await prestar("it", id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-21" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
  });

  it("responde 404 si el id no es de ningún equipo", async () => {
    const respuesta = await prestar("it", "no-existe", { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 a quien no es de IT y no presta el equipo", async () => {
    const id = await darDeAlta("Proyector 01");
    const respuesta = await prestar("ana", id, { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect((await estadoDe(id))?.estado).toBe("disponible");
  });

  it("responde 401 sin token de identidad", async () => {
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos/x/prestamo", payload: {} });
    expect(respuesta.statusCode).toBe(401);
  });

  it("presta una sola vez si una solicitud y un préstamo llegan a la vez", async () => {
    const id = await darDeAlta("Monitor 03");
    const respuestas = await Promise.all([
      solicitar("ana", id, { devolucion: "2999-11-20" }),
      prestar("it", id, { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" }),
    ]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    const ganadora = respuestas.find((r) => r.statusCode === 201);
    const perdedora = respuestas.find((r) => r.statusCode === 409);
    expect(["reservado", "prestado"]).toContain(ganadora?.json<{ estado: string }>().estado);
    expect(perdedora?.json()).toEqual({ error: "El equipo no está disponible" });
    const actual = await estadoDe(id);
    expect(actual).toMatchObject({ estado: ganadora?.json<{ estado: string }>().estado, persona: ganadora?.json<{ persona: string }>().persona });
    expect(await almacen.listar("prestamos_historial")).toHaveLength(1);
  });
});

describe("POST /api/equipos/{id}/devolucion (HU-PRE-03)", () => {
  const devolver = (token: string, id: string) =>
    app.inject({ method: "POST", url: `/api/equipos/${id}/devolucion`, headers: con(token) });
  const prestar = (id: string) =>
    app.inject({
      method: "POST",
      url: `/api/equipos/${id}/prestamo`,
      headers: con("it"),
      payload: { persona: "ana.perez@empresa.com", devolucion: "2026-11-20" },
    });
  const estadoDe = async (id: string) =>
    (await app.inject({ url: "/api/equipos", headers: con("it") })).json<{ id: string; estado: string }[]>().find(
      (equipo) => equipo.id === id,
    );

  it("deja disponible un equipo prestado, sin persona ni devolución", async () => {
    const id = await darDeAlta("Portátil 07");
    await prestar(id);
    const respuesta = await devolver("it", id);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({ id, nombre: "Portátil 07", estado: "disponible" });
    expect(await estadoDe(id)).toEqual({ id, nombre: "Portátil 07", estado: "disponible" });
  });

  it("marca como devuelto el préstamo del historial y deja volver a reservar el equipo", async () => {
    const id = await darDeAlta("Portátil 07");
    await prestar(id);
    await devolver("it", id);
    expect((await almacen.listar<{ estado: string }>("prestamos_historial")).map((p) => p.estado)).toEqual(["devuelto"]);
    expect((await solicitar("luis", id, { devolucion: "2999-11-20" })).statusCode).toBe(201);
  });

  it("responde 409 si el equipo está reservado y sigue reservado", async () => {
    const id = await darDeAlta("Monitor 03");
    await solicitar("luis", id, { devolucion: "2999-11-20" });
    const respuesta = await devolver("it", id);
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está prestado" });
    expect((await estadoDe(id))?.estado).toBe("reservado");
  });

  it("responde 409 si el equipo está disponible o ya se devolvió", async () => {
    const id = await darDeAlta("Monitor 03");
    const libre = await devolver("it", id);
    expect(libre.statusCode).toBe(409);
    expect(libre.json()).toEqual({ error: "El equipo no está prestado" });
    await prestar(id);
    await devolver("it", id);
    expect((await devolver("it", id)).statusCode).toBe(409);
  });

  it("responde 404 si el id no es de ningún equipo", async () => {
    const respuesta = await devolver("it", "no-existe");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 a quien no es de IT y no cambia el equipo", async () => {
    const id = await darDeAlta("Portátil 07");
    await prestar(id);
    const respuesta = await devolver("ana", id);
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect((await estadoDe(id))?.estado).toBe("prestado");
  });

  it("responde 401 sin token de identidad", async () => {
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos/x/devolucion" });
    expect(respuesta.statusCode).toBe(401);
  });
});

describe("GET /api/prestamos/vencidos (HU-PRE-04)", () => {
  const prestar = (id: string, devolucion: string) =>
    app.inject({
      method: "POST",
      url: `/api/equipos/${id}/prestamo`,
      headers: con("it"),
      payload: { persona: "ana.perez@empresa.com", devolucion },
    });

  it("lista los prestados vencidos del más antiguo al más reciente, sin los que vencen hoy o después", async () => {
    const portatil = await darDeAlta("Portátil 07");
    const monitor = await darDeAlta("Monitor 03");
    const proyector = await darDeAlta("Proyector 01");
    await prestar(portatil, "2026-11-12");
    await prestar(monitor, "2026-11-10");
    await prestar(proyector, hoyEnMadrid());
    const respuesta = await app.inject({ url: "/api/prestamos/vencidos", headers: con("it") });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { id: monitor, nombre: "Monitor 03", persona: "ana.perez@empresa.com", devolucion: "2026-11-10" },
      { id: portatil, nombre: "Portátil 07", persona: "ana.perez@empresa.com", devolucion: "2026-11-12" },
    ]);
  });

  it("compara con el día dado: el que vence ese día no está vencido", async () => {
    const id = await darDeAlta("Proyector 01");
    await prestar(id, "2026-11-15");
    expect(await listarVencidos(almacen, "2026-11-15")).toEqual([]);
    expect(await listarVencidos(almacen, "2026-11-16")).toHaveLength(1);
  });

  it("no incluye un equipo reservado sin entregar aunque su devolución sea futura", async () => {
    const id = await darDeAlta("Portátil 08");
    await solicitarEquipo(almacen, id, "ana.perez@empresa.com", "2026-11-16", "2026-11-15");
    const respuesta = await app.inject({ url: "/api/prestamos/vencidos", headers: con("it") });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("no incluye un equipo devuelto", async () => {
    const id = await darDeAlta("Portátil 07");
    await prestar(id, "2026-11-10");
    await app.inject({ method: "POST", url: `/api/equipos/${id}/devolucion`, headers: con("it") });
    const respuesta = await app.inject({ url: "/api/prestamos/vencidos", headers: con("it") });
    expect(respuesta.json()).toEqual([]);
  });

  it("responde 403 a quien no es de IT", async () => {
    const respuesta = await app.inject({ url: "/api/prestamos/vencidos", headers: con("ana") });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });
});

describe("GET /api/equipos/{id}/historial (HU-INV-02)", () => {
  const historial = (token: string, id: string) =>
    app.inject({ url: `/api/equipos/${id}/historial`, headers: con(token) });

  it("lista los préstamos del equipo del más reciente al más antiguo", async () => {
    const id = await darDeAlta("Portátil 07");
    const otro = await darDeAlta("Monitor 03");
    await app.inject({
      method: "POST",
      url: `/api/equipos/${id}/prestamo`,
      headers: con("it"),
      payload: { persona: "luis.gomez@empresa.com", devolucion: "2026-11-10" },
    });
    await app.inject({
      method: "POST",
      url: `/api/equipos/${otro}/prestamo`,
      headers: con("it"),
      payload: { persona: "otra@empresa.com", devolucion: "2026-11-11" },
    });
    await app.inject({ method: "POST", url: `/api/equipos/${id}/devolucion`, headers: con("it") });
    await solicitar("ana", id, { devolucion: "2099-11-20" });
    const respuesta = await historial("it", id);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { persona: "ana.perez@empresa.com", devolucion: "2099-11-20", estado: "reservado" },
      { persona: "luis.gomez@empresa.com", devolucion: "2026-11-10", estado: "devuelto" },
    ]);
  });

  it("un equipo sin préstamos tiene el historial vacío", async () => {
    const id = await darDeAlta("Portátil 07");
    const respuesta = await historial("it", id);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("responde 404 si el equipo no existe", async () => {
    const respuesta = await historial("it", "no-existe");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 a quien no es de IT", async () => {
    const id = await darDeAlta("Portátil 07");
    const respuesta = await historial("ana", id);
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });

  it("responde 401 sin sesión", async () => {
    const respuesta = await app.inject("/api/equipos/x/historial");
    expect(respuesta.statusCode).toBe(401);
  });
});

describe("hoyEnMadrid", () => {
  it("da el día de Madrid, no el de UTC", () => {
    expect(hoyEnMadrid(new Date("2026-11-15T23:30:00Z"))).toBe("2026-11-16");
    expect(hoyEnMadrid(new Date("2026-11-15T10:00:00Z"))).toBe("2026-11-15");
  });
});
