import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { crearServidor } from "../../app/server.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas as rutasDeEquipos } from "../equipos/index.js";
import { rutas } from "./index.js";
import { hoyEnMadrid, solicitarEquipo } from "./prestamos.js";

const PERSONAS: Record<string, { email: string; nombre: string }> = {
  it: { email: "it@empresa.com", nombre: "IT" },
  inventario: { email: "inventario@empresa.com", nombre: "Inventario" },
  ana: { email: "ana.perez@empresa.com", nombre: "Ana" },
  luis: { email: "luis.gomez@empresa.com", nombre: "Luis" },
};
const verificarToken = (token: string) => Promise.resolve(PERSONAS[token] ?? null);

const original = process.env.CORREOS_IT;
let app: FastifyInstance;
let almacen: Almacen;

beforeEach(async () => {
  process.env.CORREOS_IT = "it@empresa.com,inventario@empresa.com";
  almacen = almacenEnMemoria();
  app = await crearServidor({ googleClientId: "cliente", verificarToken, almacen, contextos: [rutasDeEquipos, rutas] });
});

afterEach(async () => {
  await app.close();
  if (original === undefined) delete process.env.CORREOS_IT;
  else process.env.CORREOS_IT = original;
});

const con = (token: string) => ({ authorization: `Bearer ${token}` });

async function darDeAlta(nombre: string): Promise<string> {
  const respuesta = await app.inject({ method: "POST", url: "/api/equipos", headers: con("it"), payload: { nombre } });
  return respuesta.json<{ id: string }>().id;
}

const solicitar = (token: string, id: string, cuerpo: object) =>
  app.inject({ method: "POST", url: `/api/equipos/${id}/solicitud`, headers: con(token), payload: cuerpo });

describe("acceso con la cuenta de Google (HU-ACC-01)", () => {
  it("reserva el equipo a nombre del correo del token", async () => {
    const id = await darDeAlta("Portátil 07");
    const respuesta = await solicitar("ana", id, { devolucion: "2999-11-20" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id,
      nombre: "Portátil 07",
      estado: "reservado",
      persona: "ana.perez@empresa.com",
      devolucion: "2999-11-20",
    });
  });

  it("deja listar los equipos a la cuenta de servicio del inventario", async () => {
    const id = await darDeAlta("Portátil 07");
    const respuesta = await app.inject({ url: "/api/equipos", headers: con("inventario") });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([{ id, nombre: "Portátil 07", estado: "disponible" }]);
  });

  it("responde 401 sin token de identidad", async () => {
    const respuesta = await app.inject("/api/prestamos/vencidos");
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("responde 401 si el token no se verifica (correo sin verificar u otro cliente OAuth)", async () => {
    const respuesta = await app.inject({ url: "/api/equipos", headers: con("luis-sin-verificar") });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("GET /api/equipos", () => {
  it("enseña el estado de cada equipo, con persona y devolución si no está disponible", async () => {
    const libre = await darDeAlta("Monitor 03");
    const pedido = await darDeAlta("Portátil 07");
    await solicitar("luis", pedido, { devolucion: "2999-11-20" });
    const lista = (await app.inject({ url: "/api/equipos", headers: con("ana") })).json<unknown[]>();
    expect(lista).toEqual([
      { id: libre, nombre: "Monitor 03", estado: "disponible" },
      { id: pedido, nombre: "Portátil 07", estado: "reservado", persona: "luis.gomez@empresa.com", devolucion: "2999-11-20" },
    ]);
  });
});

describe("ver los equipos y su estado (HU-SOL-01)", () => {
  it("enseña disponible sin persona ni devolución y prestado con persona y devolución", async () => {
    const libre = await darDeAlta("Portátil 07");
    const prestado = await darDeAlta("Monitor 03");
    await almacen.guardar("prestamos_estados", prestado, {
      equipoId: prestado,
      estado: "prestado",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-11-20",
      prestamoId: "prestamo-1",
    });
    const respuesta = await app.inject({ url: "/api/equipos", headers: con("ana") });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { id: prestado, nombre: "Monitor 03", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" },
      { id: libre, nombre: "Portátil 07", estado: "disponible" },
    ]);
  });

  it("responde 401 sin token de identidad y no lista ningún equipo", async () => {
    await darDeAlta("Portátil 07");
    const respuesta = await app.inject("/api/equipos");
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});

describe("POST /api/equipos/{id}/solicitud", () => {
  it("responde 400 si falta la fecha", async () => {
    const id = await darDeAlta("Portátil 07");
    const respuesta = await solicitar("ana", id, {});
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Falta la fecha de devolución" });
  });

  it("responde 400 si la fecha no existe o no es una fecha", async () => {
    const id = await darDeAlta("Portátil 07");
    for (const devolucion of ["2026-02-30", "mañana", 5]) {
      const respuesta = await solicitar("ana", id, { devolucion });
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
    }
    const [equipo] = (await app.inject({ url: "/api/equipos", headers: con("ana") })).json<{ estado: string }[]>();
    expect(equipo?.estado).toBe("disponible");
  });

  it("responde 400 si la fecha ya ha pasado y deja el equipo disponible", async () => {
    const id = await darDeAlta("Portátil 07");
    const respuesta = await solicitar("ana", id, { devolucion: "2000-01-01" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución ya ha pasado" });
    const [equipo] = (await app.inject({ url: "/api/equipos", headers: con("ana") })).json<{ estado: string }[]>();
    expect(equipo?.estado).toBe("disponible");
  });

  it("acepta la fecha de hoy en Madrid y rechaza la del día anterior", async () => {
    const id = await darDeAlta("Portátil 07");
    await expect(solicitarEquipo(almacen, id, "ana.perez@empresa.com", "2026-11-14", "2026-11-15")).rejects.toThrow(
      "La fecha de devolución ya ha pasado",
    );
    const equipo = await solicitarEquipo(almacen, id, "ana.perez@empresa.com", "2026-11-15", "2026-11-15");
    expect(equipo.estado).toBe("reservado");
  });

  it("responde 409 si el equipo ya está reservado", async () => {
    const id = await darDeAlta("Monitor 03");
    await solicitar("luis", id, { devolucion: "2999-11-20" });
    const respuesta = await solicitar("ana", id, { devolucion: "2999-11-20" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
    const [equipo] = (await app.inject({ url: "/api/equipos", headers: con("ana") })).json<
      { estado: string; persona?: string }[]
    >();
    expect(equipo).toMatchObject({ estado: "reservado", persona: "luis.gomez@empresa.com" });
  });

  it("responde 404 si el id no es de ningún equipo", async () => {
    const respuesta = await solicitar("ana", "no-existe", { devolucion: "2999-11-20" });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("reserva una sola vez si dos solicitudes llegan a la vez", async () => {
    const id = await darDeAlta("Proyector 01");
    const respuestas = await Promise.all([
      solicitar("ana", id, { devolucion: "2999-11-20" }),
      solicitar("luis", id, { devolucion: "2999-11-20" }),
    ]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
  });
});

describe("hoyEnMadrid", () => {
  it("da el día de Madrid, no el de UTC", () => {
    expect(hoyEnMadrid(new Date("2026-11-15T23:30:00Z"))).toBe("2026-11-16");
    expect(hoyEnMadrid(new Date("2026-11-15T10:00:00Z"))).toBe("2026-11-15");
  });
});
