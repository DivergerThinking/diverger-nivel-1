import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance, type FastifyPluginAsync } from "fastify";
import { tokenDeCabecera } from "../../lib/auth.js";
import { cuentaDe, esCuentaIT, exigirIT, rutas } from "./index.js";

const PERSONAS: Record<string, { email: string; nombre: string }> = {
  lucia: { email: "lucia.gomez@empresa.com", nombre: "Lucía" },
  it: { email: "IT.Soporte@Empresa.com", nombre: "IT" },
};
const verificarToken = (token: string) => Promise.resolve(PERSONAS[token] ?? null);

const soloIT: FastifyPluginAsync = (app) => {
  app.get("/api/prueba/solo-it", { preHandler: exigirIT }, () => ({ hecho: true }));
  return Promise.resolve();
};

let app: FastifyInstance;
const anterior = process.env.CORREOS_IT;
beforeEach(async () => {
  process.env.CORREOS_IT = " it.soporte@empresa.com , otro@empresa.com";
  // Sesión como la del servidor (app/server.ts): la persona del token o 401.
  app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", async (request, reply) => {
    const token = tokenDeCabecera(request.headers.authorization);
    const persona = token ? await verificarToken(token) : null;
    if (!persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    request.persona = persona;
  });
  await app.register(rutas);
  await app.register(soloIT);
});
afterEach(async () => {
  await app.close();
  if (anterior === undefined) delete process.env.CORREOS_IT;
  else process.env.CORREOS_IT = anterior;
});

const con = (token: string) => ({ authorization: `Bearer ${token}` });

describe("esCuentaIT", () => {
  it("compara sin distinguir mayúsculas ni espacios alrededor de cada correo", () => {
    expect(esCuentaIT("it.soporte@empresa.com", " IT.Soporte@empresa.com , b@x.com")).toBe(true);
    expect(esCuentaIT("IT.SOPORTE@EMPRESA.COM", "it.soporte@empresa.com")).toBe(true);
  });
  it("no es de IT si no está en la lista, o la lista falta o está vacía", () => {
    expect(esCuentaIT("lucia.gomez@empresa.com", "it.soporte@empresa.com")).toBe(false);
    expect(esCuentaIT("lucia.gomez@empresa.com", undefined)).toBe(false);
    expect(esCuentaIT("", "")).toBe(false);
    expect(esCuentaIT("", ",")).toBe(false);
  });
  it("cuentaDe devuelve el correo y esIT", () => {
    expect(cuentaDe("a@x.com", "a@x.com")).toEqual({ correo: "a@x.com", esIT: true });
  });
});

describe("GET /api/cuentas/yo", () => {
  it("devuelve el correo del token y esIT false para una empleada", async () => {
    const r = await app.inject({ url: "/api/cuentas/yo", headers: con("lucia") });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ correo: "lucia.gomez@empresa.com", esIT: false });
  });
  it("devuelve esIT true para una cuenta de IT de CORREOS_IT", async () => {
    const r = await app.inject({ url: "/api/cuentas/yo", headers: con("it") });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ correo: "IT.Soporte@Empresa.com", esIT: true });
  });
  it("sin token o con un token no válido responde 401 «Inicia sesión con Google.»", async () => {
    for (const headers of [{}, con("malo")]) {
      const r = await app.inject({ url: "/api/cuentas/yo", headers });
      expect(r.statusCode).toBe(401);
      expect(r.json()).toEqual({ error: "Inicia sesión con Google." });
    }
  });
});

describe("exigirIT", () => {
  it("deja pasar a una cuenta de IT", async () => {
    const r = await app.inject({ url: "/api/prueba/solo-it", headers: con("it") });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ hecho: true });
  });
  it("responde 403 «Solo IT puede hacer esto.» a un empleado", async () => {
    const r = await app.inject({ url: "/api/prueba/solo-it", headers: con("lucia") });
    expect(r.statusCode).toBe(403);
    expect(r.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });
});
