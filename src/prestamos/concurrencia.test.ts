import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { COLECCION_ESTADOS } from "./estados.js";
import { rutas } from "./index.js";
import { COLECCION_PRESTAMOS, type PrestamoGuardado } from "./solicitud.js";

const IT = "it@empresa.com";
const LUIS = "luis.garcia@empresa.com";
const MARTA = "marta.ruiz@empresa.com";

async function servidor(almacen: Almacen, email: string): Promise<FastifyInstance> {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _reply, hecho) => {
    request.persona = { email, nombre: email };
    hecho();
  });
  await app.register(rutas, { almacen });
  await app.ready();
  return app;
}

async function darDeAlta(almacen: Almacen, id: string, nombre: string): Promise<void> {
  await almacen.guardar("equipos_equipos", id, { id, nombre, estado: "disponible" });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("peticiones simultáneas sobre el mismo equipo", () => {
  it("dos solicitudes a la vez: una reserva el equipo y la otra recibe 409", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-06T10:00:00+01:00") });
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Portátil 07");
    const [appLuis, appMarta] = await Promise.all([servidor(almacen, LUIS), servidor(almacen, MARTA)]);
    const cuerpo = { devolucion: "2026-11-20" };
    const [r1, r2] = await Promise.all([
      appLuis.inject({ method: "POST", url: "/api/equipos/e1/solicitud", payload: cuerpo }),
      appMarta.inject({ method: "POST", url: "/api/equipos/e1/solicitud", payload: cuerpo }),
    ]);

    const respuestas = [r1, r2];
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    const perdedora = respuestas.find((r) => r.statusCode === 409);
    expect(perdedora?.json()).toEqual({ error: "El equipo no está disponible" });
    const ganadora = respuestas.find((r) => r.statusCode === 201);
    const prestamos = await almacen.listar<PrestamoGuardado>(COLECCION_PRESTAMOS);
    expect(prestamos).toHaveLength(1);
    expect(ganadora?.json()).toMatchObject({ estado: "reservado", persona: prestamos[0]?.persona });
  });

  it("una solicitud y un préstamo en el mostrador a la vez: solo uno sale bien", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-06T10:00:00+01:00") });
    vi.stubEnv("CORREOS_IT", IT);
    const almacen = almacenEnMemoria();
    await darDeAlta(almacen, "e1", "Monitor 03");
    const [appLuis, appIt] = await Promise.all([servidor(almacen, LUIS), servidor(almacen, IT)]);
    const [solicitud, prestamo] = await Promise.all([
      appLuis.inject({ method: "POST", url: "/api/equipos/e1/solicitud", payload: { devolucion: "2026-11-20" } }),
      appIt.inject({
        method: "POST",
        url: "/api/equipos/e1/prestamo",
        payload: { persona: MARTA, devolucion: "2026-11-20" },
      }),
    ]);

    const respuestas = [solicitud, prestamo];
    expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    expect(respuestas.find((r) => r.statusCode === 409)?.json()).toEqual({ error: "El equipo no está disponible" });
    expect(await almacen.listar(COLECCION_PRESTAMOS)).toHaveLength(1);
    expect(await almacen.obtener(COLECCION_ESTADOS, "e1")).toBeDefined();
  });
});
