import { describe, expect, it } from "vitest";
import { crearServidor } from "../../app/server.js";
import { almacenEnMemoria } from "../../lib/datos.js";
import { esCuentaDeIT, MENSAJE_SOLO_IT, rutas } from "./index.js";

describe("esCuentaDeIT", () => {
  it("acepta un correo de la lista sin distinguir mayúsculas", () => {
    expect(esCuentaDeIT("inventario@empresa.com", "it@empresa.com,Inventario@empresa.com")).toBe(true);
    expect(esCuentaDeIT("IT@Empresa.com", "it@empresa.com")).toBe(true);
  });

  it("ignora los espacios alrededor de los correos", () => {
    expect(esCuentaDeIT("it@empresa.com", " ana@empresa.com , it@empresa.com ")).toBe(true);
  });

  it("rechaza un correo que no está en la lista", () => {
    expect(esCuentaDeIT("ana.perez@empresa.com", "it@empresa.com")).toBe(false);
  });

  it("rechaza a todos si la lista falta o está vacía", () => {
    expect(esCuentaDeIT("it@empresa.com", undefined)).toBe(false);
    expect(esCuentaDeIT("", "")).toBe(false);
    expect(esCuentaDeIT("", " , ")).toBe(false);
  });

  it("lee CORREOS_IT del entorno por defecto", () => {
    const anterior = process.env["CORREOS_IT"];
    process.env["CORREOS_IT"] = "it@empresa.com";
    try {
      expect(esCuentaDeIT("it@empresa.com")).toBe(true);
      expect(esCuentaDeIT("ana.perez@empresa.com")).toBe(false);
    } finally {
      if (anterior === undefined) delete process.env["CORREOS_IT"];
      else process.env["CORREOS_IT"] = anterior;
    }
  });
});

describe("POST /api/equipos solo para IT", () => {
  async function servidor(correo: string, correosIT: string) {
    process.env["CORREOS_IT"] = correosIT;
    return crearServidor({
      googleClientId: "cliente",
      verificarToken: () => Promise.resolve({ email: correo, nombre: correo }),
      almacen: almacenEnMemoria(),
      contextos: [rutas],
    });
  }
  const peticion = { method: "POST", url: "/api/equipos", headers: { authorization: "Bearer t" }, payload: { nombre: "Portátil 08" } } as const;

  it("responde 403 a una cuenta que no es de IT", async () => {
    const app = await servidor("ana.perez@empresa.com", "it@empresa.com");
    const respuesta = await app.inject(peticion);
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: MENSAJE_SOLO_IT });
    delete process.env["CORREOS_IT"];
  });

  it("no rechaza a una cuenta de IT, aunque el correo cambie de mayúsculas", async () => {
    const app = await servidor("inventario@empresa.com", "it@empresa.com,Inventario@empresa.com");
    const respuesta = await app.inject(peticion);
    expect(respuesta.statusCode).toBe(501);
    delete process.env["CORREOS_IT"];
  });

  it("responde 401 sin sesión antes de comprobar si es de IT", async () => {
    const app = await servidor("it@empresa.com", "it@empresa.com");
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre: "x" } });
    expect(respuesta.statusCode).toBe(401);
    delete process.env["CORREOS_IT"];
  });
});
