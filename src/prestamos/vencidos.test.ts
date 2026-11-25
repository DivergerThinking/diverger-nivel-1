import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { crearServidor } from "../../app/server.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas as rutasEquipos } from "../equipos/index.js";
import { rutas } from "./index.js";
import { listarVencidos } from "./operaciones.js";

const verificarToken = (token: string) =>
  Promise.resolve(token === "token-it" ? { email: "it@empresa.com", nombre: "IT" } : null);

let app: FastifyInstance;
let almacen: Almacen;
let correosIt: string | undefined;

beforeEach(async () => {
  correosIt = process.env["CORREOS_IT"];
  process.env["CORREOS_IT"] = "it@empresa.com";
  almacen = almacenEnMemoria();
  app = await crearServidor({ googleClientId: "cliente", verificarToken, almacen, contextos: [rutasEquipos, rutas] });
});

afterEach(async () => {
  await app.close();
  if (correosIt === undefined) delete process.env["CORREOS_IT"];
  else process.env["CORREOS_IT"] = correosIt;
});

async function darDeAlta(id: string, nombre: string): Promise<void> {
  await almacen.guardar("equipos", id, { nombre, nombreNormalizado: nombre.toLowerCase() });
  await almacen.guardar("nombresEquipo", encodeURIComponent(nombre.toLowerCase()), { equipo: id });
}

describe("ver los préstamos vencidos (HU-SEG-01)", () => {
  it("criterio 1: Monitor 03 (2026-11-10) primero y Portátil 07 (2026-11-20) después, con id, nombre, persona y devolucion", async () => {
    await darDeAlta("7", "Portátil 07");
    await darDeAlta("3", "Monitor 03");
    await almacen.guardar("estadosEquipo", "7", { estado: "prestado", persona: "ana@empresa.com", devolucion: "2026-11-20" });
    await almacen.guardar("estadosEquipo", "3", { estado: "prestado", persona: "luis@empresa.com", devolucion: "2026-11-10" });
    expect(await listarVencidos(almacen, "2026-11-25")).toEqual([
      { id: "3", nombre: "Monitor 03", persona: "luis@empresa.com", devolucion: "2026-11-10" },
      { id: "7", nombre: "Portátil 07", persona: "ana@empresa.com", devolucion: "2026-11-20" },
    ]);
  });

  it("criterio 2: un prestado que vence hoy y un reservado con fecha pasada no son vencidos", async () => {
    await darDeAlta("2", "Proyector 02");
    await darDeAlta("8", "Portátil 08");
    await almacen.guardar("estadosEquipo", "2", { estado: "prestado", persona: "ana@empresa.com", devolucion: "2026-11-25" });
    await almacen.guardar("estadosEquipo", "8", { estado: "reservado", persona: "luis@empresa.com", devolucion: "2026-11-20" });
    expect(await listarVencidos(almacen, "2026-11-25")).toEqual([]);
  });

  it("la ruta responde 200 con una lista vacía cuando no hay vencidos", async () => {
    const respuesta = await app.inject({
      method: "GET",
      url: "/api/prestamos/vencidos",
      headers: { authorization: "Bearer token-it" },
    });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });
});
