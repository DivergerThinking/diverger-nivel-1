import Fastify from "fastify";
import { beforeEach, describe, expect, it } from "vitest";
import "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";

let almacen: Almacen;

beforeEach(() => {
  almacen = almacenEnMemoria();
});

// La sesión se toma de la cabecera «x-correo», como la dejaría el servidor en request.persona.
async function servidor() {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _reply, hecho) => {
    const correo = request.headers["x-correo"];
    if (typeof correo === "string") request.persona = { email: correo, nombre: correo };
    hecho();
  });
  await app.register(rutas, { almacen });
  return app;
}

// Deja un equipo en el catálogo como lo hace el alta del contexto «equipos».
async function darDeAlta(id: string, nombre: string) {
  await almacen.guardar("equipos", id, { nombre, nombreNormalizado: nombre.toLowerCase() });
  await almacen.guardar("equipos_nombres", encodeURIComponent(nombre.toLowerCase()), { equipoId: id });
}

async function reservar(equipoId: string, persona: string, devolucion: string) {
  await almacen.guardar("prestamos_activos", equipoId, { equipoId, persona, devolucion, estado: "reservado" });
}

async function listar(correo?: string) {
  const app = await servidor();
  return app.inject({ method: "GET", url: "/api/equipos", headers: correo ? { "x-correo": correo } : {} });
}

describe("GET /api/equipos", () => {
  it("lista cada equipo con su estado, y persona y devolucion solo si está reservado", async () => {
    await darDeAlta("e1", "Portátil 07");
    await darDeAlta("e2", "Proyector 01");
    await reservar("e2", "ana.perez@empresa.com", "2026-11-20");

    const respuesta = await listar("luis.gomez@empresa.com");

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([
      { id: "e1", nombre: "Portátil 07", estado: "disponible" },
      { id: "e2", nombre: "Proyector 01", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-11-20" },
    ]);
  });

  it("un equipo disponible no lleva persona ni devolucion", async () => {
    await darDeAlta("e1", "Portátil 07");
    const [equipo] = (await listar("luis.gomez@empresa.com")).json<Record<string, unknown>[]>();
    expect(equipo).not.toHaveProperty("persona");
    expect(equipo).not.toHaveProperty("devolucion");
  });

  it("un equipo prestado se lista con persona y devolucion", async () => {
    await darDeAlta("e1", "Monitor 01");
    await almacen.guardar("prestamos_activos", "e1", {
      equipoId: "e1",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-05",
      estado: "prestado",
    });
    const respuesta = await listar("luis.gomez@empresa.com");
    expect(respuesta.json()).toEqual([
      { id: "e1", nombre: "Monitor 01", estado: "prestado", persona: "ana.perez@empresa.com", devolucion: "2026-11-05" },
    ]);
  });

  it("sin equipos responde 200 con una lista vacía", async () => {
    const respuesta = await listar("luis.gomez@empresa.com");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("sin sesión responde 401 y no lista ningún equipo", async () => {
    await darDeAlta("e1", "Portátil 07");
    const respuesta = await listar();
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });
});
