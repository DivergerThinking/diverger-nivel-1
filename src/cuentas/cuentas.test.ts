import { describe, expect, it } from "vitest";
import Fastify from "fastify";
import { correosDeIT, esCuentaIT, obtenerCuenta, rutas } from "./index.js";

const LISTA = "it@empresa.com, Inventario@Empresa.com ,,";

describe("esCuentaIT", () => {
  it("reconoce un correo de la lista sin distinguir mayúsculas ni espacios", () => {
    expect(esCuentaIT("it@empresa.com", LISTA)).toBe(true);
    expect(esCuentaIT(" INVENTARIO@empresa.com ", LISTA)).toBe(true);
  });

  it("no reconoce a un empleado ni con la lista vacía o sin definir", () => {
    expect(esCuentaIT("ana.perez@empresa.com", LISTA)).toBe(false);
    expect(esCuentaIT("it@empresa.com", "")).toBe(false);
    expect(esCuentaIT("", LISTA)).toBe(false);
  });

  it("lee la lista de CORREOS_IT del entorno por defecto", () => {
    const antes = process.env["CORREOS_IT"];
    process.env["CORREOS_IT"] = "it@empresa.com";
    try {
      expect(esCuentaIT("IT@empresa.com")).toBe(true);
      expect(esCuentaIT("ana.perez@empresa.com")).toBe(false);
    } finally {
      if (antes === undefined) delete process.env["CORREOS_IT"];
      else process.env["CORREOS_IT"] = antes;
    }
  });
});

describe("correosDeIT", () => {
  it("ignora los vacíos", () => {
    expect([...correosDeIT(LISTA)]).toEqual(["it@empresa.com", "inventario@empresa.com"]);
  });
});

describe("obtenerCuenta", () => {
  it("indica si la persona es de IT", () => {
    expect(obtenerCuenta({ email: "it@empresa.com", nombre: "IT" }, LISTA)).toEqual({ email: "it@empresa.com", esIT: true });
    expect(obtenerCuenta({ email: "ana.perez@empresa.com", nombre: "Ana" }, LISTA)).toEqual({
      email: "ana.perez@empresa.com",
      esIT: false,
    });
  });
});

describe("GET /api/cuentas/yo", () => {
  async function servidor(persona: { email: string; nombre: string } | null) {
    const app = Fastify();
    app.decorateRequest("persona", null);
    app.addHook("onRequest", (request, _reply, hecho) => {
      request.persona = persona;
      hecho();
    });
    await app.register(rutas);
    return app;
  }

  it("responde con la cuenta de la sesión", async () => {
    const antes = process.env["CORREOS_IT"];
    process.env["CORREOS_IT"] = "it@empresa.com";
    const app = await servidor({ email: "ana.perez@empresa.com", nombre: "Ana" });
    try {
      const respuesta = await app.inject("/api/cuentas/yo");
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.json()).toEqual({ email: "ana.perez@empresa.com", esIT: false });
    } finally {
      await app.close();
      if (antes === undefined) delete process.env["CORREOS_IT"];
      else process.env["CORREOS_IT"] = antes;
    }
  });

  it("sin sesión responde 401 con «Inicia sesión con Google.»", async () => {
    const app = await servidor(null);
    try {
      const respuesta = await app.inject("/api/cuentas/yo");
      expect(respuesta.statusCode).toBe(401);
      expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
    } finally {
      await app.close();
    }
  });
});
