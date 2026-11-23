import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import { almacenEnMemoria } from "../../lib/datos.js";
import { rutas } from "./index.js";
import { esCuentaDeIT, esOperacionDeIT, hoyEnMadrid } from "./prestamos.js";

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

describe("POST /api/equipos/:id/solicitud", () => {
  const pedir = (app: Awaited<ReturnType<typeof servidor>>["app"], id: string, cuerpo: unknown, correo = "ana.perez@empresa.com") =>
    app.inject({ method: "POST", url: `/api/equipos/${id}/solicitud`, headers: { "x-correo": correo }, payload: cuerpo as object });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-23T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reserva el equipo disponible a nombre de quien lo pide y responde 201", async () => {
    const { app, almacen } = await servidor();
    await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 07" });
    const respuesta = await pedir(app, "e1", { devolucion: "2026-12-15" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id: "e1",
      nombre: "Portátil 07",
      estado: "reservado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-12-15",
    });
    expect((await ver(app)).json()).toEqual([respuesta.json()]);
    const prestamos = await almacen.listar<{ equipo: string; estado: string; persona: string }>("prestamos_prestamos");
    expect(prestamos).toHaveLength(1);
    expect(prestamos[0]).toMatchObject({ equipo: "e1", estado: "reservado", persona: "ana.perez@empresa.com" });
  });

  it("responde 409 si el equipo está reservado y lo deja a nombre de quien lo tenía", async () => {
    const { app, almacen } = await servidor();
    await almacen.guardar("equipos_equipos", "e2", { id: "e2", nombre: "Monitor 03" });
    await almacen.guardar("prestamos_activos", "e2", {
      id: "e2",
      prestamo: "p2",
      persona: "luis.garcia@empresa.com",
      devolucion: "2026-12-15",
      estado: "reservado",
    });
    const respuesta = await pedir(app, "e2", { devolucion: "2026-12-15" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
    const activo = await almacen.obtener<{ persona: string; estado: string }>("prestamos_activos", "e2");
    expect(activo).toMatchObject({ persona: "luis.garcia@empresa.com", estado: "reservado" });
    expect(await almacen.listar("prestamos_prestamos")).toHaveLength(0);
  });

  it("responde 409 si el equipo está prestado", async () => {
    const { app, almacen } = await servidor();
    await almacen.guardar("equipos_equipos", "e2", { id: "e2", nombre: "Monitor 03" });
    await almacen.guardar("prestamos_activos", "e2", {
      id: "e2",
      prestamo: "p2",
      persona: "luis.garcia@empresa.com",
      devolucion: "2026-12-15",
      estado: "prestado",
    });
    const respuesta = await pedir(app, "e2", { devolucion: "2026-12-15" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
  });

  it("responde 404 si el equipo no existe", async () => {
    const { app } = await servidor();
    const respuesta = await pedir(app, "no-existe", { devolucion: "2026-12-15" });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("lo puede pedir una cuenta de IT", async () => {
    const { app, almacen } = await servidor();
    await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 07" });
    expect((await pedir(app, "e1", { devolucion: "2026-12-15" }, "it@empresa.com")).statusCode).toBe(201);
  });

  it("responde 400 y deja el equipo disponible si falta la fecha, no es real o ya ha pasado", async () => {
    const { app, almacen } = await servidor();
    await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 07" });
    const casos: [unknown, string][] = [
      [{}, "Falta la fecha de devolución"],
      [{ devolucion: "" }, "Falta la fecha de devolución"],
      [{ devolucion: "2026-02-30" }, "La fecha de devolución no es válida"],
      [{ devolucion: "15/12/2026" }, "La fecha de devolución no es válida"],
      [{ devolucion: "2026-11-22" }, "La fecha de devolución ya ha pasado"],
    ];
    for (const [cuerpo, error] of casos) {
      const respuesta = await pedir(app, "e1", cuerpo);
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error });
    }
    expect(await almacen.listar("prestamos_activos")).toHaveLength(0);
  });

  it("acepta la fecha de hoy", async () => {
    const { app, almacen } = await servidor();
    await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 07" });
    expect((await pedir(app, "e1", { devolucion: "2026-11-23" })).statusCode).toBe(201);
  });

  it("toma como hoy el día en Madrid, no el de UTC", async () => {
    vi.setSystemTime(new Date("2026-11-23T23:30:00Z")); // las 00:30 del 24 en Madrid
    const { app, almacen } = await servidor();
    await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 07" });
    const respuesta = await pedir(app, "e1", { devolucion: "2026-11-23" });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "La fecha de devolución ya ha pasado" });
  });
});

describe("POST /api/equipos/:id/entrega", () => {
  const entregar = (app: Awaited<ReturnType<typeof servidor>>["app"], id: string, correo = "it@empresa.com") =>
    app.inject({ method: "POST", url: `/api/equipos/${id}/entrega`, headers: { "x-correo": correo } });

  it("pasa el equipo reservado a prestado con la persona y la devolución de la solicitud", async () => {
    const { app, almacen } = await servidor();
    await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 07" });
    await almacen.guardar("prestamos_prestamos", "p1", {
      id: "p1",
      equipo: "e1",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-12-15",
      estado: "reservado",
      creado: "2026-11-23T10:00:00.000Z",
    });
    await almacen.guardar("prestamos_activos", "e1", {
      id: "e1",
      prestamo: "p1",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-12-15",
      estado: "reservado",
    });
    const respuesta = await entregar(app, "e1");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({
      id: "e1",
      nombre: "Portátil 07",
      estado: "prestado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-12-15",
    });
    expect((await ver(app)).json()).toEqual([respuesta.json()]);
    expect(await almacen.obtener("prestamos_prestamos", "p1")).toMatchObject({ estado: "prestado" });
  });

  it("responde 409 si el equipo está disponible y sigue disponible", async () => {
    const { app, almacen } = await servidor();
    await almacen.guardar("equipos_equipos", "e2", { id: "e2", nombre: "Monitor 03" });
    const respuesta = await entregar(app, "e2");
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está reservado" });
    expect((await ver(app)).json()).toEqual([{ id: "e2", nombre: "Monitor 03", estado: "disponible" }]);
  });

  it("responde 409 si el equipo ya está prestado", async () => {
    const { app, almacen } = await servidor();
    await almacen.guardar("equipos_equipos", "e2", { id: "e2", nombre: "Monitor 03" });
    await almacen.guardar("prestamos_activos", "e2", {
      id: "e2",
      prestamo: "p2",
      persona: "luis.garcia@empresa.com",
      devolucion: "2026-12-20",
      estado: "prestado",
    });
    const respuesta = await entregar(app, "e2");
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está reservado" });
  });

  it("responde 404 si el equipo no existe", async () => {
    const { app } = await servidor();
    const respuesta = await entregar(app, "no-existe");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("responde 403 a quien no es de IT y no entrega el equipo", async () => {
    const { app, almacen } = await servidor();
    await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 07" });
    await almacen.guardar("prestamos_activos", "e1", {
      id: "e1",
      prestamo: "p1",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-12-15",
      estado: "reservado",
    });
    const respuesta = await entregar(app, "e1", "ana.perez@empresa.com");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await almacen.obtener("prestamos_activos", "e1")).toMatchObject({ estado: "reservado" });
  });
});

describe("hoyEnMadrid", () => {
  it("da el día en Madrid", () => {
    expect(hoyEnMadrid(new Date("2026-11-23T23:30:00Z"))).toBe("2026-11-24");
    expect(hoyEnMadrid(new Date("2026-11-23T10:00:00Z"))).toBe("2026-11-23");
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
