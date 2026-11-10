import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { almacenEnMemoria } from "../../lib/datos.js";
import { crearServidor } from "../../app/server.js";
import { rutas as equipos } from "../equipos/index.js";
import { rutas } from "./index.js";
import { ErrorPrestamo, obtenerHistorial } from "./prestamos.js";

const it_ = { email: "it.soporte@empresa.com" };

const prestamo = (id: string, idEquipo: string, estado: string, persona: string, devolucion: string, creado: string) => ({
  id,
  idPrestamo: id,
  idEquipo,
  estado,
  persona,
  devolucion,
  creado,
});

const montar = async () => {
  const almacen = almacenEnMemoria();
  await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 07" });
  await almacen.guardar("equipos_equipos", "e2", { id: "e2", nombre: "Monitor 03" });
  await almacen.guardar("prestamos_prestamos", "p1", prestamo("p1", "e1", "devuelto", "ana.perez@empresa.com", "2026-11-05", "2026-11-01T09:00:00.000Z"));
  await almacen.guardar("prestamos_prestamos", "p2", prestamo("p2", "e1", "reservado", "luis.gomez@empresa.com", "2026-11-20", "2026-11-06T09:00:00.000Z"));
  await almacen.guardar("prestamos_prestamos", "p3", prestamo("p3", "e2", "prestado", "ana.perez@empresa.com", "2026-11-20", "2026-11-02T09:00:00.000Z"));
  return almacen;
};

describe("consultar el historial de un equipo (HU-SEG-02)", () => {
  beforeEach(() => {
    vi.stubEnv("CORREOS_IT", "it.soporte@empresa.com");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("criterio 1: devuelve los préstamos del más reciente al más antiguo", async () => {
    expect(await obtenerHistorial(await montar(), "e1", it_)).toEqual([
      { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20", estado: "reservado" },
      { persona: "ana.perez@empresa.com", devolucion: "2026-11-05", estado: "devuelto" },
    ]);
  });

  it("criterio 2: un equipo con un único préstamo devuelve solo ese", async () => {
    expect(await obtenerHistorial(await montar(), "e2", it_)).toEqual([
      { persona: "ana.perez@empresa.com", devolucion: "2026-11-20", estado: "prestado" },
    ]);
  });

  it("un equipo sin préstamos devuelve una lista vacía", async () => {
    const almacen = await montar();
    await almacen.guardar("equipos_equipos", "e3", { id: "e3", nombre: "Altavoz 01" });
    expect(await obtenerHistorial(almacen, "e3", it_)).toEqual([]);
  });

  it("criterio 3: un equipo inexistente da 404 «No existe el equipo»", async () => {
    await expect(obtenerHistorial(await montar(), "no-existe", it_)).rejects.toEqual(new ErrorPrestamo(404, "No existe el equipo"));
  });

  it("criterio 4: quien no es de IT recibe 403 «Solo IT puede hacer esto.»", async () => {
    await expect(obtenerHistorial(await montar(), "e1", { email: "ana.perez@empresa.com" })).rejects.toEqual(
      new ErrorPrestamo(403, "Solo IT puede hacer esto."),
    );
  });

  describe("GET /api/equipos/{id}/historial", () => {
    const consultar = async (id: string, token?: string) =>
      (
        await crearServidor({
          googleClientId: "cliente-app",
          verificarToken: (t) =>
            Promise.resolve(
              t === "it" ? { email: "it.soporte@empresa.com", nombre: "IT" } : t === "ana" ? { email: "ana.perez@empresa.com", nombre: "Ana" } : null,
            ),
          almacen: await montar(),
          contextos: [equipos, rutas],
        })
      ).inject({
        method: "GET",
        url: `/api/equipos/${id}/historial`,
        ...(token ? { headers: { authorization: `Bearer ${token}` } } : {}),
      });

    it("IT recibe 200 con el historial ordenado", async () => {
      const respuesta = await consultar("e1", "it");
      expect(respuesta.statusCode).toBe(200);
      expect(respuesta.json()).toEqual([
        { persona: "luis.gomez@empresa.com", devolucion: "2026-11-20", estado: "reservado" },
        { persona: "ana.perez@empresa.com", devolucion: "2026-11-05", estado: "devuelto" },
      ]);
    });

    it("un equipo inexistente da 404 con el mensaje del criterio", async () => {
      const respuesta = await consultar("no-existe", "it");
      expect(respuesta.statusCode).toBe(404);
      expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
    });

    it("una empleada que no es de IT recibe 403 con el mensaje del criterio", async () => {
      const respuesta = await consultar("e1", "ana");
      expect(respuesta.statusCode).toBe(403);
      expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    });

    it("sin sesión recibe 401", async () => {
      const respuesta = await consultar("e1");
      expect(respuesta.statusCode).toBe(401);
      expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
    });
  });
});
