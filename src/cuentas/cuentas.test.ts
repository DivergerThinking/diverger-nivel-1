import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import type { Persona } from "../../lib/auth.js";
import { esCuentaDeIt, exigirIt, normalizarCorreo, rutas } from "./index.js";

let app: FastifyInstance | undefined;

async function servidor(persona: Persona | null): Promise<FastifyInstance> {
  const nuevo = Fastify();
  nuevo.decorateRequest("persona", null);
  nuevo.addHook("onRequest", (request, _reply, hecho) => {
    request.persona = persona;
    hecho();
  });
  await nuevo.register(rutas);
  nuevo.post("/solo-it", (request, reply) => {
    if (!exigirIt(request, reply)) return reply;
    return { hecho: true };
  });
  app = nuevo;
  return nuevo;
}

afterEach(async () => {
  await app?.close();
  app = undefined;
  delete process.env.CORREOS_IT;
});

describe("esCuentaDeIt", () => {
  it("reconoce los correos de la lista separados por comas", () => {
    expect(esCuentaDeIt("it@empresa.com", "it@empresa.com, otra@empresa.com")).toBe(true);
    expect(esCuentaDeIt("otra@empresa.com", "it@empresa.com, otra@empresa.com")).toBe(true);
  });

  it("no distingue mayúsculas de minúsculas", () => {
    expect(esCuentaDeIt("IT@Empresa.com", "it@empresa.com")).toBe(true);
    expect(esCuentaDeIt("it@empresa.com", "IT@EMPRESA.COM")).toBe(true);
  });

  it("rechaza a quien no está en la lista, con la lista vacía o sin configurar", () => {
    expect(esCuentaDeIt("ana.perez@empresa.com", "it@empresa.com")).toBe(false);
    expect(esCuentaDeIt("ana.perez@empresa.com", "")).toBe(false);
    expect(esCuentaDeIt("", ",")).toBe(false);
  });

  it("lee CORREOS_IT del entorno por defecto", () => {
    process.env.CORREOS_IT = "it@empresa.com";
    expect(esCuentaDeIt("it@empresa.com")).toBe(true);
    expect(esCuentaDeIt("ana.perez@empresa.com")).toBe(false);
  });
});

describe("normalizarCorreo", () => {
  it("pasa a minúsculas y quita espacios", () => {
    expect(normalizarCorreo("  Ana.Perez@Empresa.com ")).toBe("ana.perez@empresa.com");
  });
});

describe("GET /api/cuentas/yo", () => {
  it("devuelve la persona de la sesión como empleada", async () => {
    process.env.CORREOS_IT = "it@empresa.com";
    const respuesta = await (await servidor({ email: "ana.perez@empresa.com", nombre: "Ana" })).inject({
      method: "GET",
      url: "/api/cuentas/yo",
    });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({ email: "ana.perez@empresa.com", esIt: false });
  });

  it("marca como IT a una cuenta de la lista, también con otras mayúsculas", async () => {
    process.env.CORREOS_IT = "it@empresa.com";
    const respuesta = await (await servidor({ email: "IT@empresa.com", nombre: "IT" })).inject({
      method: "GET",
      url: "/api/cuentas/yo",
    });
    expect(respuesta.json()).toEqual({ email: "IT@empresa.com", esIt: true });
  });

  it("atiende igual a una cuenta de servicio", async () => {
    const respuesta = await (
      await servidor({ email: "inventario@empresa.com", nombre: "inventario@empresa.com" })
    ).inject({ method: "GET", url: "/api/cuentas/yo" });
    expect(respuesta.statusCode).toBe(200);
  });

  it("responde 401 sin sesión", async () => {
    const respuesta = await (await servidor(null)).inject({ method: "GET", url: "/api/cuentas/yo" });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("exigirIt", () => {
  it("deja pasar a una cuenta de IT", async () => {
    process.env.CORREOS_IT = "it@empresa.com";
    const respuesta = await (await servidor({ email: "it@empresa.com", nombre: "IT" })).inject({
      method: "POST",
      url: "/solo-it",
    });
    expect(respuesta.statusCode).toBe(200);
  });

  it("responde 403 a quien no es de IT", async () => {
    process.env.CORREOS_IT = "it@empresa.com";
    const respuesta = await (await servidor({ email: "ana.perez@empresa.com", nombre: "Ana" })).inject({
      method: "POST",
      url: "/solo-it",
    });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });
});
