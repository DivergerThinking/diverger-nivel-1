import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Persona } from "../../lib/auth.js";
import { cuentasDeIT, esCuentaDeIT, soloIT } from "./index.js";

const CORREOS = "it@empresa.com,soporte@empresa.com";

describe("cuentas de IT", () => {
  it("lee los correos separados por comas, sin espacios ni mayúsculas", () => {
    expect(cuentasDeIT(" IT@empresa.com , soporte@empresa.com,,")).toEqual(["it@empresa.com", "soporte@empresa.com"]);
  });

  it("reconoce una cuenta de IT aunque cambien las mayúsculas", () => {
    expect(esCuentaDeIT("IT@empresa.com", CORREOS)).toBe(true);
    expect(esCuentaDeIT("soporte@empresa.com", CORREOS)).toBe(true);
  });

  it("no reconoce otra cuenta", () => {
    expect(esCuentaDeIT("ana.perez@empresa.com", CORREOS)).toBe(false);
  });

  it("sin lista o con la lista vacía, nadie es de IT", () => {
    expect(esCuentaDeIT("it@empresa.com", "")).toBe(false);
    expect(esCuentaDeIT("", ",")).toBe(false);
  });
});

describe("operación «Solo IT»", () => {
  const anterior = process.env["CORREOS_IT"];
  beforeEach(() => {
    process.env["CORREOS_IT"] = CORREOS;
  });
  afterEach(() => {
    if (anterior === undefined) delete process.env["CORREOS_IT"];
    else process.env["CORREOS_IT"] = anterior;
  });

  async function llamar(persona: Persona | null) {
    const app = Fastify();
    app.decorateRequest("persona", null);
    app.addHook("onRequest", (request, _reply, hecho) => {
      request.persona = persona;
      hecho();
    });
    let hecha = false;
    app.post("/solo-it", { preHandler: soloIT }, () => {
      hecha = true;
      return { ok: true };
    });
    const respuesta = await app.inject({ method: "POST", url: "/solo-it" });
    await app.close();
    return { respuesta, hecha };
  }

  it("deja pasar la petición de IT@empresa.com", async () => {
    const { respuesta, hecha } = await llamar({ email: "IT@empresa.com", nombre: "IT" });
    expect(respuesta.statusCode).toBe(200);
    expect(hecha).toBe(true);
  });

  it("responde 403 «Solo IT puede hacer esto.» a ana.perez@empresa.com y no hace la operación", async () => {
    const { respuesta, hecha } = await llamar({ email: "ana.perez@empresa.com", nombre: "Ana" });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(hecha).toBe(false);
  });

  it("responde 403 si la petición no trae persona", async () => {
    const { respuesta, hecha } = await llamar(null);
    expect(respuesta.statusCode).toBe(403);
    expect(hecha).toBe(false);
  });
});
