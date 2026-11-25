import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { crearServidor } from "../../app/server.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas as rutasEquipos } from "../equipos/index.js";
import { rutas } from "./index.js";

const PERSONAS: Record<string, { email: string; nombre: string }> = {
  "token-it": { email: "it@empresa.com", nombre: "IT" },
  "token-ana": { email: "ana.perez@empresa.com", nombre: "Ana" },
  "token-luis": { email: "luis.gomez@empresa.com", nombre: "Luis" },
};
const verificarToken = (token: string) => Promise.resolve(PERSONAS[token] ?? null);

const DEVOLUCION = "2099-12-01";

let app: FastifyInstance;
let almacen: Almacen;
let correosIt: string | undefined;

beforeEach(async () => {
  correosIt = process.env["CORREOS_IT"];
  process.env["CORREOS_IT"] = "it@empresa.com";
  almacen = almacenEnMemoria();
  app = await crearServidor({ googleClientId: "cliente", verificarToken, almacen, contextos: [rutasEquipos, rutas] });
  await almacen.guardar("equipos", "42", { nombre: "Portátil 07", nombreNormalizado: "portátil 07" });
  await almacen.guardar("nombresEquipo", "portátil%2007", { equipo: "42" });
});

afterEach(async () => {
  await app.close();
  if (correosIt === undefined) delete process.env["CORREOS_IT"];
  else process.env["CORREOS_IT"] = correosIt;
});

const solicitar = (token: string) =>
  app.inject({
    method: "POST",
    url: "/api/equipos/42/solicitud",
    headers: { authorization: `Bearer ${token}` },
    payload: { devolucion: DEVOLUCION },
  });

const prestar = (persona: string) =>
  app.inject({
    method: "POST",
    url: "/api/equipos/42/prestamo",
    headers: { authorization: "Bearer token-it" },
    payload: { persona, devolucion: DEVOLUCION },
  });

describe("un equipo no se reserva ni se presta dos veces a la vez (HU-SOL-03)", () => {
  it("de dos solicitudes simultáneas una responde 201 y la otra 409", async () => {
    const [deAna, deLuis] = await Promise.all([solicitar("token-ana"), solicitar("token-luis")]);
    const respuestas = [deAna, deLuis];
    const ganadoras = respuestas.filter((r) => r.statusCode === 201);
    const perdedoras = respuestas.filter((r) => r.statusCode === 409);
    expect(ganadoras).toHaveLength(1);
    expect(perdedoras).toHaveLength(1);
    expect(perdedoras[0]?.json()).toEqual({ error: "El equipo no está disponible" });

    const ganadora = ganadoras[0] === deAna ? "ana.perez@empresa.com" : "luis.gomez@empresa.com";
    expect(ganadoras[0]?.json()).toEqual({
      id: "42",
      nombre: "Portátil 07",
      estado: "reservado",
      persona: ganadora,
      devolucion: DEVOLUCION,
    });
    expect(await almacen.listar("prestamos")).toMatchObject([{ equipo: "42", persona: ganadora, estado: "reservado" }]);
  });

  it("con muchas solicitudes simultáneas solo una sale bien", async () => {
    const respuestas = await Promise.all(Array.from({ length: 10 }, (_, i) => solicitar(i % 2 === 0 ? "token-ana" : "token-luis")));
    expect(respuestas.filter((r) => r.statusCode === 201)).toHaveLength(1);
    expect(respuestas.filter((r) => r.statusCode === 409)).toHaveLength(9);
    expect(await almacen.listar("prestamos")).toHaveLength(1);
  });

  it("de una solicitud y un préstamo en el mostrador simultáneos solo sale uno y el historial tiene un único préstamo", async () => {
    const [solicitud, mostrador] = await Promise.all([solicitar("token-ana"), prestar("luis.gomez@empresa.com")]);
    const codigos = [solicitud.statusCode, mostrador.statusCode].sort();
    expect(codigos).toEqual([201, 409]);
    const perdedora = solicitud.statusCode === 409 ? solicitud : mostrador;
    expect(perdedora.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await almacen.listar("prestamos")).toHaveLength(1);
  });

  it("de dos préstamos en el mostrador simultáneos solo sale uno", async () => {
    const [uno, otro] = await Promise.all([prestar("ana.perez@empresa.com"), prestar("luis.gomez@empresa.com")]);
    expect([uno.statusCode, otro.statusCode].sort()).toEqual([201, 409]);
    expect(await almacen.listar("prestamos")).toHaveLength(1);
  });
});
