// HU-ACC-02: las operaciones de IT son de las cuentas de CORREOS_IT, sin distinguir mayúsculas, y la cuenta
// de servicio del inventario también puede hacer lo de un empleado.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { tokenDeCabecera } from "../../lib/auth.js";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { rutas } from "./index.js";
import type { PrestamoActivo } from "./prestamos.js";

const PERSONAS: Record<string, { email: string; nombre: string }> = {
  tecnico: { email: "IT.Soporte@empresa.com", nombre: "IT" },
  inventario: { email: "inventario@empresa.com", nombre: "inventario@empresa.com" },
  luis: { email: "luis.gomez@empresa.com", nombre: "Luis" },
};
const verificarToken = (token: string) => Promise.resolve(PERSONAS[token] ?? null);

const anteriores = process.env.CORREOS_IT;
let app: FastifyInstance;
let almacen: Almacen;

beforeEach(async () => {
  process.env.CORREOS_IT = "it.soporte@empresa.com,inventario@empresa.com";
  almacen = almacenEnMemoria();
  app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", async (request, reply) => {
    const persona = await verificarToken(tokenDeCabecera(request.headers.authorization) ?? "");
    if (!persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    request.persona = persona;
  });
  await app.register(rutas, { almacen });
});

afterEach(async () => {
  await app.close();
  if (anteriores === undefined) delete process.env.CORREOS_IT;
  else process.env.CORREOS_IT = anteriores;
});

async function equipo(nombre: string): Promise<string> {
  const id = `id-${nombre}`;
  await almacen.guardar("equipos_equipos", id, { id, nombre });
  return id;
}

const pedir = (url: string, token: string, cuerpo?: object) =>
  app.inject({ method: "POST", url, headers: { authorization: `Bearer ${token}` }, ...(cuerpo ? { payload: cuerpo } : {}) });

describe("cuentas de IT en las rutas de préstamos", () => {
  it("la cuenta de servicio del inventario pide un equipo y queda reservado a su correo", async () => {
    const monitor = await equipo("Monitor 05");
    const respuesta = await pedir(`/api/equipos/${monitor}/solicitud`, "inventario", { devolucion: "2999-11-20" });
    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.json()).toEqual({
      id: monitor,
      nombre: "Monitor 05",
      estado: "reservado",
      persona: "inventario@empresa.com",
      devolucion: "2999-11-20",
    });
    expect(await almacen.obtener<PrestamoActivo>("prestamos_activos", monitor)).toMatchObject({ persona: "inventario@empresa.com" });
  });

  it("un técnico con el correo en otras mayúsculas presta, entrega y devuelve", async () => {
    const monitor = await equipo("Monitor 05");
    const prestamo = await pedir(`/api/equipos/${monitor}/prestamo`, "tecnico", { persona: "ana.perez@empresa.com", devolucion: "2999-11-20" });
    expect(prestamo.statusCode).toBe(201);
    const devolucion = await pedir(`/api/equipos/${monitor}/devolucion`, "tecnico");
    expect(devolucion.statusCode).toBe(200);
    expect(devolucion.json()).toEqual({ id: monitor, nombre: "Monitor 05", estado: "disponible" });
  });

  it("un empleado recibe 403 «Solo IT puede hacer esto.» en prestamo, entrega, devolución, vencidos e historial", async () => {
    const monitor = await equipo("Monitor 03");
    const respuestas = await Promise.all([
      pedir(`/api/equipos/${monitor}/prestamo`, "luis", { persona: "ana.perez@empresa.com", devolucion: "2999-11-20" }),
      pedir(`/api/equipos/${monitor}/entrega`, "luis"),
      pedir(`/api/equipos/${monitor}/devolucion`, "luis"),
      app.inject({ method: "GET", url: "/api/prestamos/vencidos", headers: { authorization: "Bearer luis" } }),
      app.inject({ method: "GET", url: `/api/equipos/${monitor}/historial`, headers: { authorization: "Bearer luis" } }),
    ]);
    for (const respuesta of respuestas) {
      expect(respuesta.statusCode).toBe(403);
      expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
    }
    expect(await almacen.obtener("prestamos_activos", monitor)).toBeUndefined();
  });

  it("un empleado puede ver los equipos y pedir uno", async () => {
    const monitor = await equipo("Monitor 03");
    const lista = await app.inject({ method: "GET", url: "/api/equipos", headers: { authorization: "Bearer luis" } });
    expect(lista.statusCode).toBe(200);
    const solicitud = await pedir(`/api/equipos/${monitor}/solicitud`, "luis", { devolucion: "2999-11-20" });
    expect(solicitud.statusCode).toBe(201);
  });
});
