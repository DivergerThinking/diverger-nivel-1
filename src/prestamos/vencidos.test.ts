import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { tokenDeCabecera } from "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { hoyEnMadrid, listarVencidos, type PrestamoActivo } from "./prestamos.js";

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

async function apuntar(nombre: string, estado: PrestamoActivo["estado"], devolucion: string): Promise<string> {
  const id = `id-${nombre}`;
  await almacen.guardar("equipos_equipos", id, { id, nombre });
  await almacen.guardar("prestamos_activos", id, {
    equipoId: id,
    estado,
    persona: "ana.perez@empresa.com",
    devolucion,
    prestamoId: `p-${id}`,
  } satisfies PrestamoActivo);
  return id;
}

/** Fecha AAAA-MM-DD a `dias` días de hoy en Madrid. */
function desdeHoy(dias: number): string {
  const fecha = new Date(`${hoyEnMadrid()}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

const vencidos = (token: string) =>
  app.inject({ method: "GET", url: "/api/prestamos/vencidos", headers: { authorization: `Bearer ${token}` } });

describe("listarVencidos", () => {
  it("con hoy 2026-11-20 lista los prestados con devolución anterior, del más antiguo al más reciente, y deja fuera el que vence hoy", async () => {
    const proyector = await apuntar("Proyector 02", "prestado", "2026-11-18");
    const monitor04 = await apuntar("Monitor 04", "prestado", "2026-11-05");
    await apuntar("Monitor 03", "prestado", "2026-11-20");
    expect(await listarVencidos(almacen, "2026-11-20")).toEqual([
      { id: monitor04, nombre: "Monitor 04", persona: "ana.perez@empresa.com", devolucion: "2026-11-05" },
      { id: proyector, nombre: "Proyector 02", persona: "ana.perez@empresa.com", devolucion: "2026-11-18" },
    ]);
  });

  it("no incluye los equipos reservados aunque su fecha sea anterior", async () => {
    await apuntar("Portátil 07", "reservado", "2026-11-01");
    expect(await listarVencidos(almacen, "2026-11-20")).toEqual([]);
  });

  it("a igual fecha ordena por nombre", async () => {
    await apuntar("Monitor 05", "prestado", "2026-11-05");
    await apuntar("Monitor 04", "prestado", "2026-11-05");
    const lista = await listarVencidos(almacen, "2026-11-20");
    expect(lista.map((vencido) => vencido.nombre)).toEqual(["Monitor 04", "Monitor 05"]);
  });
});

describe("GET /api/prestamos/vencidos", () => {
  it("responde 200 a IT con los vencidos del más antiguo al más reciente y sin los que vencen hoy", async () => {
    const proyector = await apuntar("Proyector 02", "prestado", desdeHoy(-2));
    const monitor04 = await apuntar("Monitor 04", "prestado", desdeHoy(-15));
    await apuntar("Monitor 03", "prestado", desdeHoy(0));
    const respuesta = await vencidos("it");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { id: monitor04, nombre: "Monitor 04", persona: "ana.perez@empresa.com", devolucion: desdeHoy(-15) },
      { id: proyector, nombre: "Proyector 02", persona: "ana.perez@empresa.com", devolucion: desdeHoy(-2) },
    ]);
  });

  it("responde 200 con una lista vacía si no hay vencidos", async () => {
    await apuntar("Monitor 03", "prestado", desdeHoy(3));
    const respuesta = await vencidos("it");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("responde 403 a quien no es de IT, sin lista", async () => {
    await apuntar("Monitor 04", "prestado", desdeHoy(-15));
    const respuesta = await vencidos("luis");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });

  it("responde 401 sin token de identidad", async () => {
    const respuesta = await app.inject({ method: "GET", url: "/api/prestamos/vencidos" });
    expect(respuesta.statusCode).toBe(401);
  });
});
