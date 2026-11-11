import { afterEach, describe, expect, it } from "vitest";
import { crearServidor } from "../../app/server.js";
import { almacenEnMemoria } from "../../lib/datos.js";
import { crearEquipo } from "./equipos.js";
import { listarEquipos, rutas } from "./index.js";

describe("crearEquipo", () => {
  it("da de alta un equipo con id y el nombre recortado", async () => {
    const almacen = almacenEnMemoria();
    const resultado = await crearEquipo(almacen, " Portátil 07 ");
    if (!("equipo" in resultado)) throw new Error("debía crear el equipo");
    expect(resultado.equipo.id).not.toBe("");
    expect(resultado.equipo.nombre).toBe("Portátil 07");
    expect(await listarEquipos(almacen)).toEqual([resultado.equipo]);
  });

  it("rechaza un nombre repetido sin distinguir mayúsculas ni espacios en los extremos", async () => {
    const almacen = almacenEnMemoria();
    await crearEquipo(almacen, "Portátil 07");
    expect(await crearEquipo(almacen, " portátil 07 ")).toEqual({ error: "Ya hay un equipo con ese nombre" });
    expect(await listarEquipos(almacen)).toHaveLength(1);
  });

  it("rechaza un nombre vacío, de espacios, ausente o que no es texto", async () => {
    const almacen = almacenEnMemoria();
    for (const nombre of ["", "   ", undefined, 7]) {
      expect(await crearEquipo(almacen, nombre)).toEqual({ error: "Falta el nombre del equipo" });
    }
    expect(await listarEquipos(almacen)).toEqual([]);
  });

  it("con altas simultáneas del mismo nombre solo crea un equipo", async () => {
    const almacen = almacenEnMemoria();
    const resultados = await Promise.all([crearEquipo(almacen, "Monitor 03"), crearEquipo(almacen, "MONITOR 03")]);
    expect(resultados.filter((r) => "equipo" in r)).toHaveLength(1);
    expect(await listarEquipos(almacen)).toHaveLength(1);
  });
});

describe("POST /api/equipos", () => {
  afterEach(() => {
    delete process.env["CORREOS_IT"];
  });

  async function servidor() {
    process.env["CORREOS_IT"] = "it@empresa.com";
    const almacen = almacenEnMemoria();
    const app = await crearServidor({
      googleClientId: "cliente",
      verificarToken: () => Promise.resolve({ email: "it@empresa.com", nombre: "IT" }),
      almacen,
      contextos: [rutas],
    });
    const enviar = (payload?: unknown) =>
      app.inject({ method: "POST", url: "/api/equipos", headers: { authorization: "Bearer t" }, payload: payload as object });
    return { almacen, enviar };
  }

  it("responde 201 con id, nombre y estado «disponible»", async () => {
    const { enviar, almacen } = await servidor();
    const respuesta = await enviar({ nombre: "Portátil 07" });
    expect(respuesta.statusCode).toBe(201);
    const cuerpo = respuesta.json<{ id: string; nombre: string; estado: string }>();
    expect(cuerpo).toEqual({ id: expect.any(String) as string, nombre: "Portátil 07", estado: "disponible" });
    expect(await listarEquipos(almacen)).toHaveLength(1);
  });

  it("responde 409 a un nombre repetido y no crea otro equipo", async () => {
    const { enviar, almacen } = await servidor();
    await enviar({ nombre: "Portátil 07" });
    const respuesta = await enviar({ nombre: " portátil 07 " });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "Ya hay un equipo con ese nombre" });
    expect(await listarEquipos(almacen)).toHaveLength(1);
  });

  it("responde 400 si el nombre está vacío o falta y no crea ningún equipo", async () => {
    const { enviar, almacen } = await servidor();
    for (const cuerpo of [{ nombre: "" }, {}]) {
      const respuesta = await enviar(cuerpo);
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
    }
    expect(await listarEquipos(almacen)).toEqual([]);
  });
});
