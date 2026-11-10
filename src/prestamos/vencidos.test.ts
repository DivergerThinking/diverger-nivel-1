import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { almacenEnMemoria } from "../../lib/datos.js";
import { crearServidor } from "../../app/server.js";
import { rutas as equipos } from "../equipos/index.js";
import { rutas } from "./index.js";
import { ErrorPrestamo, listarVencidos } from "./prestamos.js";

const it_ = { email: "it.soporte@empresa.com" };
const hoy = "2026-11-10";

const activo = (idEquipo: string, estado: "reservado" | "prestado", persona: string, devolucion: string) => ({
  idPrestamo: `p-${idEquipo}`,
  idEquipo,
  estado,
  persona,
  devolucion,
});

const montar = async () => {
  const almacen = almacenEnMemoria();
  const lista = [
    { id: "e1", nombre: "Monitor 03" },
    { id: "e2", nombre: "Proyector 02" },
    { id: "e3", nombre: "Portátil 07" },
    { id: "e4", nombre: "Altavoz 01" },
  ];
  for (const equipo of lista) {
    await almacen.guardar("equipos_equipos", equipo.id, equipo);
  }
  await almacen.guardar("prestamos_activos", "e1", activo("e1", "prestado", "luis.gomez@empresa.com", "2026-11-08"));
  await almacen.guardar("prestamos_activos", "e2", activo("e2", "prestado", "ana.perez@empresa.com", "2026-11-03"));
  await almacen.guardar("prestamos_activos", "e3", activo("e3", "prestado", "eva.ruiz@empresa.com", "2026-11-10"));
  return almacen;
};

describe("ver los préstamos vencidos (HU-SEG-01)", () => {
  beforeEach(() => {
    vi.stubEnv("CORREOS_IT", "it.soporte@empresa.com");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("criterio 1: devuelve los vencidos del más antiguo al más reciente, sin el que vence hoy", async () => {
    const almacen = await montar();
    expect(await listarVencidos(almacen, it_, hoy)).toEqual([
      { id: "e2", nombre: "Proyector 02", persona: "ana.perez@empresa.com", devolucion: "2026-11-03" },
      { id: "e1", nombre: "Monitor 03", persona: "luis.gomez@empresa.com", devolucion: "2026-11-08" },
    ]);
  });

  it("criterio 2: un equipo reservado con devolución pasada no aparece", async () => {
    const almacen = await montar();
    await almacen.guardar("prestamos_activos", "e4", activo("e4", "reservado", "ana.perez@empresa.com", "2026-11-09"));
    const nombres = (await listarVencidos(almacen, it_, hoy)).map((vencido) => vencido.nombre);
    expect(nombres).not.toContain("Altavoz 01");
  });

  it("sin préstamos vencidos devuelve una lista vacía", async () => {
    expect(await listarVencidos(almacenEnMemoria(), it_, hoy)).toEqual([]);
  });

  it("criterio 3: quien no es de IT recibe 403 «Solo IT puede hacer esto.»", async () => {
    const almacen = await montar();
    await expect(listarVencidos(almacen, { email: "ana.perez@empresa.com" }, hoy)).rejects.toEqual(
      new ErrorPrestamo(403, "Solo IT puede hacer esto."),
    );
  });

  describe("GET /api/prestamos/vencidos", () => {
    const servidor = async () => {
      const almacen = await montar();
      await almacen.guardar("prestamos_activos", "e3", activo("e3", "prestado", "eva.ruiz@empresa.com", "2999-01-01"));
      return crearServidor({
        googleClientId: "cliente-app",
        verificarToken: (token) =>
          Promise.resolve(
            token === "it" ? { email: "it.soporte@empresa.com", nombre: "IT" } : token === "ana" ? { email: "ana.perez@empresa.com", nombre: "Ana" } : null,
          ),
        almacen,
        contextos: [equipos, rutas],
      });
    };
    const consultar = async (token?: string) =>
      (await servidor()).inject({
        method: "GET",
        url: "/api/prestamos/vencidos",
        ...(token ? { headers: { authorization: `Bearer ${token}` } } : {}),
      });

    it("IT recibe 200 con los vencidos ordenados y sin el que vence en el futuro", async () => {
      const respuesta = await consultar("it");
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.json()).toEqual([
        { id: "e2", nombre: "Proyector 02", persona: "ana.perez@empresa.com", devolucion: "2026-11-03" },
        { id: "e1", nombre: "Monitor 03", persona: "luis.gomez@empresa.com", devolucion: "2026-11-08" },
      ]);
    });

    it("una empleada que no es de IT recibe 403 con el mensaje del criterio", async () => {
      const respuesta = await consultar("ana");
      expect(respuesta.statusCode).toBe(403);
      expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    });

    it("sin sesión recibe 401", async () => {
      const respuesta = await consultar();
      expect(respuesta.statusCode).toBe(401);
      expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
    });
  });
});
