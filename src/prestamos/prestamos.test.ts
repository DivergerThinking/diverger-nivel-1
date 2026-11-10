import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { almacenEnMemoria } from "../../lib/datos.js";
import { crearServidor } from "../../app/server.js";
import { rutas as equipos } from "../equipos/index.js";
import { listarEquiposConEstado, rutas } from "./index.js";
import { devolverEquipo, entregarEquipo, ErrorPrestamo, esCuentaDeIT, exigirIT, prestarEquipo, solicitarEquipo } from "./prestamos.js";

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

describe("GET /api/equipos con los tres estados (HU-INV-02)", () => {
  it("una empleada con sesión ve disponible, prestado y reservado con persona y devolución", async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "e1", { id: "e1", nombre: "Portátil 07" });
    await almacen.guardar("equipos_equipos", "e2", { id: "e2", nombre: "Monitor 03" });
    await almacen.guardar("equipos_equipos", "e3", { id: "e3", nombre: "Proyector 02" });
    await almacen.guardar("prestamos_activos", "e2", {
      idPrestamo: "p2",
      idEquipo: "e2",
      estado: "prestado",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-11-20",
    });
    await almacen.guardar("prestamos_activos", "e3", {
      idPrestamo: "p3",
      idEquipo: "e3",
      estado: "reservado",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-11-18",
    });
    const app = await servidor(almacen);
    const respuesta = await app.inject({ method: "GET", url: "/api/equipos", headers: { authorization: "Bearer valido" } });
    expect(respuesta.statusCode).toBe(200);
    const lista = respuesta.json<{ id: string }[]>();
    expect(lista).toHaveLength(3);
    expect(lista.find((e) => e.id === "e1")).toEqual({ id: "e1", nombre: "Portátil 07", estado: "disponible" });
    expect(lista.find((e) => e.id === "e2")).toEqual({
      id: "e2",
      nombre: "Monitor 03",
      estado: "prestado",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(lista.find((e) => e.id === "e3")).toEqual({
      id: "e3",
      nombre: "Proyector 02",
      estado: "reservado",
      persona: "luis.gomez@empresa.com",
      devolucion: "2026-11-18",
    });
  });
});

