import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import "../../lib/auth.js";
import type { Persona } from "../../lib/auth.js";
import { rutas, saludarDesdeAlfa } from "./index.js";

async function crearApp(persona: Persona | null) {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _respuesta, hecho) => {
    request.persona = persona;
    hecho();
  });
  await app.register(rutas);
  return app;
}

describe("saludo de alfa", () => {
  it("saluda con el contexto y la persona", () => {
    expect(saludarDesdeAlfa("ana.perez@empresa.com")).toEqual({
      contexto: "alfa",
      persona: "ana.perez@empresa.com",
    });
  });

  it("GET /api/alfa/saludo responde 200 a la persona con sesión", async () => {
    const app = await crearApp({ email: "ana.perez@empresa.com", nombre: "Ana Pérez" });
    const respuesta = await app.inject("/api/alfa/saludo");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({ contexto: "alfa", persona: "ana.perez@empresa.com" });
    await app.close();
  });

  it("GET /api/alfa/saludo responde 401 sin sesión", async () => {
    const app = await crearApp(null);
    const respuesta = await app.inject("/api/alfa/saludo");
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
    await app.close();
  });
});
