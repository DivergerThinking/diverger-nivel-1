import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { crearServidor } from "../../app/server.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { listarEquipos, obtenerEquipo, rutas } from "./index.js";

const PERSONAS: Record<string, { email: string; nombre: string }> = {
  it: { email: "IT@empresa.com", nombre: "IT" },
  inventario: { email: "inventario@empresa.com", nombre: "Inventario" },
  ana: { email: "ana.perez@empresa.com", nombre: "Ana" },
};
const verificarToken = (token: string) => Promise.resolve(PERSONAS[token] ?? null);

const original = process.env.CORREOS_IT;
let app: FastifyInstance;
let almacen: Almacen;

beforeEach(async () => {
  process.env.CORREOS_IT = "it@empresa.com,inventario@empresa.com";
  almacen = almacenEnMemoria();
  app = await crearServidor({ googleClientId: "cliente", verificarToken, almacen, contextos: [rutas] });
});

afterEach(async () => {
  await app.close();
  if (original === undefined) delete process.env.CORREOS_IT;
  else process.env.CORREOS_IT = original;
});

const alta = (token: string, cuerpo: unknown) =>
  app.inject({ method: "POST", url: "/api/equipos", headers: { authorization: `Bearer ${token}` }, payload: cuerpo as object });

describe("POST /api/equipos", () => {
  it("da de alta un equipo disponible a una cuenta de IT, sin distinguir mayúsculas del correo", async () => {
    const respuesta = await alta("it", { nombre: "Portátil 07" });
    expect(respuesta.statusCode).toBe(201);
    const equipo = respuesta.json<{ id: string; nombre: string; estado: string }>();
    expect(equipo.id).not.toBe("");
    expect({ nombre: equipo.nombre, estado: equipo.estado }).toEqual({ nombre: "Portátil 07", estado: "disponible" });
  });

  it("deja dar de alta a la cuenta de servicio de la lista", async () => {
    expect((await alta("inventario", { nombre: "Monitor 03" })).statusCode).toBe(201);
  });

  it("responde 403 a un empleado y no crea ningún equipo", async () => {
    const respuesta = await alta("ana", { nombre: "Portátil 08" });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await listarEquipos(almacen)).toEqual([]);
  });

  it("responde 403 a todos si CORREOS_IT no está definida", async () => {
    delete process.env.CORREOS_IT;
    expect((await alta("it", { nombre: "Portátil 08" })).statusCode).toBe(403);
  });

  it("responde 400 si falta el nombre y no crea nada", async () => {
    for (const cuerpo of [{ nombre: "" }, { nombre: "   " }, {}, { nombre: 7 }]) {
      const respuesta = await alta("it", cuerpo);
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
    }
    expect(await listarEquipos(almacen)).toEqual([]);
  });

  it("responde 409 con un nombre repetido sin contar mayúsculas ni espacios", async () => {
    await alta("it", { nombre: "Portátil 07" });
    const respuesta = await alta("it", { nombre: " PORTÁTIL 07 " });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "Ya hay un equipo con ese nombre" });
    expect(await listarEquipos(almacen)).toHaveLength(1);
  });

  it("deja un solo equipo si dos altas con el mismo nombre llegan a la vez", async () => {
    const respuestas = await Promise.all([alta("it", { nombre: "Proyector 01" }), alta("it", { nombre: "proyector 01" })]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(await listarEquipos(almacen)).toHaveLength(1);
  });
});

describe("obtenerEquipo y listarEquipos", () => {
  it("dan los equipos dados de alta", async () => {
    const { id } = (await alta("it", { nombre: "Portátil 07" })).json<{ id: string }>();
    await alta("it", { nombre: "Monitor 03" });
    expect(await obtenerEquipo(almacen, id)).toEqual({ id, nombre: "Portátil 07" });
    expect(await obtenerEquipo(almacen, "otro")).toBeUndefined();
    expect((await listarEquipos(almacen)).map((e) => e.nombre)).toEqual(["Monitor 03", "Portátil 07"]);
  });
});
