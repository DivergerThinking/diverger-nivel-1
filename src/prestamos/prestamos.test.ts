import { afterEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { tokenDeCabecera } from "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import type { PrestamoActivo } from "./prestamos.js";

const LUIS = { email: "luis.gomez@empresa.com", nombre: "Luis" };
const verificarToken = (token: string) => Promise.resolve(token === "luis" ? LUIS : null);

let app: FastifyInstance;
let almacen: Almacen;

async function iniciar(): Promise<void> {
  almacen = almacenEnMemoria();
  app = Fastify();
  app.decorateRequest("persona", null);
  // Hace lo que el servidor del golden path antes de llegar al contexto: pone la persona o responde 401.
  app.addHook("onRequest", async (request, reply) => {
    const persona = await verificarToken(tokenDeCabecera(request.headers.authorization) ?? "");
    if (!persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    request.persona = persona;
  });
  await app.register(rutas, { almacen });
}

/** Crea el equipo con los datos del contexto equipos y devuelve su id. */
async function equipo(nombre: string): Promise<string> {
  const id = `id-${nombre}`;
  await almacen.guardar("equipos_equipos", id, { id, nombre });
  return id;
}

async function activo(equipoId: string, estado: PrestamoActivo["estado"], persona: string, devolucion: string): Promise<void> {
  await almacen.guardar("prestamos_activos", equipoId, { equipoId, estado, persona, devolucion, prestamoId: `p-${equipoId}` });
}

const listar = (token?: string) =>
  app.inject({ method: "GET", url: "/api/equipos", headers: token ? { authorization: `Bearer ${token}` } : {} });

afterEach(async () => {
  await app.close();
});

describe("GET /api/equipos", () => {
  it("lista disponible sin persona ni devolución, y prestado con persona y devolución", async () => {
    await iniciar();
    const portatil = await equipo("Portátil 07");
    const proyector = await equipo("Proyector 02");
    await activo(proyector, "prestado", "ana.perez@empresa.com", "2026-11-20");
    const respuesta = await listar("luis");
    expect(respuesta.statusCode).toBe(200);
    const cuerpo = respuesta.json<Record<string, unknown>[]>();
    expect(cuerpo).toEqual([
      { id: portatil, nombre: "Portátil 07", estado: "disponible" },
      { id: proyector, nombre: "Proyector 02", estado: "prestado", persona: "ana.perez@empresa.com", devolucion: "2026-11-20" },
    ]);
    expect(cuerpo[0]).not.toHaveProperty("persona");
    expect(cuerpo[0]).not.toHaveProperty("devolucion");
  });

  it("lista reservado con persona y devolución", async () => {
    await iniciar();
    const monitor = await equipo("Monitor 03");
    await activo(monitor, "reservado", "ana.perez@empresa.com", "2026-11-25");
    const respuesta = await listar("luis");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { id: monitor, nombre: "Monitor 03", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-11-25" },
    ]);
  });

  it("responde una lista vacía si no hay equipos", async () => {
    await iniciar();
    const respuesta = await listar("luis");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("responde 401 sin token de identidad y sin lista de equipos", async () => {
    await iniciar();
    await equipo("Portátil 07");
    const respuesta = await listar();
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});
