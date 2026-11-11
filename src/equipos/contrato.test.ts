// Pruebas de contrato (EN-ACC-01): la operación de equipos del anexo de la API, comprobada contra
// spec/contextos/equipos/api.openapi.json: ruta, códigos, campos y mensajes de error.
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { crearServidor } from "../../app/server.js";
import { almacenEnMemoria } from "../../lib/datos.js";
import { rutas } from "./index.js";

interface Respuesta {
  content?: { "application/json": { schema: { $ref: string }; example: Record<string, unknown> } };
}
interface Esquema {
  required?: string[];
  properties: Record<string, { type: string; const?: string }>;
}
interface Contrato {
  paths: Record<string, Record<string, { responses: Record<string, Respuesta> }>>;
  components: { schemas: Record<string, Esquema> };
}

const contrato = JSON.parse(readFileSync(new URL("../../spec/contextos/equipos/api.openapi.json", import.meta.url), "utf8")) as Contrato;
const operacion = contrato.paths["/api/equipos"]?.["post"];
if (!operacion) throw new Error("El contrato debe definir POST /api/equipos");

/** El esquema de la respuesta con ese código, según el contrato. */
function esquemaDe(codigo: string): Esquema {
  const ref = operacion?.responses[codigo]?.content?.["application/json"].schema.$ref;
  const esquema = ref ? contrato.components.schemas[ref.split("/").pop() ?? ""] : undefined;
  if (!esquema) throw new Error(`El contrato no define el cuerpo de la respuesta ${codigo}`);
  return esquema;
}

/** El mensaje de error de ejemplo de la respuesta con ese código, según el contrato. */
function errorDe(codigo: string): string {
  return String(operacion?.responses[codigo]?.content?.["application/json"].example["error"]);
}

/** Comprueba que el cuerpo tiene exactamente los campos del esquema, con su tipo y su valor fijo. */
function cumpleEsquema(cuerpo: Record<string, unknown>, esquema: Esquema): void {
  for (const campo of esquema.required ?? []) expect(cuerpo, `falta el campo «${campo}»`).toHaveProperty(campo);
  expect(Object.keys(cuerpo).sort()).toEqual(Object.keys(esquema.properties).sort());
  for (const [campo, definicion] of Object.entries(esquema.properties)) {
    expect(typeof cuerpo[campo], `tipo del campo «${campo}»`).toBe(definicion.type);
    if (definicion.const !== undefined) expect(cuerpo[campo]).toBe(definicion.const);
  }
}

describe("contrato de POST /api/equipos", () => {
  afterEach(() => {
    delete process.env["CORREOS_IT"];
  });

  async function servidor() {
    process.env["CORREOS_IT"] = "it@empresa.com";
    const app = await crearServidor({
      googleClientId: "cliente",
      verificarToken: (token) =>
        Promise.resolve(
          token === "it" ? { email: "it@empresa.com", nombre: "IT" } : token === "ana" ? { email: "ana@empresa.com", nombre: "Ana" } : null,
        ),
      almacen: almacenEnMemoria(),
      contextos: [rutas],
    });
    const enviar = (token: string | undefined, payload?: object) =>
      app.inject({
        method: "POST",
        url: "/api/equipos",
        headers: token ? { authorization: `Bearer ${token}` } : {},
        payload,
      });
    return enviar;
  }

  it("el contrato declara los códigos 201, 400, 401, 403 y 409", () => {
    expect(Object.keys(operacion.responses).sort()).toEqual(["201", "400", "401", "403", "409"]);
  });

  it("201: devuelve id, nombre y estado «disponible» como dice el contrato", async () => {
    const respuesta = await (await servidor())("it", { nombre: "Portátil 07" });
    expect(respuesta.statusCode).toBe(201);
    const cuerpo = respuesta.json<Record<string, unknown>>();
    cumpleEsquema(cuerpo, esquemaDe("201"));
    expect(cuerpo["nombre"]).toBe("Portátil 07");
  });

  it("400: un nombre vacío o ausente da el error del contrato", async () => {
    const enviar = await servidor();
    for (const cuerpo of [{ nombre: "" }, { nombre: "   " }, {}]) {
      const respuesta = await enviar("it", cuerpo);
      expect(respuesta.statusCode).toBe(400);
      const error = respuesta.json<Record<string, unknown>>();
      cumpleEsquema(error, esquemaDe("400"));
      expect(error["error"]).toBe(errorDe("400"));
    }
  });

  it("401: sin token o con un token no válido da el error del contrato", async () => {
    const enviar = await servidor();
    for (const token of [undefined, "falso"]) {
      const respuesta = await enviar(token, { nombre: "Portátil 07" });
      expect(respuesta.statusCode).toBe(401);
      const error = respuesta.json<Record<string, unknown>>();
      cumpleEsquema(error, esquemaDe("401"));
      expect(error["error"]).toBe(errorDe("401"));
    }
  });

  it("403: una cuenta que no es de IT da el error del contrato y no crea el equipo", async () => {
    const enviar = await servidor();
    const respuesta = await enviar("ana", { nombre: "Portátil 07" });
    expect(respuesta.statusCode).toBe(403);
    const error = respuesta.json<Record<string, unknown>>();
    cumpleEsquema(error, esquemaDe("403"));
    expect(error["error"]).toBe(errorDe("403"));
    // El mismo nombre sigue libre: el alta de IT no da 409.
    expect((await enviar("it", { nombre: "Portátil 07" })).statusCode).toBe(201);
  });

  it("409: un nombre repetido da el error del contrato", async () => {
    const enviar = await servidor();
    await enviar("it", { nombre: "Portátil 07" });
    const respuesta = await enviar("it", { nombre: " PORTÁTIL 07 " });
    expect(respuesta.statusCode).toBe(409);
    const error = respuesta.json<Record<string, unknown>>();
    cumpleEsquema(error, esquemaDe("409"));
    expect(error["error"]).toBe(errorDe("409"));
  });

  it("falla si un campo de la respuesta cambia de nombre (detecta un cambio incompatible)", () => {
    const renombrado = { id: "1", nombre: "Portátil 07", estadoActual: "disponible" };
    expect(() => {
      cumpleEsquema(renombrado, esquemaDe("201"));
    }).toThrow();
  });
});
