// HU-ACC-01: entrar con la cuenta de Google de la empresa. Se prueba el verificador del golden path
// con un cliente de Google simulado que, como el real, rechaza los tokens emitidos para otro cliente.
import { afterEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { tokenDeCabecera, verificadorGoogle } from "../../lib/auth.js";
import { almacenEnMemoria } from "../../lib/datos.js";
import { rutas } from "./index.js";

const CLIENTE = "cliente-de-la-aplicacion";

interface TokenSimulado {
  email?: string;
  email_verified?: boolean;
  name?: string;
  aud: string;
}

const tokens: Record<string, TokenSimulado> = {
  luis: { email: "luis.gomez@empresa.com", email_verified: true, name: "Luis Gómez", aud: CLIENTE },
  inventario: { email: "inventario@empresa.com", email_verified: true, aud: CLIENTE },
  "otro-cliente": { email: "luis.gomez@empresa.com", email_verified: true, aud: "otro-cliente-oauth" },
  "sin-verificar": { email: "luis.gomez@empresa.com", email_verified: false, aud: CLIENTE },
  "sin-correo": { email_verified: true, aud: CLIENTE },
};

vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    verifyIdToken({ idToken, audience }: { idToken: string; audience: string }) {
      const datos = tokens[idToken];
      if (!datos || datos.aud !== audience) return Promise.reject(new Error("Token no válido"));
      return Promise.resolve({ getPayload: () => datos });
    }
  },
}));

const abiertos: FastifyInstance[] = [];
const anteriores = process.env.CORREOS_IT;

async function iniciar(): Promise<FastifyInstance> {
  process.env.CORREOS_IT = "inventario@empresa.com";
  const verificar = verificadorGoogle(CLIENTE);
  const app = Fastify();
  abiertos.push(app);
  app.decorateRequest("persona", null);
  // Lo mismo que hace app/server.ts antes de llegar a las rutas de un contexto.
  app.addHook("onRequest", async (request, reply) => {
    const token = tokenDeCabecera(request.headers.authorization);
    const persona = token ? await verificar(token) : null;
    if (!persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    request.persona = persona;
  });
  await app.register(rutas, { almacen: almacenEnMemoria() });
  return app;
}

afterEach(async () => {
  await Promise.all(abiertos.splice(0).map((app) => app.close()));
  if (anteriores === undefined) delete process.env.CORREOS_IT;
  else process.env.CORREOS_IT = anteriores;
});

describe("verificadorGoogle", () => {
  it("devuelve la persona de un token con el correo verificado y emitido para el cliente de la aplicación", async () => {
    const verificar = verificadorGoogle(CLIENTE);
    expect(await verificar("luis")).toEqual({ email: "luis.gomez@empresa.com", nombre: "Luis Gómez" });
  });

  it("acepta la cuenta de servicio del inventario y usa su correo como nombre", async () => {
    const verificar = verificadorGoogle(CLIENTE);
    expect(await verificar("inventario")).toEqual({ email: "inventario@empresa.com", nombre: "inventario@empresa.com" });
  });

  it("rechaza un token emitido para otro cliente OAuth", async () => {
    expect(await verificadorGoogle(CLIENTE)("otro-cliente")).toBeNull();
  });

  it("rechaza un token con el correo sin verificar", async () => {
    expect(await verificadorGoogle(CLIENTE)("sin-verificar")).toBeNull();
  });

  it("rechaza un token sin correo y un token desconocido", async () => {
    expect(await verificadorGoogle(CLIENTE)("sin-correo")).toBeNull();
    expect(await verificadorGoogle(CLIENTE)("inventado")).toBeNull();
  });
});

describe("rutas de equipos con inicio de sesión de Google", () => {
  it("deja pasar a un empleado con un token válido: la ruta ve su correo (a la lista de IT no pertenece)", async () => {
    const app = await iniciar();
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos",
      headers: { authorization: "Bearer luis" },
      payload: { nombre: "Portátil 08" },
    });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });

  it("deja pasar a la cuenta de servicio del inventario de IT", async () => {
    const app = await iniciar();
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos",
      headers: { authorization: "Bearer inventario" },
      payload: { nombre: "Monitor 05" },
    });
    expect(respuesta.statusCode).toBe(201);
  });

  it.each([
    ["un token emitido para otro cliente OAuth", "otro-cliente"],
    ["un token con el correo sin verificar", "sin-verificar"],
    ["un token desconocido", "inventado"],
    ["ningún token", undefined],
  ])("responde 401 con %s", async (_caso, token) => {
    const app = await iniciar();
    const respuesta = await app.inject({
      method: "GET",
      url: "/api/equipos",
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});
