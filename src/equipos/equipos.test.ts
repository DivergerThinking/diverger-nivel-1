import { afterEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { tokenDeCabecera } from "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { getEquipment, isItAccount, listEquipment, normalizedName, rutas } from "./index.js";

const TECNICO = { email: "it.soporte@empresa.com", nombre: "Soporte" };
const LUIS = { email: "luis.gomez@empresa.com", nombre: "Luis" };
const personas: Record<string, { email: string; nombre: string }> = { tecnico: TECNICO, luis: LUIS };
const verificarToken = (token: string) => Promise.resolve(personas[token] ?? null);

let app: FastifyInstance;
let almacen: Almacen;
const anteriores = process.env.CORREOS_IT;

async function iniciar(): Promise<void> {
  process.env.CORREOS_IT = "IT.Soporte@empresa.com, inventario@empresa.com";
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

function alta(token: string, payload?: unknown) {
  return app.inject({ method: "POST", url: "/api/equipos", headers: { authorization: `Bearer ${token}` }, payload: payload as object });
}

afterEach(async () => {
  await app.close();
  if (anteriores === undefined) delete process.env.CORREOS_IT;
  else process.env.CORREOS_IT = anteriores;
});

describe("POST /api/equipos", () => {
  it("da de alta un equipo disponible con id y nombre", async () => {
    await iniciar();
    const respuesta = await alta("tecnico", { nombre: "Portátil 07" });
    expect(respuesta.statusCode).toBe(201);
    const cuerpo = respuesta.json<{ id: string; nombre: string; estado: string }>();
    expect(cuerpo.id).toBeTruthy();
    expect(cuerpo).toMatchObject({ nombre: "Portátil 07", estado: "disponible" });
    expect(await getEquipment(almacen, cuerpo.id)).toEqual({ id: cuerpo.id, nombre: "Portátil 07" });
  });

  it("guarda el nombre sin los espacios de los extremos", async () => {
    await iniciar();
    const respuesta = await alta("tecnico", { nombre: "  Monitor 05 " });
    expect(respuesta.json<{ nombre: string }>().nombre).toBe("Monitor 05");
  });

  it("responde 409 al nombre repetido aunque cambien mayúsculas o espacios, y no crea otro equipo", async () => {
    await iniciar();
    await alta("tecnico", { nombre: "Portátil 07" });
    const respuesta = await alta("tecnico", { nombre: " portátil 07 " });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "Ya hay un equipo con ese nombre" });
    expect(await listEquipment(almacen)).toHaveLength(1);
  });

  it("con dos altas simultáneas del mismo nombre solo crea una", async () => {
    await iniciar();
    const respuestas = await Promise.all([alta("tecnico", { nombre: "Proyector 01" }), alta("tecnico", { nombre: "proyector 01" })]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(await listEquipment(almacen)).toHaveLength(1);
  });

  it.each([
    ["nombre vacío", { nombre: "" }],
    ["nombre solo con espacios", { nombre: "   " }],
    ["cuerpo vacío", {}],
    ["nombre que no es texto", { nombre: 7 }],
  ])("responde 400 con %s y no crea ningún equipo", async (_caso, cuerpo) => {
    await iniciar();
    const respuesta = await alta("tecnico", cuerpo);
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
    expect(await listEquipment(almacen)).toHaveLength(0);
  });

  it("responde 400 sin cuerpo", async () => {
    await iniciar();
    const respuesta = await alta("tecnico");
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
  });

  it("responde 403 a quien no está en CORREOS_IT y no crea ningún equipo", async () => {
    await iniciar();
    const respuesta = await alta("luis", { nombre: "Portátil 08" });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await listEquipment(almacen)).toHaveLength(0);
  });

  it("responde 403 con CORREOS_IT sin definir", async () => {
    await iniciar();
    delete process.env.CORREOS_IT;
    expect((await alta("tecnico", { nombre: "Portátil 09" })).statusCode).toBe(403);
  });

  it("responde 401 sin sesión", async () => {
    await iniciar();
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre: "Portátil 10" } });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("interfaz pública", () => {
  it("normaliza el nombre", () => {
    expect(normalizedName("  Portátil 07 ")).toBe("portátil 07");
  });

  it("isItAccount compara sin distinguir mayúsculas ni espacios de la lista", () => {
    expect(isItAccount("IT.SOPORTE@empresa.com", "it.soporte@empresa.com, inventario@empresa.com")).toBe(true);
    expect(isItAccount("inventario@empresa.com", "it.soporte@empresa.com, Inventario@empresa.com")).toBe(true);
    expect(isItAccount("luis.gomez@empresa.com", "it.soporte@empresa.com")).toBe(false);
    expect(isItAccount("", "it.soporte@empresa.com,")).toBe(false);
    expect(isItAccount("it.soporte@empresa.com", undefined)).toBe(false);
  });

  it("getEquipment y listEquipment leen los equipos dados de alta", async () => {
    await iniciar();
    const a = (await alta("tecnico", { nombre: "Monitor 05" })).json<{ id: string }>();
    const b = (await alta("tecnico", { nombre: "Cámara 01" })).json<{ id: string }>();
    expect(await getEquipment(almacen, "no-existe")).toBeUndefined();
    expect(await getEquipment(almacen, a.id)).toEqual({ id: a.id, nombre: "Monitor 05" });
    expect(await listEquipment(almacen)).toEqual([
      { id: b.id, nombre: "Cámara 01" },
      { id: a.id, nombre: "Monitor 05" },
    ]);
  });
});
