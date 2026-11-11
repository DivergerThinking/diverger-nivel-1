import { describe, expect, it } from "vitest";
import { crearServidor } from "../../app/server.js";
import { rutas, saludar } from "./index.js";

describe("saludar", () => {
  it("saluda en nombre del contexto gamma a la persona", () => {
    expect(saludar("ana.perez@empresa.com")).toEqual({ contexto: "gamma", persona: "ana.perez@empresa.com" });
  });
});

describe("GET /api/gamma/saludo (HU-PAR-03)", () => {
  const montar = () =>
    crearServidor({
      googleClientId: "cliente-app",
      verificarToken: (token) =>
        Promise.resolve(token === "ana" ? { email: "ana.perez@empresa.com", nombre: "Ana" } : null),
      contextos: [rutas],
    });

  it("responde 200 con el contexto y el correo de la persona con sesión", async () => {
    const app = await montar();
    const respuesta = await app.inject({ method: "GET", url: "/api/gamma/saludo", headers: { authorization: "Bearer ana" } });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({ contexto: "gamma", persona: "ana.perez@empresa.com" });
  });

  it("sin token responde 401 con «Inicia sesión con Google.»", async () => {
    const app = await montar();
    const respuesta = await app.inject({ method: "GET", url: "/api/gamma/saludo" });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("con un token no válido responde 401", async () => {
    const app = await montar();
    const respuesta = await app.inject({ method: "GET", url: "/api/gamma/saludo", headers: { authorization: "Bearer otro" } });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});
