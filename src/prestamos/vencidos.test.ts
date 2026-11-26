import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas as rutasEquipos } from "../equipos/index.js";
import { rutas } from "./index.js";
import { listarVencidos } from "./prestamos.js";

let app: FastifyInstance;
let almacen: Almacen;
let anterior: string | undefined;

const IT = "it@empresa.com";
const ANA = "ana.perez@empresa.com";
const LUIS = "luis.gomez@empresa.com";

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

async function altaEquipo(nombre: string): Promise<string> {
  const respuesta = await app.inject({ method: "POST", url: "/api/equipos", headers: { "x-correo": IT }, payload: { nombre } });
  return respuesta.json<{ id: string }>().id;
}

const prestar = (id: string, persona: string, devolucion: string) =>
  app.inject({ method: "POST", url: `/api/equipos/${id}/prestamo`, headers: { "x-correo": IT }, payload: { persona, devolucion } });

const vencidos = (correo?: string) =>
  app.inject({ method: "GET", url: "/api/prestamos/vencidos", headers: correo ? { "x-correo": correo } : {} });

beforeEach(async () => {
  anterior = process.env["CORREOS_IT"];
  process.env["CORREOS_IT"] = IT;
  almacen = almacenEnMemoria();
  app = await servidor();
});

afterEach(async () => {
  if (anterior === undefined) delete process.env["CORREOS_IT"];
  else process.env["CORREOS_IT"] = anterior;
  await app.close();
});

describe("listarVencidos", () => {
  it("lista del más antiguo al más reciente con id, nombre, persona y devolución", async () => {
    const monitor = await altaEquipo("Monitor 03");
    const portatil = await altaEquipo("Portátil 07");
    await prestar(monitor, LUIS, "2026-12-01");
    await prestar(portatil, ANA, "2026-11-28");
    expect(await listarVencidos(almacen, "2026-12-03")).toEqual([
      { id: portatil, nombre: "Portátil 07", persona: ANA, devolucion: "2026-11-28" },
      { id: monitor, nombre: "Monitor 03", persona: LUIS, devolucion: "2026-12-01" },
    ]);
  });

  it("no incluye un préstamo cuya devolución es hoy", async () => {
    const proyector = await altaEquipo("Proyector 01");
    await prestar(proyector, ANA, "2026-12-03");
    expect(await listarVencidos(almacen, "2026-12-03")).toEqual([]);
  });

  it("no incluye los reservados, los disponibles ni los devueltos", async () => {
    const reservado = await altaEquipo("Reservado");
    await altaEquipo("Disponible");
    const devuelto = await altaEquipo("Devuelto");
    await almacen.guardar("prestamosActivos", reservado, { equipoId: reservado, persona: ANA, devolucion: "2020-01-01", estado: "reservado" });
    await prestar(devuelto, LUIS, "2020-01-01");
    await app.inject({ method: "POST", url: `/api/equipos/${devuelto}/devolucion`, headers: { "x-correo": IT } });
    expect(await listarVencidos(almacen, "2026-12-03")).toEqual([]);
  });
});

describe("GET /api/prestamos/vencidos", () => {
  it("responde 200 con los préstamos vencidos respecto a hoy", async () => {
    const viejo = await altaEquipo("Monitor 03");
    const futuro = await altaEquipo("Proyector 01");
    await prestar(viejo, LUIS, "2000-01-01");
    await prestar(futuro, ANA, "2999-12-31");
    const respuesta = await vencidos(IT);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([{ id: viejo, nombre: "Monitor 03", persona: LUIS, devolucion: "2000-01-01" }]);
  });

  it("sin préstamos vencidos responde 200 con una lista vacía", async () => {
    const respuesta = await vencidos(IT);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("quien no es de IT recibe 403 y sin sesión 401", async () => {
    const sinPermiso = await vencidos(ANA);
    expect(sinPermiso.statusCode).toBe(403);
    expect(sinPermiso.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect((await vencidos()).statusCode).toBe(401);
  });
});
