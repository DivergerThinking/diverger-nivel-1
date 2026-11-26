import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas as rutasEquipos } from "../equipos/index.js";
import { rutas } from "./index.js";
import { esFechaValida, hoyEnMadrid, solicitarEquipo } from "./prestamos.js";

let app: FastifyInstance;
let almacen: Almacen;
let anterior: string | undefined;

/** Servidor con la sesión simulada: sin cabecera x-correo, 401 como el del servidor real. */
async function servidor(): Promise<FastifyInstance> {
  const instancia = Fastify();
  instancia.decorateRequest("persona", null);
  instancia.addHook("onRequest", async (request, reply) => {
    const correo = request.headers["x-correo"];
    if (typeof correo !== "string") return reply.code(401).send({ error: "Inicia sesión con Google." });
    request.persona = { email: correo, nombre: correo };
  });
  await instancia.register(rutasEquipos, { almacen });
  await instancia.register(rutas, { almacen });
  return instancia;
}

const ANA = "ana.perez@empresa.com";
const FUTURA = "2999-12-10";

async function altaEquipo(nombre: string): Promise<string> {
  const respuesta = await app.inject({ method: "POST", url: "/api/equipos", headers: { "x-correo": "it@empresa.com" }, payload: { nombre } });
  return respuesta.json<{ id: string }>().id;
}

const solicitar = (id: string, cuerpo: unknown, correo = ANA) =>
  app.inject({ method: "POST", url: `/api/equipos/${id}/solicitud`, headers: { "x-correo": correo }, payload: cuerpo as object });

beforeEach(async () => {
  anterior = process.env["CORREOS_IT"];
  process.env["CORREOS_IT"] = "it@empresa.com";
  almacen = almacenEnMemoria();
  app = await servidor();
});

afterEach(async () => {
  if (anterior === undefined) delete process.env["CORREOS_IT"];
  else process.env["CORREOS_IT"] = anterior;
  await app.close();
});

describe("GET /api/equipos", () => {
  it("con sesión responde 200 con la lista de equipos y su estado", async () => {
    const id = await altaEquipo("Portátil 07");
    const respuesta = await app.inject({ url: "/api/equipos", headers: { "x-correo": ANA } });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([{ id, nombre: "Portátil 07", estado: "disponible" }]);
  });

  it("sin equipos responde 200 con una lista vacía", async () => {
    const respuesta = await app.inject({ url: "/api/equipos", headers: { "x-correo": ANA } });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("sin sesión responde 401 «Inicia sesión con Google.»", async () => {
    const respuesta = await app.inject({ url: "/api/equipos" });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("un equipo disponible va sin persona ni devolución y uno prestado las enseña", async () => {
    const portatil = await altaEquipo("Portátil 07");
    const proyector = await altaEquipo("Proyector 01");
    await almacen.guardar("prestamosActivos", proyector, {
      equipoId: proyector,
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-12-10",
      estado: "prestado",
    });
    const respuesta = await app.inject({ url: "/api/equipos", headers: { "x-correo": ANA } });
    expect(respuesta.statusCode).toBe(200);
    const lista = respuesta.json<Record<string, unknown>[]>();
    expect(lista).toHaveLength(2);
    expect(lista).toContainEqual({ id: portatil, nombre: "Portátil 07", estado: "disponible" });
    expect(lista).toContainEqual({
      id: proyector,
      nombre: "Proyector 01",
      estado: "prestado",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-12-10",
    });
  });

  it("un equipo reservado enseña la persona y la devolución", async () => {
    const id = await altaEquipo("Portátil 07");
    await solicitar(id, { devolucion: FUTURA });
    const lista = (await app.inject({ url: "/api/equipos", headers: { "x-correo": ANA } })).json<unknown[]>();
    expect(lista).toEqual([{ id, nombre: "Portátil 07", estado: "reservado", persona: ANA, devolucion: FUTURA }]);
  });
});

describe("POST /api/equipos/{id}/solicitud", () => {
  it("reserva el equipo con la persona del token", async () => {
    const id = await altaEquipo("Portátil 07");
    const respuesta = await solicitar(id, { devolucion: FUTURA });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({ id, nombre: "Portátil 07", estado: "reservado", persona: ANA, devolucion: FUTURA });
  });

  it("sin sesión responde 401 y no reserva nada", async () => {
    const id = await altaEquipo("Portátil 07");
    const respuesta = await app.inject({ method: "POST", url: `/api/equipos/${id}/solicitud`, payload: { devolucion: FUTURA } });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("los errores de la fecha responden 400 con su mensaje", async () => {
    const id = await altaEquipo("Portátil 07");
    for (const [cuerpo, mensaje] of [
      [{}, "Falta la fecha de devolución"],
      [{ devolucion: "" }, "Falta la fecha de devolución"],
      [{ devolucion: "2026-02-30" }, "La fecha de devolución no es válida"],
      [{ devolucion: "mañana" }, "La fecha de devolución no es válida"],
      [{ devolucion: 7 }, "La fecha de devolución no es válida"],
      [{ devolucion: "2000-01-01" }, "La fecha de devolución ya ha pasado"],
    ] as const) {
      const respuesta = await solicitar(id, cuerpo);
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: mensaje });
    }
  });

  it("un equipo que no existe responde 404 «No existe el equipo»", async () => {
    const respuesta = await solicitar("no-existe", { devolucion: FUTURA });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("un equipo ya reservado responde 409 «El equipo no está disponible»", async () => {
    const id = await altaEquipo("Portátil 07");
    await solicitar(id, { devolucion: FUTURA });
    const respuesta = await solicitar(id, { devolucion: FUTURA }, "luis.gomez@empresa.com");
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
  });

  it("dos solicitudes simultáneas: una recibe 201 y la otra 409", async () => {
    const id = await altaEquipo("Portátil 07");
    const respuestas = await Promise.all([solicitar(id, { devolucion: FUTURA }), solicitar(id, { devolucion: FUTURA }, "luis.gomez@empresa.com")]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
  });

  it("deja un movimiento en el historial", async () => {
    const id = await altaEquipo("Portátil 07");
    await solicitar(id, { devolucion: FUTURA });
    const historial = await almacen.listar<{ equipoId: string; persona: string; estado: string }>("historialPrestamos");
    expect(historial).toMatchObject([{ equipoId: id, persona: ANA, estado: "reservado" }]);
  });
});

describe("fechas", () => {
  it("esFechaValida solo admite días que existen", () => {
    expect(esFechaValida("2028-02-29")).toBe(true);
    expect(esFechaValida("2026-02-29")).toBe(false);
    expect(esFechaValida("2026-13-01")).toBe(false);
    expect(esFechaValida("2026-1-1")).toBe(false);
  });

  it("hoy es el día en Madrid", () => {
    expect(hoyEnMadrid(new Date("2026-12-09T23:30:00Z"))).toBe("2026-12-10");
    expect(hoyEnMadrid(new Date("2026-07-09T21:30:00Z"))).toBe("2026-07-09");
  });

  it("la fecha de hoy se admite y la de ayer no", async () => {
    const id = await altaEquipo("Portátil 07");
    expect(await solicitarEquipo(almacen, id, ANA, "2026-12-09", "2026-12-10")).toBe("pasada");
    expect(await solicitarEquipo(almacen, id, ANA, "2026-12-10", "2026-12-10")).toMatchObject({ estado: "reservado" });
  });
});
