import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { crearServidor } from "../../app/server.js";
import { rutas, saludar } from "./index.js";

const ANA = { email: "ana.perez@empresa.com", nombre: "Ana Pérez" };
const verificarToken = (token: string) => Promise.resolve(token === "token-bueno" ? ANA : null);

describe("saludar", () => {
  it("saluda desde el contexto beta a la persona", () => {
    expect(saludar("ana.perez@empresa.com")).toEqual({ contexto: "beta", persona: "ana.perez@empresa.com" });
  });
});

describe("GET /api/beta/saludo", () => {
  let app: FastifyInstance;
  afterEach(async () => {
    await app.close();
  });

  it("responde 200 con el contexto y el correo de la persona con sesión", async () => {
    app = await crearServidor({ googleClientId: "cliente", verificarToken, contextos: [rutas] });
    const respuesta = await app.inject({ url: "/api/beta/saludo", headers: { authorization: "Bearer token-bueno" } });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({ contexto: "beta", persona: "ana.perez@empresa.com" });
  });

  it("responde 401 sin token", async () => {
    app = await crearServidor({ googleClientId: "cliente", verificarToken, contextos: [rutas] });
    const respuesta = await app.inject("/api/beta/saludo");
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});
