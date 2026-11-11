import { afterEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import "../../lib/auth.js";
import { almacenEnMemoria } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { correosDeIT, esCuentaDeIT, esOperacionDeIT } from "./it.js";

const SOLO_IT = { error: "Solo IT puede hacer esto." };

async function servidor(email: string | null): Promise<FastifyInstance> {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request) => {
    request.persona = email ? { email, nombre: email } : null;
    return Promise.resolve();
  });
  // Fastify no ejecuta los hooks de un plugin en rutas que no existen (404). Las rutas de IT las añaden otras
  // tareas (la entrega, el préstamo y la devolución ya son reales), así que aquí se montan unas de prueba en el mismo contexto
  // para las que faltan, para comprobar que el hook las protege.
  await app.register(async (contexto) => {
    await rutas(contexto, { almacen: almacenEnMemoria() });
    contexto.get("/api/prestamos/vencidos", () => []);
    contexto.get("/api/equipos/:id/historial", () => []);
  });
  return app;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cuentas de IT", () => {
  it("compara los correos sin distinguir mayúsculas ni espacios", () => {
    expect(correosDeIT(" it@empresa.com , Inventario@empresa.com,")).toEqual(
      new Set(["it@empresa.com", "inventario@empresa.com"]),
    );
    expect(esCuentaDeIT("inventario@empresa.com", "it@empresa.com,Inventario@empresa.com")).toBe(true);
    expect(esCuentaDeIT("IT@Empresa.com", "it@empresa.com")).toBe(true);
    expect(esCuentaDeIT("ana.perez@empresa.com", "it@empresa.com")).toBe(false);
  });

  it("sin CORREOS_IT nadie es de IT", () => {
    expect(esCuentaDeIT("it@empresa.com", undefined)).toBe(false);
    expect(esCuentaDeIT("it@empresa.com", "")).toBe(false);
  });

  it("reconoce las cinco operaciones de IT de este contexto y ninguna otra", () => {
    expect(esOperacionDeIT("POST", "/api/equipos/pc-07/entrega")).toBe(true);
    expect(esOperacionDeIT("POST", "/api/equipos/pc-07/prestamo")).toBe(true);
    expect(esOperacionDeIT("POST", "/api/equipos/pc-07/devolucion")).toBe(true);
    expect(esOperacionDeIT("GET", "/api/prestamos/vencidos?x=1")).toBe(true);
    expect(esOperacionDeIT("GET", "/api/equipos/pc-07/historial")).toBe(true);
    expect(esOperacionDeIT("GET", "/api/equipos")).toBe(false);
    expect(esOperacionDeIT("POST", "/api/equipos/pc-07/solicitud")).toBe(false);
    expect(esOperacionDeIT("GET", "/api/equipos/pc-07/entrega")).toBe(false);
  });
});

describe("operaciones de IT en las rutas (HU-ACC-02)", () => {
  const operaciones = [
    { criterio: 3, method: "GET", url: "/api/prestamos/vencidos" },
    { criterio: 4, method: "POST", url: "/api/equipos/pc-07/entrega" },
    { criterio: 5, method: "POST", url: "/api/equipos/mon-03/prestamo" },
    { criterio: 6, method: "POST", url: "/api/equipos/pry-02/devolucion" },
    { criterio: 7, method: "GET", url: "/api/equipos/pc-07/historial" },
  ] as const;

  for (const { criterio, method, url } of operaciones) {
    it(`criterio ${criterio}: ${method} ${url} da 403 «Solo IT puede hacer esto.» a una cuenta que no es de IT`, async () => {
      vi.stubEnv("CORREOS_IT", "it@empresa.com");
      const app = await servidor("ana.perez@empresa.com");
      const respuesta = await app.inject({ method, url, payload: method === "POST" ? {} : undefined });
      expect(respuesta.statusCode).toBe(403);
      expect(respuesta.json()).toEqual(SOLO_IT);
      await app.close();
    });
  }

  it("una cuenta de IT pasa la comprobación", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com,Inventario@empresa.com");
    const app = await servidor("inventario@empresa.com");
    const respuesta = await app.inject({ method: "GET", url: "/api/prestamos/vencidos" });
    expect(respuesta.statusCode).toBe(200);
    await app.close();
  });

  it("sin sesión responde 401 en una operación de IT", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com");
    const app = await servidor(null);
    const respuesta = await app.inject({ method: "GET", url: "/api/prestamos/vencidos" });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
    await app.close();
  });

  it("las rutas de todos no piden ser de IT", async () => {
    vi.stubEnv("CORREOS_IT", "it@empresa.com");
    const app = await servidor("ana.perez@empresa.com");
    const respuesta = await app.inject({ url: "/api/equipos" });
    expect(respuesta.statusCode).toBe(200);
    await app.close();
  });
});
