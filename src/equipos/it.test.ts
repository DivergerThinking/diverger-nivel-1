import { afterEach, describe, expect, it, vi } from "vitest";
import { crearServidor } from "../../app/server.js";
import type { Persona } from "../../lib/auth.js";
import type { FastifyPluginAsync } from "fastify";
import type { OpcionesContexto } from "../../lib/datos.js";
import { esCuentaIT, exigirIT } from "./index.js";

const personas: Record<string, Persona> = {
  ana: { email: "ana.perez@empresa.com", nombre: "Ana Pérez" },
  it: { email: "IT@Empresa.com", nombre: "IT" },
  inventario: { email: "inventario@empresa.com", nombre: "Inventario" },
};

const soloIT: FastifyPluginAsync<OpcionesContexto> = (app) => {
  app.post("/api/equipos", { preHandler: exigirIT }, () => ({ ok: true }));
  return Promise.resolve();
};

async function servidor() {
  return crearServidor({
    googleClientId: "cliente",
    verificarToken: (token) => Promise.resolve(personas[token] ?? null),
    contextos: [soloIT],
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("esCuentaIT", () => {
  it("compara los correos sin distinguir mayúsculas", () => {
    expect(esCuentaIT("IT@Empresa.com", "it@empresa.com")).toBe(true);
  });

  it("acepta varios correos separados por comas, con espacios", () => {
    const lista = "it@empresa.com, inventario@empresa.com";
    expect(esCuentaIT("inventario@empresa.com", lista)).toBe(true);
    expect(esCuentaIT("ana.perez@empresa.com", lista)).toBe(false);
  });

  it("sin lista nadie es de IT, ni siquiera un correo vacío", () => {
    expect(esCuentaIT("ana.perez@empresa.com", "")).toBe(false);
    expect(esCuentaIT("", "")).toBe(false);
  });

  it("lee CORREOS_IT del entorno por defecto", () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com");
    expect(esCuentaIT("it@empresa.com")).toBe(true);
    expect(esCuentaIT("ana.perez@empresa.com")).toBe(false);
  });
});

describe("exigirIT", () => {
  it("responde 403 «Solo IT puede hacer esto.» a quien no está en CORREOS_IT", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com");
    const app = await servidor();
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos",
      headers: { authorization: "Bearer ana" },
      payload: { nombre: "Portátil 07" },
    });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });

  it("deja pasar a una persona de IT aunque entre con otras mayúsculas", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com");
    const app = await servidor();
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos",
      headers: { authorization: "Bearer it" },
      payload: { nombre: "Portátil 07" },
    });
    expect(respuesta.statusCode).toBe(200);
  });

  it("deja pasar a la cuenta de servicio del inventario incluida en CORREOS_IT", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com,inventario@empresa.com");
    const app = await servidor();
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos",
      headers: { authorization: "Bearer inventario" },
      payload: { nombre: "Portátil 07" },
    });
    expect(respuesta.statusCode).toBe(200);
  });

  it("sin CORREOS_IT responde 403 a todos", async () => {
    vi.stubEnv("CORREOS_IT", "");
    const app = await servidor();
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos",
      headers: { authorization: "Bearer it" },
      payload: { nombre: "Portátil 07" },
    });
    expect(respuesta.statusCode).toBe(403);
  });
});
