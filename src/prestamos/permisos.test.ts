import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { crearServidor } from "../../app/server.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas as rutasEquipos } from "../equipos/index.js";
import { rutas } from "./index.js";
import { entregarEquipo, esDeIT, hoyEnMadrid, listarVencidos, solicitarEquipo } from "./operaciones.js";

const PERSONAS: Record<string, { email: string; nombre: string }> = {
  "token-it": { email: "IT@empresa.com", nombre: "IT" },
  "token-ana": { email: "ana.perez@empresa.com", nombre: "Ana" },
  "token-inventario": { email: "inventario@empresa.com", nombre: "Inventario" },
};
const verificarToken = (token: string) => Promise.resolve(PERSONAS[token] ?? null);

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

const llamar = (method: "GET" | "POST", url: string, token: string, payload?: object) =>
  app.inject({ method, url, headers: { authorization: `Bearer ${token}` }, ...(payload ? { payload } : {}) });

describe("operaciones de IT (HU-ACC-02)", () => {
  it("una cuenta de CORREOS_IT, aunque cambien las mayúsculas, consulta los vencidos con 200", async () => {
    process.env["CORREOS_IT"] = "it@empresa.com,inventario@empresa.com";
    const respuesta = await llamar("GET", "/api/prestamos/vencidos", "token-it");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("una cuenta que no es de IT recibe 403 «Solo IT puede hacer esto.» al consultar los vencidos", async () => {
    const respuesta = await llamar("GET", "/api/prestamos/vencidos", "token-ana");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });

  it("una cuenta que no es de IT no crea equipos: 403 y no se crea ninguno", async () => {
    const respuesta = await llamar("POST", "/api/equipos", "token-ana", { nombre: "Portátil 07" });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.listar("equipos")).toEqual([]);
  });

  it("una cuenta que no es de IT no entrega: 403 y el equipo 42 sigue reservado", async () => {
    await darDeAlta("42", "Portátil 07");
    const reserva = await llamar("POST", "/api/equipos/42/solicitud", "token-ana", { devolucion: "2999-12-01" });
    expect(reserva.statusCode).toBe(201);
    const respuesta = await llamar("POST", "/api/equipos/42/entrega", "token-ana");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.obtener("estadosEquipo", "42")).toMatchObject({ estado: "reservado", persona: "ana.perez@empresa.com" });
  });

  it("la cuenta de servicio del inventario en CORREOS_IT reserva un equipo a su nombre con 201", async () => {
    process.env["CORREOS_IT"] = "inventario@empresa.com";
    await darDeAlta("42", "Portátil 07");
    const respuesta = await llamar("POST", "/api/equipos/42/solicitud", "token-inventario", { devolucion: "2999-12-01" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id: "42",
      nombre: "Portátil 07",
      estado: "reservado",
      persona: "inventario@empresa.com",
      devolucion: "2999-12-01",
    });
  });

  it("IT entrega el equipo reservado con la persona y la fecha de la solicitud", async () => {
    await darDeAlta("42", "Portátil 07");
    await llamar("POST", "/api/equipos/42/solicitud", "token-ana", { devolucion: "2999-12-01" });
    const respuesta = await llamar("POST", "/api/equipos/42/entrega", "token-it");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toMatchObject({ estado: "prestado", persona: "ana.perez@empresa.com", devolucion: "2999-12-01" });
    const prestamos = await almacen.listar("prestamos");
    expect(prestamos).toMatchObject([{ equipo: "42", estado: "prestado" }]);
  });

  it("entregar un equipo no reservado o inexistente responde 409 o 404", async () => {
    await darDeAlta("42", "Portátil 07");
    const noReservado = await llamar("POST", "/api/equipos/42/entrega", "token-it");
    expect(noReservado.statusCode).toBe(409);
    expect(noReservado.json()).toEqual({ error: "El equipo no está reservado" });
    const noExiste = await llamar("POST", "/api/equipos/999/entrega", "token-it");
    expect(noExiste.statusCode).toBe(404);
    expect(noExiste.json()).toEqual({ error: "No existe el equipo" });
  });
});

describe("solicitud de un equipo", () => {
  beforeEach(() => darDeAlta("42", "Portátil 07"));

  it("rechaza fecha ausente, no válida o pasada y un equipo ya reservado o inexistente", async () => {
    const hoy = "2026-11-25";
    const motivo = async (devolucion: unknown, id = "42") => {
      const r = await solicitarEquipo(almacen, id, "ana.perez@empresa.com", devolucion, hoy);
      return r.ok ? null : [r.status, r.error];
    };
    expect(await motivo(undefined)).toEqual([400, "Falta la fecha de devolución"]);
    expect(await motivo("2026-02-30")).toEqual([400, "La fecha de devolución no es válida"]);
    expect(await motivo("2026-11-20")).toEqual([400, "La fecha de devolución ya ha pasado"]);
    expect(await motivo("2026-12-01", "999")).toEqual([404, "No existe el equipo"]);
    expect(await motivo("2026-12-01")).toBeNull();
    expect(await motivo("2026-12-01")).toEqual([409, "El equipo no está disponible"]);
  });
});

describe("vencidos y utilidades", () => {
  it("lista los prestados con devolución anterior a hoy, del más antiguo al más reciente", async () => {
    await darDeAlta("1", "Portátil 07");
    await darDeAlta("2", "Proyector 02");
    await darDeAlta("3", "Monitor 03");
    await almacen.guardar("estadosEquipo", "1", { estado: "prestado", persona: "a@empresa.com", devolucion: "2026-11-20" });
    await almacen.guardar("estadosEquipo", "2", { estado: "prestado", persona: "b@empresa.com", devolucion: "2026-11-10" });
    await almacen.guardar("estadosEquipo", "3", { estado: "prestado", persona: "c@empresa.com", devolucion: "2026-11-25" });
    expect(await listarVencidos(almacen, "2026-11-25")).toEqual([
      { id: "2", nombre: "Proyector 02", persona: "b@empresa.com", devolucion: "2026-11-10" },
      { id: "1", nombre: "Portátil 07", persona: "a@empresa.com", devolucion: "2026-11-20" },
    ]);
  });

  it("entregar sin reserva devuelve el error sin cambiar nada", async () => {
    await darDeAlta("1", "Portátil 07");
    const r = await entregarEquipo(almacen, "1");
    expect(r).toEqual({ ok: false, status: 409, error: "El equipo no está reservado" });
  });

  it("esDeIT compara sin mayúsculas ni espacios y hoyEnMadrid da AAAA-MM-DD", () => {
    expect(esDeIT(" It@Empresa.com ")).toBe(true);
    expect(esDeIT("otra@empresa.com")).toBe(false);
    expect(hoyEnMadrid(new Date("2026-11-25T23:30:00Z"))).toBe("2026-11-26");
  });
});
