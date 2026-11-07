// HU-ACC-01: entrar con la cuenta de Google de la empresa. Se prueba GET /api/equipos con el verificador
// del golden path y un cliente de Google simulado que, como el real, rechaza los tokens de otro cliente.
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

async function iniciar(): Promise<FastifyInstance> {
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
  const almacen = almacenEnMemoria();
  await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 01" });
  await app.register(rutas, { almacen });
  return app;
}

afterEach(async () => {
  await Promise.all(abiertos.splice(0).map((app) => app.close()));
});

describe("GET /api/equipos con inicio de sesión de Google", () => {
  it.each([
    ["un empleado con el correo verificado y el cliente de la aplicación", "luis"],
    ["la cuenta de servicio del inventario de IT", "inventario"],
  ])("responde 200 con la lista de equipos a %s", async (_caso, token) => {
    const app = await iniciar();
    const respuesta = await app.inject({ method: "GET", url: "/api/equipos", headers: { authorization: `Bearer ${token}` } });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([{ id: "e1", nombre: "Portátil 01", estado: "disponible" }]);
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
