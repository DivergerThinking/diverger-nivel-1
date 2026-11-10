import { describe, expect, it } from "vitest";
import { almacenEnMemoria } from "../../lib/datos.js";
import { crearServidor } from "../../app/server.js";
import { listarEquipos, obtenerEquipo, rutas } from "./index.js";

describe("lectura de equipos", () => {
  it("devuelve un equipo por su id", async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 07" });
    expect(await obtenerEquipo(almacen, "e1")).toEqual({ id: "e1", nombre: "Portátil 07" });
  });

  it("devuelve undefined si el equipo no existe", async () => {
    expect(await obtenerEquipo(almacenEnMemoria(), "nada")).toBeUndefined();
  });

  it("lista los equipos ordenados por nombre", async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "e2", { id: "e2", nombre: "Monitor 03" });
    await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 07" });
    expect(await listarEquipos(almacen)).toEqual([
      { id: "e2", nombre: "Monitor 03" },
      { id: "e1", nombre: "Portátil 07" },
    ]);
  });

  it("lista vacía si no hay equipos", async () => {
    expect(await listarEquipos(almacenEnMemoria())).toEqual([]);
  });
});

describe("sesión con Google en las rutas de equipos (HU-ACC-01)", () => {
  const ana = { email: "ana.perez@empresa.com", nombre: "Ana" };
  const servidor = () =>
    crearServidor({
      googleClientId: "cliente-app",
      verificarToken: (token) => Promise.resolve(token === "valido" ? ana : null),
      contextos: [rutas],
    });

  it("sin token responde 401", async () => {
    const app = await servidor();
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre: "Portátil 07" } });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("con un token no válido (otro cliente, correo sin verificar o caducado) responde 401", async () => {
    const app = await servidor();
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos",
      headers: { authorization: "Bearer invalido" },
      payload: { nombre: "Portátil 07" },
    });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("con un token válido la petición pasa la sesión", async () => {
    const app = await servidor();
    const respuesta = await app.inject({ method: "GET", url: "/api/yo", headers: { authorization: "Bearer valido" } });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual(ana);
  });
});
