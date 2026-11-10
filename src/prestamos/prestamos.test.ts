import { describe, expect, it } from "vitest";
import { almacenEnMemoria } from "../../lib/datos.js";
import { crearServidor } from "../../app/server.js";
import { rutas as equipos } from "../equipos/index.js";
import { listarEquiposConEstado, rutas } from "./index.js";

const ana = { email: "ana.perez@empresa.com", nombre: "Ana" };
const servidor = (almacen = almacenEnMemoria()) =>
  crearServidor({
    googleClientId: "cliente-app",
    verificarToken: (token) => Promise.resolve(token === "valido" ? ana : null),
    almacen,
    contextos: [equipos, rutas],
  });

describe("lista de equipos con su estado", () => {
  it("un equipo sin préstamo activo está disponible, sin persona ni devolución", async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 07" });
    expect(await listarEquiposConEstado(almacen)).toEqual([{ id: "e1", nombre: "Portátil 07", estado: "disponible" }]);
  });

  it("un equipo con préstamo activo muestra su estado, persona y devolución", async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Monitor 03" });
    await almacen.guardar("prestamos_activos", "e1", {
      idPrestamo: "p1",
      idEquipo: "e1",
      estado: "prestado",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(await listarEquiposConEstado(almacen)).toEqual([
      { id: "e1", nombre: "Monitor 03", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" },
    ]);
  });
});

describe("sesión con Google en las rutas de préstamos (HU-ACC-01)", () => {
  it("con un token válido GET /api/equipos responde 200 con la lista", async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 07" });
    const app = await servidor(almacen);
    const respuesta = await app.inject({ method: "GET", url: "/api/equipos", headers: { authorization: "Bearer valido" } });
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([{ id: "e1", nombre: "Portátil 07", estado: "disponible" }]);
  });

  it("sin token GET /api/equipos responde 401", async () => {
    const app = await servidor();
    const respuesta = await app.inject({ method: "GET", url: "/api/equipos" });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("con un token no válido (otro cliente, correo sin verificar o caducado) responde 401", async () => {
    const app = await servidor();
    const respuesta = await app.inject({ method: "GET", url: "/api/equipos", headers: { authorization: "Bearer invalido" } });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("sin token, pedir un equipo responde 401 y el equipo sigue disponible", async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 07" });
    const app = await servidor(almacen);
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos/e1/solicitud",
      payload: { devolucion: "2026-11-20" },
    });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
    expect(await listarEquiposConEstado(almacen)).toEqual([{ id: "e1", nombre: "Portátil 07", estado: "disponible" }]);
  });
});