describe("operaciones de IT reservadas a CORREOS_IT (HU-ACC-02)", () => {
  const cuentas: Record<string, { email: string; nombre: string }> = {
    it: { email: "IT.Soporte@empresa.com", nombre: "IT" },
    inventario: { email: "inventario@empresa.com", nombre: "Inventario" },
    otra: { email: "it.soporte@otra-empresa.com", nombre: "Otra" },
  };
  const montar = async () => {
    const almacen = almacenEnMemoria();
    const app = await crearServidor({
      googleClientId: "cliente-app",
      verificarToken: (token) => Promise.resolve(cuentas[token] ?? null),
      almacen,
      contextos: [equipos, rutas],
    });
    const enviar = (token: string, method: "POST" | "GET", url: string, payload?: object) =>
      app.inject({ method, url, headers: { authorization: `Bearer ${token}` }, ...(payload ? { payload } : {}) });
    return { almacen, enviar };
  };

  beforeEach(() => {
    vi.stubEnv("CORREOS_IT", "it.soporte@empresa.com,inventario@empresa.com");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("los correos de IT se comparan sin distinguir mayúsculas ni espacios", () => {
    expect(esCuentaDeIT("IT.Soporte@empresa.com", "it.soporte@empresa.com, inventario@empresa.com")).toBe(true);
    expect(esCuentaDeIT("it.soporte@otra-empresa.com", "it.soporte@empresa.com")).toBe(false);
    expect(esCuentaDeIT("", ",")).toBe(false);
    expect(esCuentaDeIT("ana@empresa.com", undefined)).toBe(false);
  });

  it("exigirIT deja pasar a una cuenta de IT aunque el correo vaya con mayúsculas", () => {
    expect(() => {
      exigirIT({ email: "IT.Soporte@empresa.com" });
    }).not.toThrow();
  });

  it("exigirIT responde 403 «Solo IT puede hacer esto.» a otra cuenta o sin sesión", () => {
    for (const persona of [{ email: "it.soporte@otra-empresa.com" }, null]) {
      try {
        exigirIT(persona);
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(ErrorPrestamo);
        expect((error as ErrorPrestamo).codigo).toBe(403);
        expect((error as ErrorPrestamo).message).toBe("Solo IT puede hacer esto.");
      }
    }
  });

  it("la cuenta de IT con otras mayúsculas da de alta un equipo y queda disponible", async () => {
    const { enviar } = await montar();
    const alta = await enviar("it", "POST", "/api/equipos", { nombre: "Proyector 02" });
    expect(alta.statusCode).toBe(201);
    const lista = await enviar("it", "GET", "/api/equipos");
    expect(lista.json()).toEqual([expect.objectContaining({ nombre: "Proyector 02", estado: "disponible" })]);
  });

  it("la cuenta de servicio de CORREOS_IT pide un equipo y queda reservado a su correo", async () => {
    const { almacen, enviar } = await montar();
    await almacen.guardar("equipos_equipos", "e7", { id: "e7", nombre: "Portátil 07" });
    const respuesta = await enviar("inventario", "POST", "/api/equipos/e7/solicitud", { devolucion: "2999-11-20" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id: "e7",
      nombre: "Portátil 07",
      estado: "reservado",
      persona: "inventario@empresa.com",
      devolucion: "2999-11-20",
    });
    expect(await listarEquiposConEstado(almacen)).toEqual([
      { id: "e7", nombre: "Portátil 07", estado: "reservado", persona: "inventario@empresa.com", devolucion: "2999-11-20" },
    ]);
  });

  it("una cuenta que no es de IT recibe 403 al dar de alta y no se crea ningún equipo", async () => {
    const { enviar } = await montar();
    const alta = await enviar("otra", "POST", "/api/equipos", { nombre: "Proyector 02" });
    expect(alta.statusCode).toBe(403);
    expect(alta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect((await enviar("otra", "GET", "/api/equipos")).json()).toEqual([]);
  });

  it("pedir un equipo es de todos: una cuenta que no es de IT también lo reserva", async () => {
    const { almacen, enviar } = await montar();
    await almacen.guardar("equipos_equipos", "e7", { id: "e7", nombre: "Portátil 07" });
    const respuesta = await enviar("otra", "POST", "/api/equipos/e7/solicitud", { devolucion: "2999-11-20" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json<{ persona: string }>().persona).toBe("it.soporte@otra-empresa.com");
  });

  describe("errores al pedir un equipo", () => {
    it("un equipo que no existe responde 404", async () => {
      const { enviar } = await montar();
      const respuesta = await enviar("inventario", "POST", "/api/equipos/nada/solicitud", { devolucion: "2999-11-20" });
      expect(respuesta.statusCode).toBe(404);
      expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
    });

    it.each([
      [{}, "Falta la fecha de devolución"],
      [{ devolucion: "2026-02-30" }, "La fecha de devolución no es válida"],
      [{ devolucion: "mañana" }, "La fecha de devolución no es válida"],
      [{ devolucion: "2000-01-01" }, "La fecha de devolución ya ha pasado"],
    ])("con %j responde 400 y el equipo sigue disponible", async (payload, mensaje) => {
      const { almacen, enviar } = await montar();
      await almacen.guardar("equipos_equipos", "e7", { id: "e7", nombre: "Portátil 07" });
      const respuesta = await enviar("inventario", "POST", "/api/equipos/e7/solicitud", payload);
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: mensaje });
      expect(await listarEquiposConEstado(almacen)).toEqual([{ id: "e7", nombre: "Portátil 07", estado: "disponible" }]);
    });

    it("un equipo ya reservado responde 409 y dos peticiones a la vez no lo reservan dos veces", async () => {
      const { almacen, enviar } = await montar();
      await almacen.guardar("equipos_equipos", "e7", { id: "e7", nombre: "Portátil 07" });
      const respuestas = await Promise.all([
        enviar("inventario", "POST", "/api/equipos/e7/solicitud", { devolucion: "2999-11-20" }),
        enviar("otra", "POST", "/api/equipos/e7/solicitud", { devolucion: "2999-11-21" }),
      ]);
      expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
      const rechazada = respuestas.find((r) => r.statusCode === 409);
      expect(rechazada?.json()).toEqual({ error: "El equipo no está disponible" });
    });
  });
});

describe("pedir un equipo disponible (HU-PRE-01)", () => {
  const hoy = "2026-11-10";
  const montar = async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "e7", { id: "e7", nombre: "Portátil 07" });
    return almacen;
  };
  const disponible = { id: "e7", nombre: "Portátil 07", estado: "disponible" };

  it("criterio 1: reserva el equipo a nombre de quien lo pide con la devolución indicada", async () => {
    const almacen = await montar();
    const equipo = await solicitarEquipo(almacen, "e7", ana.email, "2026-11-20", hoy);
    expect(equipo).toEqual({
      id: "e7",
      nombre: "Portátil 07",
      estado: "reservado",
      persona: "ana.perez@empresa.com",
      devolucion: "2026-11-20",
    });
    expect(await listarEquiposConEstado(almacen)).toEqual([equipo]);
  });

  it("criterio 2: una devolución igual a hoy en Madrid se acepta", async () => {
    const almacen = await montar();
    const equipo = await solicitarEquipo(almacen, "e7", ana.email, "2026-11-10", hoy);
    expect(equipo.estado).toBe("reservado");
    expect(equipo.devolucion).toBe("2026-11-10");
  });

  it("criterio 3: una devolución de ayer responde 400 «La fecha de devolución ya ha pasado»", async () => {
    const almacen = await montar();
    await expect(solicitarEquipo(almacen, "e7", ana.email, "2026-11-09", hoy)).rejects.toMatchObject({
      codigo: 400,
      message: "La fecha de devolución ya ha pasado",
    });
    expect(await listarEquiposConEstado(almacen)).toEqual([disponible]);
  });

  it.each(["2026-02-30", "20/11/2026", 20261120])(
    "criterios 4 y 5: la devolución %j responde 400 «La fecha de devolución no es válida»",
    async (devolucion) => {
      const almacen = await montar();
      await expect(solicitarEquipo(almacen, "e7", ana.email, devolucion, hoy)).rejects.toMatchObject({
        codigo: 400,
        message: "La fecha de devolución no es válida",
      });
      expect(await listarEquiposConEstado(almacen)).toEqual([disponible]);
    },
  );

  it.each([undefined, null, ""])("criterio 6: sin fecha (%j) responde 400 «Falta la fecha de devolución»", async (devolucion) => {
    const almacen = await montar();
    await expect(solicitarEquipo(almacen, "e7", ana.email, devolucion, hoy)).rejects.toMatchObject({
      codigo: 400,
      message: "Falta la fecha de devolución",
    });
    expect(await listarEquiposConEstado(almacen)).toEqual([disponible]);
  });

  it("criterio 6 por la ruta: sin cuerpo responde 400 «Falta la fecha de devolución»", async () => {
    const almacen = await montar();
    const app = await servidor(almacen);
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos/e7/solicitud",
      headers: { authorization: "Bearer valido" },
    });
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Falta la fecha de devolución" });
  });

  it("criterio 7: un equipo reservado a otra persona responde 409 y su reserva no cambia", async () => {
    const almacen = await montar();
    const reserva = await solicitarEquipo(almacen, "e7", "luis.gomez@empresa.com", "2026-11-15", hoy);
    await expect(solicitarEquipo(almacen, "e7", ana.email, "2026-11-20", hoy)).rejects.toMatchObject({
      codigo: 409,
      message: "El equipo no está disponible",
    });
    expect(await listarEquiposConEstado(almacen)).toEqual([reserva]);
  });

  it("criterio 8: un equipo que no existe responde 404 «No existe el equipo»", async () => {
    const almacen = await montar();
    await expect(solicitarEquipo(almacen, "no-existe", ana.email, "2026-11-20", hoy)).rejects.toMatchObject({
      codigo: 404,
      message: "No existe el equipo",
    });
  });
});

