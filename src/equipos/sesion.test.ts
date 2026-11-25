import { describe, expect, it } from "vitest";
import { crearServidor } from "../../app/server.js";
import type { Persona } from "../../lib/auth.js";
import { rutas } from "./index.js";

const ANA: Persona = { email: "ana.perez@empresa.com", nombre: "Ana Pérez" };

async function servidor(verificarToken: (token: string) => Promise<Persona | null>) {
  return crearServidor({ googleClientId: "cliente", verificarToken, contextos: [rutas] });
}

describe("sesión en las rutas de equipos", () => {
  it("sin token responde 401 «Inicia sesión con Google.»", async () => {
    const app = await servidor(() => Promise.resolve(ANA));
    const respuesta = await app.inject({ method: "GET", url: "/api/equipos" });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("con un token cuyo correo no está verificado responde 401 «Inicia sesión con Google.»", async () => {
    const app = await servidor(() => Promise.resolve(null));
    const respuesta = await app.inject({ method: "GET", url: "/api/equipos", headers: { authorization: "Bearer sin-verificar" } });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("con un token válido las operaciones se hacen a nombre de la persona del token", async () => {
    const app = await servidor((token) => Promise.resolve(token === "token-de-ana" ? ANA : null));
    const respuesta = await app.inject({ method: "GET", url: "/api/yo", headers: { authorization: "Bearer token-de-ana" } });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual(ANA);
  });
});
