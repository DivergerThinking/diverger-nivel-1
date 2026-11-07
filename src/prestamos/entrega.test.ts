import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { tokenDeCabecera } from "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import type { Prestamo, PrestamoActivo } from "./prestamos.js";

const PERSONAS: Record<string, { email: string; nombre: string }> = {
  it: { email: "it.soporte@empresa.com", nombre: "IT" },
  luis: { email: "luis.gomez@empresa.com", nombre: "Luis" },
};
const verificarToken = (token: string) => Promise.resolve(PERSONAS[token] ?? null);

const anteriores = process.env.CORREOS_IT;
let app: FastifyInstance;
let almacen: Almacen;

beforeEach(async () => {
  process.env.CORREOS_IT = "it.soporte@empresa.com";
  almacen = almacenEnMemoria();
  app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", async (request, reply) => {
    const persona = await verificarToken(tokenDeCabecera(request.headers.authorization) ?? "");
    if (!persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    request.persona = persona;
  });
  await app.register(rutas, { almacen });
});

afterEach(async () => {
  await app.close();
  if (anteriores === undefined) delete process.env.CORREOS_IT;
  else process.env.CORREOS_IT = anteriores;
});

async function equipo(nombre: string): Promise<string> {
  const id = `id-${nombre}`;
  await almacen.guardar("equipos_equipos", id, { id, nombre });
  return id;
}

async function reservar(equipoId: string, estado: PrestamoActivo["estado"] = "reservado"): Promise<void> {
  const prestamoId = `p-${equipoId}`;
  await almacen.guardar("prestamos_activos", equipoId, {
    equipoId,
    estado,
    persona: "luis.gomez@empresa.com",
    devolucion: "2026-11-20",
    prestamoId,
  } satisfies PrestamoActivo);
  await almacen.guardar("prestamos_historial", prestamoId, {
    id: prestamoId,
    equipoId,
    persona: "luis.gomez@empresa.com",
    devolucion: "2026-11-20",
    estado,
    creadoEn: "2026-11-10T08:00:00.000Z",
  } satisfies Prestamo);
}

const entregar = (id: string, token = "it") =>
  app.inject({ method: "POST", url: `/api/equipos/${id}/entrega`, headers: { authorization: `Bearer ${token}` } });

describe("POST /api/equipos/{id}/entrega", () => {
  it("entrega el equipo reservado: queda prestado con la misma persona y devolución", async () => {
    const portatil = await equipo("Portátil 07");
    await reservar(portatil);
    const respuesta = await entregar(portatil);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({
      id: portatil,
      nombre: "Portátil 07",
      estado: "prestado",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(await almacen.obtener<PrestamoActivo>("prestamos_activos", portatil)).toMatchObject({ estado: "prestado" });
    expect(await almacen.obtener<Prestamo>("prestamos_historial", `p-${portatil}`)).toMatchObject({ estado: "prestado" });
    const lista = await app.inject({ method: "GET", url: "/api/equipos", headers: { authorization: "Bearer luis" } });
    expect(lista.json()).toEqual([respuesta.json()]);
  });

  it("responde 409 si el equipo está disponible y sigue disponible", async () => {
    const monitor = await equipo("Monitor 03");
    const respuesta = await entregar(monitor);
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está reservado" });
    expect(await almacen.obtener("prestamos_activos", monitor)).toBeUndefined();
  });

  it("responde 409 si el equipo ya está prestado y no cambia", async () => {
    const monitor = await equipo("Monitor 03");
    await reservar(monitor, "prestado");
    const respuesta = await entregar(monitor);
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está reservado" });
  });

  it("responde 404 si el equipo no existe", async () => {
    const respuesta = await entregar("no-existe");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 a quien no es de IT y la reserva no cambia", async () => {
    const portatil = await equipo("Portátil 07");
    await reservar(portatil);
    const respuesta = await entregar(portatil, "luis");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.obtener<PrestamoActivo>("prestamos_activos", portatil)).toMatchObject({ estado: "reservado" });
  });

  it("responde 401 sin token de identidad", async () => {
    const portatil = await equipo("Portátil 07");
    await reservar(portatil);
    const respuesta = await app.inject({ method: "POST", url: `/api/equipos/${portatil}/entrega` });
    expect(respuesta.statusCode).toBe(401);
  });
});
