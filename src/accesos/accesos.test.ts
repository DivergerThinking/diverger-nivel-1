import Fastify from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import "../../lib/auth.js";
import { esCuentaIT, exigirIT, listaIT, rutas, sesionDe } from "./index.js";

const original = process.env["CORREOS_IT"];
afterEach(() => {
  if (original === undefined) delete process.env["CORREOS_IT"];
  else process.env["CORREOS_IT"] = original;
});

// La verificación del token y el 401 son del servidor (app/server.ts, con su test); aquí la sesión
// se toma de la cabecera «x-correo», como la dejaría el servidor en request.persona.
async function servidor() {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _reply, hecho) => {
    const correo = request.headers["x-correo"];
    if (typeof correo === "string") request.persona = { email: correo, nombre: correo };
    hecho();
  });
  await app.register(rutas);
  app.post("/api/solo-it", { preHandler: exigirIT }, () => ({ ok: true }));
  return app;
}

describe("lista de IT", () => {
  it("separa por comas, quita espacios y vacíos y pasa a minúsculas", () => {
    expect(listaIT(" It@Empresa.com, ,inventario@empresa.com,")).toEqual(["it@empresa.com", "inventario@empresa.com"]);
  });

  it("sin variable, la lista está vacía", () => {
    expect(listaIT(undefined)).toEqual([]);
  });

  it("compara el correo sin distinguir mayúsculas", () => {
    const lista = listaIT("it@empresa.com");
    expect(esCuentaIT("IT@empresa.com", lista)).toBe(true);
    expect(esCuentaIT("ana.perez@empresa.com", lista)).toBe(false);
  });

  it("la sesión lleva la persona y si es de IT", () => {
    expect(sesionDe("ana.perez@empresa.com", ["it@empresa.com"])).toEqual({ persona: "ana.perez@empresa.com", esIT: false });
  });
});

describe("GET /api/accesos/sesion", () => {
  it("identifica a la persona por su correo y dice si es de IT", async () => {
    process.env["CORREOS_IT"] = "it@empresa.com";
    const app = await servidor();
    const ana = await app.inject({ url: "/api/accesos/sesion", headers: { "x-correo": "ana.perez@empresa.com" } });
    expect(ana.statusCode).toBe(200);
    expect(ana.json()).toEqual({ persona: "ana.perez@empresa.com", esIT: false });
    const it = await app.inject({ url: "/api/accesos/sesion", headers: { "x-correo": "IT@empresa.com" } });
    expect(it.json()).toEqual({ persona: "IT@empresa.com", esIT: true });
  });

  it("sin sesión responde 401 «Inicia sesión con Google.»", async () => {
    const app = await servidor();
    const respuesta = await app.inject({ url: "/api/accesos/sesion" });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("exigirIT", () => {
  it("deja pasar a una cuenta de IT aunque el correo cambie de mayúsculas", async () => {
    process.env["CORREOS_IT"] = "it@empresa.com,inventario@empresa.com";
    const app = await servidor();
    const respuesta = await app.inject({ method: "POST", url: "/api/solo-it", headers: { "x-correo": "Inventario@empresa.com" } });
    expect(respuesta.statusCode).toBe(200);
  });

  it("responde 403 a una cuenta que no es de IT", async () => {
    process.env["CORREOS_IT"] = "it@empresa.com";
    const app = await servidor();
    const respuesta = await app.inject({ method: "POST", url: "/api/solo-it", headers: { "x-correo": "ana.perez@empresa.com" } });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });
});
