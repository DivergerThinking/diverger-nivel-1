import { describe, expect, it } from "vitest";
import Fastify from "fastify";
import { almacenEnMemoria } from "../../lib/datos.js";
import { rutas } from "./index.js";

// La sesión de prueba se toma de la cabecera x-correo; el servidor real la saca del token de Google
// y responde 401 «Inicia sesión con Google.» sin token válido (app/server.ts).
async function servidor() {
  const almacen = almacenEnMemoria();
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _reply, hecho) => {
    const correo = request.headers["x-correo"];
    request.persona = typeof correo === "string" ? { email: correo, nombre: correo } : null;
    hecho();
  });
  await app.register(rutas, { almacen });
  return { app, almacen };
}

const ver = (app: Awaited<ReturnType<typeof servidor>>["app"]) =>
  app.inject({ method: "GET", url: "/api/equipos", headers: { "x-correo": "ana.perez@empresa.com" } });

describe("GET /api/equipos", () => {
  it("responde 200 con la lista vacía si no hay equipos", async () => {
    const { app } = await servidor();
    const respuesta = await ver(app);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([]);
  });

  it("lista los equipos sin préstamo activo como disponibles", async () => {
    const { app, almacen } = await servidor();
    await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 07" });
    const respuesta = await ver(app);
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual([{ id: "e1", nombre: "Portátil 07", estado: "disponible" }]);
  });

  it("enseña el estado, la persona y la devolución de los reservados y prestados", async () => {
    const { app, almacen } = await servidor();
    await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 07" });
    await almacen.guardar("equipos_equipos", "e2", { id: "e2", nombre: "Monitor 03" });
    await almacen.guardar("equipos_equipos", "e3", { id: "e3", nombre: "Proyector 01" });
    await almacen.guardar("prestamos_activos", "e1", {
      id: "e1",
      prestamo: "p1",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-12-15",
      estado: "reservado",
    });
    await almacen.guardar("prestamos_activos", "e2", {
      id: "e2",
      prestamo: "p2",
      persona: "luis.garcia@empresa.com",
      devolucion: "2026-12-20",
      estado: "prestado",
    });
    const equipos = (await ver(app)).json<{ id: string }[]>();
    const porId = Object.fromEntries(equipos.map((e) => [e.id, e]));
    expect(equipos).toHaveLength(3);
    expect(porId["e1"]).toEqual({
      id: "e1",
      nombre: "Portátil 07",
      estado: "reservado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-12-15",
    });
    expect(porId["e2"]).toEqual({
      id: "e2",
      nombre: "Monitor 03",
      estado: "prestado",
      persona: "luis.garcia@empresa.com",
      devolucion: "2026-12-20",
    });
    expect(porId["e3"]).toEqual({ id: "e3", nombre: "Proyector 01", estado: "disponible" });
  });
});
