import { describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { esFechaValida, hoyEnMadrid, listarEquiposConEstado, solicitarEquipo } from "./prestamos.js";

const ANA = { email: "ana.perez@empresa.com", nombre: "Ana Pérez" };
const headers = {};

async function conPortatil(): Promise<Almacen> {
  const almacen = almacenEnMemoria();
  await almacen.guardar("equipos_equipos", "pc-07", { id: "pc-07", nombre: "Portátil 07" });
  return almacen;
}

/** Servidor con solo este contexto; la persona del token la pone aquí el hook que en la aplicación pone app/server.ts. */
async function servidor(almacen: Almacen): Promise<FastifyInstance> {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request) => {
    request.persona = ANA;
    return Promise.resolve();
  });
  await app.register(rutas, { almacen });
  return app;
}

describe("fechas", () => {
  it("reconoce solo fechas AAAA-MM-DD que existen", () => {
    expect(esFechaValida("2026-11-20")).toBe(true);
    expect(esFechaValida("2026-02-30")).toBe(false);
    expect(esFechaValida("20-11-2026")).toBe(false);
  });

  it("da el día de Madrid, no el de UTC", () => {
    expect(hoyEnMadrid(new Date("2026-11-10T23:30:00Z"))).toBe("2026-11-11");
  });
});

describe("listarEquiposConEstado", () => {
  it("muestra disponible un equipo sin estado guardado", async () => {
    expect(await listarEquiposConEstado(await conPortatil())).toEqual([
      { id: "pc-07", nombre: "Portátil 07", estado: "disponible" },
    ]);
  });
});

describe("solicitarEquipo", () => {
  it("deja el equipo reservado a nombre de la persona y guarda el préstamo", async () => {
    const almacen = await conPortatil();
    const equipo = await solicitarEquipo(almacen, "pc-07", ANA.email, "2026-11-20", "2026-11-11");
    expect(equipo).toEqual({
      id: "pc-07",
      nombre: "Portátil 07",
      estado: "reservado",
      persona: ANA.email,
      devolucion: "2026-11-20",
    });
    expect(await almacen.listar("prestamos_prestamos")).toHaveLength(1);
  });

  it("rechaza un equipo que no existe, sin fecha, con fecha no válida o pasada", async () => {
    const almacen = await conPortatil();
    await expect(solicitarEquipo(almacen, "x", ANA.email, "2026-11-20", "2026-11-11")).rejects.toMatchObject({
      codigo: 404,
      message: "No existe el equipo",
    });
    await expect(solicitarEquipo(almacen, "pc-07", ANA.email, undefined, "2026-11-11")).rejects.toMatchObject({
      codigo: 400,
      message: "Falta la fecha de devolución",
    });
    await expect(solicitarEquipo(almacen, "pc-07", ANA.email, "2026-02-30", "2026-11-11")).rejects.toMatchObject({
      codigo: 400,
      message: "La fecha de devolución no es válida",
    });
    await expect(solicitarEquipo(almacen, "pc-07", ANA.email, "2026-11-10", "2026-11-11")).rejects.toMatchObject({
      codigo: 400,
      message: "La fecha de devolución ya ha pasado",
    });
  });

  it("no reserva dos veces el mismo equipo, ni con dos peticiones a la vez", async () => {
    const almacen = await conPortatil();
    const resultados = await Promise.allSettled([
      solicitarEquipo(almacen, "pc-07", ANA.email, "2026-11-20", "2026-11-11"),
      solicitarEquipo(almacen, "pc-07", "luis@empresa.com", "2026-11-21", "2026-11-11"),
    ]);
    expect(resultados.map((r) => r.status).sort()).toEqual(["fulfilled", "rejected"]);
    await expect(solicitarEquipo(almacen, "pc-07", ANA.email, "2026-11-20", "2026-11-11")).rejects.toMatchObject({
      codigo: 409,
      message: "El equipo no está disponible",
    });
  });
});

describe("rutas con sesión de Google (HU-ACC-01)", () => {
  it("criterio 1: con un token válido, GET /api/equipos da 200 con la lista", async () => {
    const app = await servidor(await conPortatil());
    const respuesta = await app.inject({ url: "/api/equipos", headers });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([{ id: "pc-07", nombre: "Portátil 07", estado: "disponible" }]);
    await app.close();
  });

  it("criterio 2: la solicitud da 201 con la persona tomada del correo del token", async () => {
    const app = await servidor(await conPortatil());
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos/pc-07/solicitud",
      headers,
      payload: { devolucion: "2999-11-20" },
    });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toMatchObject({ estado: "reservado", persona: "ana.perez@empresa.com" });
    await app.close();
  });

  it("traduce los errores de la solicitud a su código y mensaje", async () => {
    const app = await servidor(await conPortatil());
    const sinFecha = await app.inject({ method: "POST", url: "/api/equipos/pc-07/solicitud", headers, payload: {} });
    expect(sinFecha.statusCode).toBe(400);
    expect(sinFecha.json()).toEqual({ error: "Falta la fecha de devolución" });
    const noExiste = await app.inject({
      method: "POST",
      url: "/api/equipos/x/solicitud",
      headers,
      payload: { devolucion: "2999-11-20" },
    });
    expect(noExiste.statusCode).toBe(404);
    await app.close();
  });
});
