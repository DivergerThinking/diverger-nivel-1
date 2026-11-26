import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas as rutasEquipos } from "../equipos/index.js";
import { rutas } from "./index.js";
import { obtenerHistorial } from "./prestamos.js";

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

const devolver = (id: string) => app.inject({ method: "POST", url: `/api/equipos/${id}/devolucion`, headers: { "x-correo": IT } });

const historial = (id: string, correo?: string) =>
  app.inject({ method: "GET", url: `/api/equipos/${id}/historial`, headers: correo ? { "x-correo": correo } : {} });

const pausa = () => new Promise((resolver) => setTimeout(resolver, 5));

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

describe("GET /api/equipos/{id}/historial", () => {
  it("responde 200 con primero el préstamo más reciente y después el más antiguo", async () => {
    const portatil = await altaEquipo("Portátil 07");
    await prestar(portatil, ANA, "2026-12-01");
    await devolver(portatil);
    await pausa();
    await prestar(portatil, LUIS, "2026-12-15");
    const respuesta = await historial(portatil, IT);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { persona: LUIS, devolucion: "2026-12-15", estado: "prestado" },
      { persona: ANA, devolucion: "2026-12-01", estado: "devuelto" },
    ]);
  });

  it("no mezcla los préstamos de otros equipos", async () => {
    const portatil = await altaEquipo("Portátil 07");
    const monitor = await altaEquipo("Monitor 03");
    await prestar(monitor, LUIS, "2026-12-15");
    expect(await obtenerHistorial(almacen, portatil)).toEqual([]);
  });

  it("incluye las reservas hechas por la persona", async () => {
    const portatil = await altaEquipo("Portátil 07");
    await app.inject({
      method: "POST",
      url: `/api/equipos/${portatil}/solicitud`,
      headers: { "x-correo": ANA },
      payload: { devolucion: "2999-01-01" },
    });
    expect(await obtenerHistorial(almacen, portatil)).toEqual([{ persona: ANA, devolucion: "2999-01-01", estado: "reservado" }]);
  });

  it("un id que no corresponde a ningún equipo responde 404 «No existe el equipo»", async () => {
    const respuesta = await historial("no-existe", IT);
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("quien no es de IT recibe 403 y sin sesión 401", async () => {
    const portatil = await altaEquipo("Portátil 07");
    const sinPermiso = await historial(portatil, ANA);
    expect(sinPermiso.statusCode).toBe(403);
    expect(sinPermiso.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect((await historial(portatil)).statusCode).toBe(401);
  });
});
