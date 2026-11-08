import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { almacenEnMemoria, type Almacen } from "../../lib/datos.js";
import { listarEquipos, obtenerEquipo, rutas } from "./index.js";

const IT = { email: "it@empresa.com", nombre: "IT" };
const EMPLEADA = { email: "ana.perez@empresa.com", nombre: "Ana" };

let antes: string | undefined;
beforeEach(() => {
  antes = process.env["CORREOS_IT"];
  process.env["CORREOS_IT"] = "it@empresa.com";
});
afterEach(() => {
  if (antes === undefined) delete process.env["CORREOS_IT"];
  else process.env["CORREOS_IT"] = antes;
});

async function servidor(persona: { email: string; nombre: string } | null, almacen: Almacen): Promise<FastifyInstance> {
  const app = Fastify();
  app.decorateRequest("persona", null);
  app.addHook("onRequest", (request, _reply, hecho) => {
    request.persona = persona;
    hecho();
  });
  await app.register(rutas, { almacen });
  return app;
}

describe("POST /api/equipos", () => {
  it("da de alta un equipo disponible y lo deja en el almacén", async () => {
    const almacen = almacenEnMemoria();
    const app = await servidor(IT, almacen);
    try {
      const respuesta = await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre: "Portátil 07" } });
      expect(respuesta.statusCode).toBe(201);
      const cuerpo = respuesta.json<{ id: string; nombre: string; estado: string }>();
      expect(cuerpo).toEqual({ id: expect.any(String) as string, nombre: "Portátil 07", estado: "disponible" });
      expect(await obtenerEquipo(almacen, cuerpo.id)).toMatchObject({ id: cuerpo.id, nombre: "Portátil 07" });
    } finally {
      await app.close();
    }
  });

  it("guarda el nombre sin los espacios de alrededor", async () => {
    const app = await servidor(IT, almacenEnMemoria());
    try {
      const respuesta = await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre: "  Monitor 03 " } });
      expect(respuesta.statusCode).toBe(201);
      expect(respuesta.json<{ nombre: string }>().nombre).toBe("Monitor 03");
    } finally {
      await app.close();
    }
  });

  it.each([{ nombre: "" }, { nombre: "   " }, {}, { nombre: 7 }])(
    "con el cuerpo %j responde 400 «Falta el nombre del equipo» y no crea nada",
    async (payload) => {
      const almacen = almacenEnMemoria();
      const app = await servidor(IT, almacen);
      try {
        const respuesta = await app.inject({ method: "POST", url: "/api/equipos", payload });
        expect(respuesta.statusCode).toBe(400);
        expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
        expect(await listarEquipos(almacen)).toEqual([]);
      } finally {
        await app.close();
      }
    },
  );

  it("sin cuerpo responde 400 «Falta el nombre del equipo»", async () => {
    const app = await servidor(IT, almacenEnMemoria());
    try {
      const respuesta = await app.inject({ method: "POST", url: "/api/equipos" });
      expect(respuesta.statusCode).toBe(400);
      expect(respuesta.json()).toEqual({ error: "Falta el nombre del equipo" });
    } finally {
      await app.close();
    }
  });

  it("un nombre igual en minúsculas y con espacios responde 409 y no crea un segundo equipo", async () => {
    const almacen = almacenEnMemoria();
    const app = await servidor(IT, almacen);
    try {
      await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre: "Portátil 07" } });
      const respuesta = await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre: " portátil 07 " } });
      expect(respuesta.statusCode).toBe(409);
      expect(respuesta.json()).toEqual({ error: "Ya hay un equipo con ese nombre" });
      expect(await listarEquipos(almacen)).toHaveLength(1);
    } finally {
      await app.close();
    }
  });

  it("dos altas a la vez del mismo nombre crean un solo equipo", async () => {
    const almacen = almacenEnMemoria();
    const app = await servidor(IT, almacen);
    try {
      const respuestas = await Promise.all(
        ["Proyector 01", "proyector 01"].map((nombre) => app.inject({ method: "POST", url: "/api/equipos", payload: { nombre } })),
      );
      expect(respuestas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
      expect(await listarEquipos(almacen)).toHaveLength(1);
    } finally {
      await app.close();
    }
  });

  it("un nombre con «/» o «..» se da de alta sin romper el almacén", async () => {
    const almacen = almacenEnMemoria();
    const app = await servidor(IT, almacen);
    try {
      for (const nombre of ["Sala/2", ".."]) {
        const respuesta = await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre } });
        expect(respuesta.statusCode).toBe(201);
      }
      expect(await listarEquipos(almacen)).toHaveLength(2);
    } finally {
      await app.close();
    }
  });

  it("una cuenta que no es de IT recibe 403 «Solo IT puede hacer esto.» y no crea nada", async () => {
    const almacen = almacenEnMemoria();
    const app = await servidor(EMPLEADA, almacen);
    try {
      const respuesta = await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre: "Portátil 07" } });
      expect(respuesta.statusCode).toBe(403);
      expect(respuesta.json()).toEqual({ error: "Solo IT puede hacer esto." });
      expect(await listarEquipos(almacen)).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it("sin sesión responde 401 «Inicia sesión con Google.»", async () => {
    const app = await servidor(null, almacenEnMemoria());
    try {
      const respuesta = await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre: "Portátil 07" } });
      expect(respuesta.statusCode).toBe(401);
      expect(respuesta.json()).toEqual({ error: "Inicia sesión con Google." });
    } finally {
      await app.close();
    }
  });
});

describe("lectura para otros contextos", () => {
  it("obtenerEquipo devuelve undefined si el equipo no existe", async () => {
    expect(await obtenerEquipo(almacenEnMemoria(), "no-existe")).toBeUndefined();
  });

  it("listarEquipos devuelve los equipos dados de alta, por nombre", async () => {
    const almacen = almacenEnMemoria();
    const app = await servidor(IT, almacen);
    try {
      for (const nombre of ["Monitor 03", "Portátil 07"]) {
        await app.inject({ method: "POST", url: "/api/equipos", payload: { nombre } });
      }
      const equipos = await listarEquipos(almacen);
      expect(equipos.map((e) => e.nombre)).toEqual(["Monitor 03", "Portátil 07"]);
    } finally {
      await app.close();
    }
  });
});
