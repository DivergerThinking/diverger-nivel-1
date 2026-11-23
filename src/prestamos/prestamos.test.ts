import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import { almacenEnMemoria } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { esCuentaDeIT, esOperacionDeIT } from "./prestamos.js";

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

beforeEach(() => {
  vi.stubEnv("CORREOS_IT", "IT@empresa.com,inventario@empresa.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

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

  it("lo puede ver una cuenta de IT y una que no lo es", async () => {
    const { app } = await servidor();
    const deIT = await app.inject({ method: "GET", url: "/api/equipos", headers: { "x-correo": "it@empresa.com" } });
    expect(deIT.statusCode).toBe(200);
    expect((await ver(app)).statusCode).toBe(200);
  });
});

const OPERACIONES_DE_IT = [
  { metodo: "POST", url: "/api/equipos/e1/entrega" },
  { metodo: "POST", url: "/api/equipos/e1/prestamo" },
  { metodo: "POST", url: "/api/equipos/e1/devolucion" },
  { metodo: "GET", url: "/api/prestamos/vencidos" },
  { metodo: "GET", url: "/api/equipos/e1/historial" },
] as const;

describe("operaciones solo IT", () => {
  for (const { metodo, url } of OPERACIONES_DE_IT) {
    it(`${metodo} ${url} responde 403 a una cuenta que no es de IT`, async () => {
      const { app } = await servidor();
      const respuesta = await app.inject({ method: metodo, url, headers: { "x-correo": "ana.perez@empresa.com" } });
      expect(respuesta.statusCode).toBe(403);
      expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    });

    it(`${metodo} ${url} no responde 403 a una cuenta de IT, sin distinguir mayúsculas`, async () => {
      const { app } = await servidor();
      const respuesta = await app.inject({ method: metodo, url, headers: { "x-correo": "it@EMPRESA.com" } });
      expect(respuesta.statusCode).not.toBe(403);
    });
  }

  it("responde 403 a una petición sin cuenta", async () => {
    const { app } = await servidor();
    const respuesta = await app.inject({ method: "GET", url: "/api/prestamos/vencidos" });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
  });

  it("responde 403 a quien no es de IT aunque la lista CORREOS_IT esté vacía", async () => {
    vi.stubEnv("CORREOS_IT", "");
    const { app } = await servidor();
    const respuesta = await app.inject({ method: "GET", url: "/api/prestamos/vencidos", headers: { "x-correo": "it@empresa.com" } });
    expect(respuesta.statusCode).toBe(403);
  });
});

describe("esCuentaDeIT", () => {
  it("reconoce los correos de CORREOS_IT sin distinguir mayúsculas ni espacios", () => {
    expect(esCuentaDeIT("it@empresa.com", "IT@empresa.com, inventario@empresa.com")).toBe(true);
    expect(esCuentaDeIT("INVENTARIO@empresa.com", "IT@empresa.com, inventario@empresa.com")).toBe(true);
    expect(esCuentaDeIT("ana.perez@empresa.com", "IT@empresa.com,inventario@empresa.com")).toBe(false);
  });

  it("no reconoce a nadie sin lista o sin correo", () => {
    expect(esCuentaDeIT("it@empresa.com", "")).toBe(false);
    vi.stubEnv("CORREOS_IT", undefined);
    expect(esCuentaDeIT("it@empresa.com")).toBe(false);
    expect(esCuentaDeIT("", ",")).toBe(false);
    expect(esCuentaDeIT(undefined, "it@empresa.com")).toBe(false);
  });
});

describe("esOperacionDeIT", () => {
  it("distingue las operaciones de IT de las que puede hacer cualquiera", () => {
    expect(esOperacionDeIT("GET", "/api/prestamos/vencidos?x=1")).toBe(true);
    expect(esOperacionDeIT("GET", "/api/equipos")).toBe(false);
    expect(esOperacionDeIT("POST", "/api/equipos/e1/solicitud")).toBe(false);
    expect(esOperacionDeIT("POST", "/api/equipos")).toBe(false);
  });
});
