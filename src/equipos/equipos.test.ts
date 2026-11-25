import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearServidor } from "../../app/server.js";
import type { Persona } from "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { obtenerEquipo, rutas } from "./index.js";

const personas: Record<string, Persona> = {
  ana: { email: "ana.perez@empresa.com", nombre: "Ana Pérez" },
  it: { email: "it@empresa.com", nombre: "IT" },
};

interface Respuesta {
  codigo: number;
  cuerpo: unknown;
}

let almacen: Almacen;

beforeEach(() => {
  vi.stubEnv("CORREOS_IT", "it@empresa.com");
  almacen = almacenEnMemoria();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function darDeAlta(token: string, payload: unknown): Promise<Respuesta> {
  const app = await crearServidor({
    googleClientId: "cliente",
    verificarToken: (t) => Promise.resolve(personas[t] ?? null),
    almacen,
    contextos: [rutas],
  });
  const respuesta = await app.inject({
    method: "POST",
    url: "/api/equipos",
    headers: { authorization: `Bearer ${token}` },
    payload: payload as object,
  });
  return { codigo: respuesta.statusCode, cuerpo: respuesta.json() };
}

describe("POST /api/equipos", () => {
  it("crea el equipo disponible y responde 201", async () => {
    const respuesta = await darDeAlta("it", { nombre: "Portátil 07" });
    expect(respuesta.codigo).toBe(201);
    expect(respuesta.cuerpo).toEqual({ id: expect.any(String) as string, nombre: "Portátil 07", estado: "disponible" });
    const { id } = respuesta.cuerpo as { id: string };
    expect((await obtenerEquipo(almacen, id))?.nombre).toBe("Portátil 07");
  });

  it("responde 409 si el nombre solo cambia en mayúsculas o espacios de los extremos", async () => {
    await darDeAlta("it", { nombre: "Portátil 07" });
    const respuesta = await darDeAlta("it", { nombre: " portátil 07 " });
    expect(respuesta.codigo).toBe(409);
    expect(respuesta.cuerpo).toEqual({ error: "Ya hay un equipo con ese nombre" });
    expect(await almacen.listar("equipos")).toHaveLength(1);
  });

  it("con dos altas a la vez del mismo nombre, una sale bien y la otra recibe 409", async () => {
    const respuestas = await Promise.all([darDeAlta("it", { nombre: "Monitor 03" }), darDeAlta("it", { nombre: "MONITOR 03" })]);
    expect(respuestas.map((r) => r.codigo).sort()).toEqual([201, 409]);
  });

  it.each([[{ nombre: "" }], [{ nombre: "   " }], [{}], [{ nombre: 7 }]])("responde 400 con el cuerpo %j", async (cuerpo) => {
    const respuesta = await darDeAlta("it", cuerpo);
    expect(respuesta.codigo).toBe(400);
    expect(respuesta.cuerpo).toEqual({ error: "Falta el nombre del equipo" });
  });

  it("responde 403 a una cuenta que no es de IT y no crea nada", async () => {
    const respuesta = await darDeAlta("ana", { nombre: "Portátil 07" });
    expect(respuesta.codigo).toBe(403);
    expect(respuesta.cuerpo).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.listar("equipos")).toHaveLength(0);
  });

  it("responde 401 sin token válido", async () => {
    const respuesta = await darDeAlta("nadie", { nombre: "Portátil 07" });
    expect(respuesta.codigo).toBe(401);
    expect(respuesta.cuerpo).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("obtenerEquipo", () => {
  it("devuelve undefined si el equipo no existe", async () => {
    expect(await obtenerEquipo(almacen, "eq-999")).toBeUndefined();
  });
});
