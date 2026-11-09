import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { tokenDeCabecera } from "../../lib/auth.js";
import { listarEquipos, obtenerEquipo, rutas } from "./index.js";

const PERSONAS: Record<string, { email: string; nombre: string }> = {
  lucia: { email: "lucia.gomez@empresa.com", nombre: "Lucía" },
  it: { email: "IT.Soporte@empresa.com", nombre: "IT" },
  inventario: { email: "inventario@empresa.iam.gserviceaccount.com", nombre: "Inventario" },
};
const verificarToken = (token: string) => Promise.resolve(PERSONAS[token] ?? null);

let app: FastifyInstance;
let almacen: Almacen;
const anterior = process.env.CORREOS_IT;

beforeEach(async () => {
  process.env.CORREOS_IT = "it.soporte@empresa.com,inventario@empresa.iam.gserviceaccount.com";
  almacen = almacenEnMemoria();
  app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", async (request, reply) => {
    const token = tokenDeCabecera(request.headers.authorization);
    const persona = token ? await verificarToken(token) : null;
    if (!persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    request.persona = persona;
  });
  await app.register(rutas, { almacen });
});
afterEach(async () => {
  await app.close();
  if (anterior === undefined) delete process.env.CORREOS_IT;
  else process.env.CORREOS_IT = anterior;
});

const alta = (token: string, nombre: string) =>
  app.inject({
    method: "POST",
    url: "/api/equipos",
    headers: { authorization: `Bearer ${token}` },
    payload: { nombre },
  });

describe("POST /api/equipos", () => {
  it("una cuenta de IT, aunque cambien las mayúsculas, da de alta el equipo y queda disponible", async () => {
    const r = await alta("it", "Monitor 03");
    expect(r.statusCode).toBe(201);
    const equipo = r.json<{ id: string; nombre: string; estado: string }>();
    expect(equipo.id).not.toBe("");
    expect({ nombre: equipo.nombre, estado: equipo.estado }).toEqual({ nombre: "Monitor 03", estado: "disponible" });
  });

  it("la cuenta de servicio del inventario también da de alta equipos", async () => {
    const r = await alta("inventario", "Monitor 03");
    expect(r.statusCode).toBe(201);
  });

  it("una empleada recibe 403 «Solo IT puede hacer esto.» y el equipo no se crea", async () => {
    const r = await alta("lucia", "Monitor 03");
    expect(r.statusCode).toBe(403);
    expect(r.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await listarEquipos(almacen)).toEqual([]);
  });

  it("sin sesión responde 401 «Inicia sesión con Google.»", async () => {
    const r = await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre: "Monitor 03" } });
    expect(r.statusCode).toBe(401);
    expect(r.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("consulta de equipos para otros contextos", () => {
  it("obtenerEquipo devuelve el equipo dado de alta y undefined si no existe", async () => {
    const creado = (await alta("it", "  Portátil 07 ")).json<{ id: string }>();
    expect(await obtenerEquipo(almacen, creado.id)).toEqual({ id: creado.id, nombre: "Portátil 07" });
    expect(await obtenerEquipo(almacen, "no-existe")).toBeUndefined();
  });

  it("listarEquipos devuelve todos los equipos ordenados por nombre", async () => {
    await alta("it", "Monitor 03");
    await alta("it", "Cámara 01");
    const nombres = (await listarEquipos(almacen)).map((e) => e.nombre);
    expect(nombres).toEqual(["Cámara 01", "Monitor 03"]);
  });
});
