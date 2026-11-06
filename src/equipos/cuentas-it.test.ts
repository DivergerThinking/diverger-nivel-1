import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { correosDeIt, esCuentaIt, exigirIt } from "./cuentas-it.js";

const LISTA = "it@empresa.com,inventario@empresa.com";

describe("cuentas de IT", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("compara los correos sin distinguir mayúsculas", () => {
    expect(esCuentaIt("IT@empresa.com", LISTA)).toBe(true);
  });

  it("ignora los espacios de alrededor y las entradas vacías", () => {
    expect([...correosDeIt(" It@Empresa.com , ,inventario@empresa.com ")]).toEqual([
      "it@empresa.com",
      "inventario@empresa.com",
    ]);
  });

  it("la cuenta de servicio incluida en la lista es de IT", () => {
    expect(esCuentaIt("inventario@empresa.com", LISTA)).toBe(true);
  });

  it("un empleado que no está en la lista no es de IT", () => {
    expect(esCuentaIt("luis.garcia@empresa.com", LISTA)).toBe(false);
  });

  it("sin CORREOS_IT ninguna cuenta es de IT", () => {
    expect(esCuentaIt("it@empresa.com", "")).toBe(false);
    vi.stubEnv("CORREOS_IT", "");
    expect(esCuentaIt("it@empresa.com")).toBe(false);
  });

  it("lee CORREOS_IT del entorno en cada petición", () => {
    vi.stubEnv("CORREOS_IT", LISTA);
    expect(esCuentaIt("it@empresa.com")).toBe(true);
    vi.stubEnv("CORREOS_IT", "otra@empresa.com");
    expect(esCuentaIt("it@empresa.com")).toBe(false);
  });
});

describe("exigirIt", () => {
  async function servidor(email: string | null) {
    const app = Fastify();
    app.decorateRequest("persona", null);
    app.addHook("onRequest", (request, _reply, hecho) => {
      request.persona = email ? { email, nombre: email } : null;
      hecho();
    });
    app.post("/solo-it", { preHandler: exigirIt }, () => ({ ok: true }));
    await app.ready();
    return app;
  }

  it("deja pasar a una cuenta de IT aunque el correo venga en otras mayúsculas", async () => {
    vi.stubEnv("CORREOS_IT", LISTA);
    const app = await servidor("IT@empresa.com");
    const respuesta = await app.inject({ method: "POST", url: "/solo-it" });
    expect(respuesta.statusCode).toBe(200);
  });

  it("responde 403 «Solo IT puede hacer esto.» a un empleado y no ejecuta la operación", async () => {
    vi.stubEnv("CORREOS_IT", LISTA);
    const app = await servidor("luis.garcia@empresa.com");
    const respuesta = await app.inject({ method: "POST", url: "/solo-it" });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });

  it("responde 403 si no hay sesión", async () => {
    vi.stubEnv("CORREOS_IT", LISTA);
    const app = await servidor(null);
    const respuesta = await app.inject({ method: "POST", url: "/solo-it" });
    expect(respuesta.statusCode).toBe(403);
  });
});