describe("entregar un equipo reservado (HU-PRE-02)", () => {
  const cuentas: Record<string, { email: string; nombre: string }> = {
    it: { email: "it.soporte@empresa.com", nombre: "IT" },
    ana: ana,
  };
  const montar = async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "e7", { id: "e7", nombre: "Portátil 07" });
    await almacen.guardar("equipos_equipos", "e3", { id: "e3", nombre: "Monitor 03" });
    const app = await crearServidor({
      googleClientId: "cliente-app",
      verificarToken: (token) => Promise.resolve(cuentas[token] ?? null),
      almacen,
      contextos: [equipos, rutas],
    });
    const entregar = (token: string, id: string) =>
      app.inject({ method: "POST", url: `/api/equipos/${id}/entrega`, headers: { authorization: `Bearer ${token}` } });
    return { almacen, entregar };
  };

  beforeEach(() => {
    vi.stubEnv("CORREOS_IT", "it.soporte@empresa.com");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("criterio 1: IT entrega el equipo reservado y pasa a prestado con la misma persona y devolución", async () => {
    const { almacen, entregar } = await montar();
    await solicitarEquipo(almacen, "e7", ana.email, "2999-11-20");
    const respuesta = await entregar("it", "e7");
    expect(respuesta.statusCode).toBe(200);
    const esperado = { id: "e7", nombre: "Portátil 07", estado: "prestado", persona: ana.email, devolucion: "2999-11-20" };
    expect(respuesta.json()).toEqual(esperado);
    expect(await listarEquiposConEstado(almacen)).toContainEqual(esperado);
  });

  it("criterio 2: un equipo disponible responde 409 «El equipo no está reservado» y sigue disponible", async () => {
    const { almacen, entregar } = await montar();
    const respuesta = await entregar("it", "e3");
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está reservado" });
    expect(await listarEquiposConEstado(almacen)).toContainEqual({ id: "e3", nombre: "Monitor 03", estado: "disponible" });
  });

  it("un equipo ya prestado responde 409 «El equipo no está reservado» y dos entregas a la vez solo entregan una", async () => {
    const { almacen, entregar } = await montar();
    await solicitarEquipo(almacen, "e7", ana.email, "2999-11-20");
    const respuestas = await Promise.all([entregar("it", "e7"), entregar("it", "e7")]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([200, 409]);
    expect(respuestas.find((r) => r.statusCode === 409)?.json()).toEqual({ error: "El equipo no está reservado" });
  });

  it("criterio 3: un equipo que no existe responde 404 «No existe el equipo»", async () => {
    const { entregar } = await montar();
    const respuesta = await entregar("it", "no-existe");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("criterio 4: una cuenta que no es de IT recibe 403 «Solo IT puede hacer esto.» y el equipo sigue reservado", async () => {
    const { almacen, entregar } = await montar();
    const reserva = await solicitarEquipo(almacen, "e7", ana.email, "2999-11-20");
    const respuesta = await entregar("ana", "e7");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await listarEquiposConEstado(almacen)).toContainEqual(reserva);
  });

  it("sin token responde 401 «Inicia sesión con Google.»", async () => {
    const { almacen } = await montar();
    const app = await servidor(almacen);
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos/e7/entrega" });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("entregarEquipo sin sesión responde 403", async () => {
    const { almacen } = await montar();
    await expect(entregarEquipo(almacen, "e7", null)).rejects.toMatchObject({ codigo: 403, message: "Solo IT puede hacer esto." });
  });
});

describe("prestar un equipo en el mostrador (HU-PRE-03)", () => {
  const cuentas: Record<string, { email: string; nombre: string }> = {
    it: { email: "it.soporte@empresa.com", nombre: "IT" },
    ana: ana,
  };
  const montar = async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "e3", { id: "e3", nombre: "Monitor 03" });
    await almacen.guardar("equipos_equipos", "e7", { id: "e7", nombre: "Portátil 07" });
    const app = await crearServidor({
      googleClientId: "cliente-app",
      verificarToken: (token) => Promise.resolve(cuentas[token] ?? null),
      almacen,
      contextos: [equipos, rutas],
    });
    const prestar = (token: string, id: string, payload?: object) =>
      app.inject({
        method: "POST",
        url: `/api/equipos/${id}/prestamo`,
        headers: { authorization: `Bearer ${token}` },
        ...(payload ? { payload } : {}),
      });
    return { almacen, prestar };
  };
  const disponible = { id: "e3", nombre: "Monitor 03", estado: "disponible" };

  beforeEach(() => {
    vi.stubEnv("CORREOS_IT", "it.soporte@empresa.com");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("criterio 1: IT presta el equipo y queda prestado a la persona con la devolución indicada", async () => {
    const { almacen, prestar } = await montar();
    const respuesta = await prestar("it", "e3", { persona: ana.email, devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(201);
    const esperado = { id: "e3", nombre: "Monitor 03", estado: "prestado", persona: ana.email, devolucion: "2026-11-20" };
    expect(respuesta.json()).toEqual(esperado);
    expect(await listarEquiposConEstado(almacen)).toContainEqual(esperado);
  });

  it("criterio 2: una devolución anterior a hoy se acepta y el préstamo queda activo y prestado", async () => {
    const { almacen, prestar } = await montar();
    const respuesta = await prestar("it", "e3", { persona: "luis.gomez@empresa.com", devolucion: "2000-11-05" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toMatchObject({ estado: "prestado", devolucion: "2000-11-05" });
    expect(await almacen.obtener("prestamos_activos", "e3")).toMatchObject({
      estado: "prestado",
      persona: "luis.gomez@empresa.com",
      devolucion: "2000-11-05",
    });
  });

  it("criterio 2: se guarda un préstamo con estado prestado", async () => {
    const { almacen } = await montar();
    await prestarEquipo(almacen, "e3", { email: "it.soporte@empresa.com" }, ana.email, "2026-11-05");
    const prestamos = await almacen.listar<{ estado: string; idEquipo: string }>("prestamos_prestamos");
    expect(prestamos).toEqual([expect.objectContaining({ estado: "prestado", idEquipo: "e3" })]);
  });

  it.each([
    ["criterio 3: sin persona", { devolucion: "2026-11-20" }],
    ["criterio 4: sin fecha de devolución", { persona: ana.email }],
    ["sin persona ni fecha", {}],
    ["con la persona vacía", { persona: "  ", devolucion: "2026-11-20" }],
    ["con la persona que no es texto", { persona: 7, devolucion: "2026-11-20" }],
  ])("%s responde 400 «Faltan la persona o la fecha de devolución» y el equipo sigue disponible", async (_caso, payload) => {
    const { almacen, prestar } = await montar();
    const respuesta = await prestar("it", "e3", payload);
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Faltan la persona o la fecha de devolución" });
    expect(await listarEquiposConEstado(almacen)).toContainEqual(disponible);
  });

  it("sin cuerpo responde 400 «Faltan la persona o la fecha de devolución»", async () => {
    const { prestar } = await montar();
    const respuesta = await prestar("it", "e3");
    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.json()).toEqual({ error: "Faltan la persona o la fecha de devolución" });
  });

  it("criterio 5: un equipo que no existe responde 404 «No existe el equipo»", async () => {
    const { prestar } = await montar();
    const respuesta = await prestar("it", "no-existe", { persona: ana.email, devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it.each(["2026-02-30", "mañana", 20261120])(
    "criterio 6: la devolución %j responde 400 «La fecha de devolución no es válida» y el equipo sigue disponible",
    async (devolucion) => {
      const { almacen, prestar } = await montar();
      const respuesta = await prestar("it", "e3", { persona: ana.email, devolucion });
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "La fecha de devolución no es válida" });
      expect(await listarEquiposConEstado(almacen)).toContainEqual(disponible);
    },
  );

  it("criterio 7: un equipo reservado a otra persona responde 409 y su reserva no cambia", async () => {
    const { almacen, prestar } = await montar();
    const reserva = await solicitarEquipo(almacen, "e7", "luis.gomez@empresa.com", "2999-11-20");
    const respuesta = await prestar("it", "e7", { persona: ana.email, devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await listarEquiposConEstado(almacen)).toContainEqual(reserva);
  });

  it("un equipo ya prestado responde 409 y dos préstamos a la vez solo prestan una vez", async () => {
    const { almacen, prestar } = await montar();
    const respuestas = await Promise.all([
      prestar("it", "e3", { persona: ana.email, devolucion: "2026-11-20" }),
      prestar("it", "e3", { persona: "luis.gomez@empresa.com", devolucion: "2026-11-21" }),
    ]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(respuestas.find((r) => r.statusCode === 409)?.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await almacen.listar("prestamos_prestamos")).toHaveLength(1);
  });

  it("criterio 8: una cuenta que no es de IT recibe 403 «Solo IT puede hacer esto.» y el equipo sigue disponible", async () => {
    const { almacen, prestar } = await montar();
    const respuesta = await prestar("ana", "e3", { persona: ana.email, devolucion: "2026-11-20" });
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await listarEquiposConEstado(almacen)).toContainEqual(disponible);
  });

  it("sin token responde 401 «Inicia sesión con Google.»", async () => {
    const { almacen } = await montar();
    const app = await servidor(almacen);
    const respuesta = await app.inject({
      method: "POST",
      url: "/api/equipos/e3/prestamo",
      payload: { persona: ana.email, devolucion: "2026-11-20" },
    });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("prestarEquipo sin sesión responde 403", async () => {
    const { almacen } = await montar();
    await expect(prestarEquipo(almacen, "e3", null, ana.email, "2026-11-20")).rejects.toMatchObject({
      codigo: 403,
      message: "Solo IT puede hacer esto.",
    });
  });
});

describe("apuntar la devolución de un equipo (HU-PRE-04)", () => {
  const cuentas: Record<string, { email: string; nombre: string }> = {
    it: { email: "it.soporte@empresa.com", nombre: "IT" },
    ana: ana,
  };
  const montar = async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "e3", { id: "e3", nombre: "Monitor 03" });
    await almacen.guardar("equipos_equipos", "e7", { id: "e7", nombre: "Portátil 07" });
    const app = await crearServidor({
      googleClientId: "cliente-app",
      verificarToken: (token) => Promise.resolve(cuentas[token] ?? null),
      almacen,
      contextos: [equipos, rutas],
    });
    const devolver = (token: string, id: string) =>
      app.inject({ method: "POST", url: `/api/equipos/${id}/devolucion`, headers: { authorization: `Bearer ${token}` } });
    return { almacen, devolver };
  };

  beforeEach(() => {
    vi.stubEnv("CORREOS_IT", "it.soporte@empresa.com");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("criterio 1: IT apunta la devolución y el equipo queda disponible, sin persona ni devolución", async () => {
    const { almacen, devolver } = await montar();
    await prestarEquipo(almacen, "e3", { email: "it.soporte@empresa.com" }, ana.email, "2026-11-20");
    const respuesta = await devolver("it", "e3");
    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({ id: "e3", nombre: "Monitor 03", estado: "disponible" });
    expect(await listarEquiposConEstado(almacen)).toContainEqual({ id: "e3", nombre: "Monitor 03", estado: "disponible" });
    expect(await almacen.obtener("prestamos_activos", "e3")).toBeUndefined();
    expect(await almacen.listar("prestamos_prestamos")).toEqual([expect.objectContaining({ estado: "devuelto", persona: ana.email })]);
  });

  it("tras la devolución otra persona puede pedir el equipo", async () => {
    const { almacen, devolver } = await montar();
    await prestarEquipo(almacen, "e3", { email: "it.soporte@empresa.com" }, ana.email, "2026-11-20");
    await devolver("it", "e3");
    const equipo = await solicitarEquipo(almacen, "e3", "luis.gomez@empresa.com", "2999-11-20");
    expect(equipo.estado).toBe("reservado");
  });

  it("criterio 2: un equipo reservado responde 409 «El equipo no está prestado» y la reserva no cambia", async () => {
    const { almacen, devolver } = await montar();
    const reserva = await solicitarEquipo(almacen, "e7", "luis.gomez@empresa.com", "2999-11-20");
    const respuesta = await devolver("it", "e7");
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está prestado" });
    expect(await listarEquiposConEstado(almacen)).toContainEqual(reserva);
  });

  it("un equipo disponible responde 409 «El equipo no está prestado»", async () => {
    const { devolver } = await montar();
    const respuesta = await devolver("it", "e3");
    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.json()).toEqual({ error: "El equipo no está prestado" });
  });

  it("dos devoluciones a la vez solo se apuntan una vez", async () => {
    const { almacen, devolver } = await montar();
    await prestarEquipo(almacen, "e3", { email: "it.soporte@empresa.com" }, ana.email, "2026-11-20");
    const respuestas = await Promise.all([devolver("it", "e3"), devolver("it", "e3")]);
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([200, 409]);
  });

  it("criterio 3: un equipo que no existe responde 404 «No existe el equipo»", async () => {
    const { devolver } = await montar();
    const respuesta = await devolver("it", "no-existe");
    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json()).toEqual({ error: "No existe el equipo" });
  });

  it("criterio 4: una cuenta que no es de IT recibe 403 «Solo IT puede hacer esto.» y el equipo sigue prestado", async () => {
    const { almacen, devolver } = await montar();
    const prestado = await prestarEquipo(almacen, "e3", { email: "it.soporte@empresa.com" }, ana.email, "2026-11-20");
    const respuesta = await devolver("ana", "e3");
    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    expect(await listarEquiposConEstado(almacen)).toContainEqual(prestado);
  });

  it("sin token responde 401 «Inicia sesión con Google.»", async () => {
    const { almacen } = await montar();
    const app = await servidor(almacen);
    const respuesta = await app.inject({ method: "POST", url: "/api/equipos/e3/devolucion" });
    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
  });

  it("devolverEquipo sin sesión responde 403", async () => {
    const { almacen } = await montar();
    await expect(devolverEquipo(almacen, "e3", null)).rejects.toMatchObject({ codigo: 403, message: "Solo IT puede hacer esto." });
  });
});

describe("peticiones simultáneas sobre el mismo equipo (EN-PRE-01)", () => {
  const cuentas: Record<string, { email: string; nombre: string }> = {
    ana,
    luis: { email: "luis.gomez@empresa.com", nombre: "Luis" },
    it: { email: "it.soporte@empresa.com", nombre: "IT" },
  };
  const montar = async (idEquipo: string, nombre: string) => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", idEquipo, { id: idEquipo, nombre });
    const app = await crearServidor({
      googleClientId: "cliente-app",
      verificarToken: (token) => Promise.resolve(cuentas[token] ?? null),
      almacen,
      contextos: [equipos, rutas],
    });
    const enviar = (token: string, url: string, payload: object) =>
      app.inject({ method: "POST", url, headers: { authorization: `Bearer ${token}` }, payload });
    const solicitar = (token: string) => enviar(token, `/api/equipos/${idEquipo}/solicitud`, { devolucion: "2999-11-20" });
    const prestar = (persona: string) =>
      enviar("it", `/api/equipos/${idEquipo}/prestamo`, { persona, devolucion: "2999-11-20" });
    const equiposAhora = async () =>
      (await app.inject({ method: "GET", url: "/api/equipos", headers: { authorization: "Bearer it" } })).json<
        { id: string; estado: string; persona?: string }[]
      >();
    return { almacen, solicitar, prestar, equiposAhora };
  };
  const comprobarUnaSolaSalida = (respuestas: { statusCode: number; json: () => unknown }[]) => {
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(respuestas.find((r) => r.statusCode === 409)?.json()).toEqual({ error: "El equipo no está disponible" });
  };

  beforeEach(() => {
    vi.stubEnv("CORREOS_IT", "it.soporte@empresa.com");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("criterio 1: dos solicitudes a la vez, una 201 y otra 409, y el equipo queda reservado a una sola persona", async () => {
    const { almacen, solicitar, equiposAhora } = await montar("e7", "Portátil 07");
    const respuestas = await Promise.all([solicitar("ana"), solicitar("luis")]);
    comprobarUnaSolaSalida(respuestas);
    const ganadora = respuestas.find((r) => r.statusCode === 201)?.json<{ persona: string }>().persona;
    expect(await equiposAhora()).toEqual([
      { id: "e7", nombre: "Portátil 07", estado: "reservado", persona: ganadora, devolucion: "2999-11-20" },
    ]);
    expect(await almacen.listar("prestamos_prestamos")).toHaveLength(1);
  });

  it("criterio 2: una solicitud y un préstamo en el mostrador a la vez, nunca salen bien los dos", async () => {
    const { almacen, solicitar, prestar, equiposAhora } = await montar("e3", "Monitor 03");
    comprobarUnaSolaSalida(await Promise.all([solicitar("ana"), prestar("luis.gomez@empresa.com")]));
    expect(await almacen.listar("prestamos_prestamos")).toHaveLength(1);
    const lista = await equiposAhora();
    expect(lista).toHaveLength(1);
    expect(lista[0]?.id).toBe("e3");
    expect(["ana.perez@empresa.com", "luis.gomez@empresa.com"]).toContain(lista[0]?.persona);
  });

  it("criterio 2: el préstamo del mostrador y la solicitud a la vez, en el orden contrario, tampoco salen bien los dos", async () => {
    const { almacen, solicitar, prestar } = await montar("e3", "Monitor 03");
    comprobarUnaSolaSalida(await Promise.all([prestar("luis.gomez@empresa.com"), solicitar("ana")]));
    expect(await almacen.listar("prestamos_prestamos")).toHaveLength(1);
  });

  it("criterio 3: dos préstamos a la vez en el mostrador y GET /api/equipos lo muestra prestado a una sola persona", async () => {
    const { prestar, equiposAhora } = await montar("e2", "Proyector 02");
    const respuestas = await Promise.all([prestar(ana.email), prestar("luis.gomez@empresa.com")]);
    comprobarUnaSolaSalida(respuestas);
    const ganadora = respuestas.find((r) => r.statusCode === 201)?.json<{ persona: string }>().persona;
    expect(await equiposAhora()).toEqual([
      { id: "e2", nombre: "Proyector 02", estado: "prestado", persona: ganadora, devolucion: "2999-11-20" },
    ]);
  });

  it("muchas peticiones a la vez: solo una sale bien y las demás reciben 409", async () => {
    const { solicitar, prestar } = await montar("e2", "Proyector 02");
    const respuestas = await Promise.all([
      solicitar("ana"),
      solicitar("luis"),
      prestar("ana.perez@empresa.com"),
      prestar("luis.gomez@empresa.com"),
      solicitar("it"),
    ]);
    expect(respuestas.filter((r) => r.statusCode === 201)).toHaveLength(1);
    expect(respuestas.filter((r) => r.statusCode === 409)).toHaveLength(4);
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
