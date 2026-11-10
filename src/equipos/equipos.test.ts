import type { LightMyRequestResponse } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { almacenEnMemoria } from "../../lib/datos.js";
import { crearServidor } from "../../app/server.js";
import { esCuentaDeIT } from "./equipos.js";
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

describe("alta de equipos (HU-INV-01)", () => {
  const cuentas: Record<string, { email: string; nombre: string }> = {
    it: { email: "it.soporte@empresa.com", nombre: "IT" },
    ana: { email: "ana.perez@empresa.com", nombre: "Ana" },
  };
  const montar = async () => {
    const almacen = almacenEnMemoria();
    const app = await crearServidor({
      googleClientId: "cliente-app",
      verificarToken: (token) => Promise.resolve(cuentas[token] ?? null),
      contextos: [rutas],
      almacen,
    });
    const alta = async (token: string, payload: unknown): Promise<LightMyRequestResponse> =>
      await app.inject({ method: "POST", url: "/api/equipos", headers: { authorization: `Bearer ${token}` }, payload: payload as object });
    return { almacen, alta };
  };

  beforeEach(() => {
    vi.stubEnv("CORREOS_IT", "it.soporte@empresa.com,inventario@empresa.com");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("IT da de alta un equipo y queda disponible", async () => {
    const { almacen, alta } = await montar();
    const respuesta = await alta("it", { nombre: "Portátil 07" });
    expect(respuesta.statusCode).toBe(201);
    const cuerpo = respuesta.json<{ id: string; nombre: string; estado: string }>();
    expect(cuerpo.id).not.toBe("");
    expect({ nombre: cuerpo.nombre, estado: cuerpo.estado }).toEqual({ nombre: "Portátil 07", estado: "disponible" });
    expect(await obtenerEquipo(almacen, cuerpo.id)).toEqual({ id: cuerpo.id, nombre: "Portátil 07" });
  });

  it("guarda el nombre sin espacios en los extremos", async () => {
    const { alta } = await montar();
    const respuesta = await alta("it", { nombre: "  Monitor 03 " });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json<{ nombre: string }>().nombre).toBe("Monitor 03");
  });

  it.each([{ nombre: "" }, { nombre: "   " }, {}, { nombre: 7 }])("un nombre vacío o ausente (%j) responde 400", async (payload) => {
    const { almacen, alta } = await montar();
    const respuesta = await alta("it", payload);
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
    expect(await listarEquipos(almacen)).toEqual([]);
  });

  it("un nombre repetido (sin mayúsculas ni espacios) responde 409 y no crea otro equipo", async () => {
    const { almacen, alta } = await montar();
    await alta("it", { nombre: "Portátil 07" });
    const respuesta = await alta("it", { nombre: " portátil 07 " });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "Ya hay un equipo con ese nombre" });
    expect(await listarEquipos(almacen)).toHaveLength(1);
  });

  it("dos altas simultáneas con el mismo nombre: una sale bien y la otra recibe 409", async () => {
    const { almacen, alta } = await montar();
    const respuestas = await Promise.all([alta("it", { nombre: "Proyector 02" }), alta("it", { nombre: "proyector 02" })]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(await listarEquipos(almacen)).toHaveLength(1);
  });

  it("una cuenta que no es de IT recibe 403 y no se crea ningún equipo", async () => {
    const { almacen, alta } = await montar();
    const respuesta = await alta("ana", { nombre: "Monitor 03" });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await listarEquipos(almacen)).toEqual([]);
  });

  it("sin CORREOS_IT nadie es de IT", async () => {
    vi.stubEnv("CORREOS_IT", "");
    const { alta } = await montar();
    expect((await alta("it", { nombre: "Monitor 03" })).statusCode).toBe(403);
  });
});

describe("cuentas de IT", () => {
  it("compara los correos sin distinguir mayúsculas ni espacios", () => {
    expect(esCuentaDeIT("IT.Soporte@empresa.com", "it.soporte@empresa.com, inventario@empresa.com")).toBe(true);
    expect(esCuentaDeIT("inventario@empresa.com", "it.soporte@empresa.com, Inventario@empresa.com")).toBe(true);
    expect(esCuentaDeIT("it.soporte@otra-empresa.com", "it.soporte@empresa.com")).toBe(false);
    expect(esCuentaDeIT("", ",")).toBe(false);
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
