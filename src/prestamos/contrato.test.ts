// Pruebas de contrato (EN-ACC-01): las ocho operaciones del anexo de la API, comprobadas contra
// spec/contextos/prestamos/api.openapi.json: ruta, códigos, campos y mensajes de error.
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { crearServidor } from "../../app/server.js";
import { almacenEnMemoria } from "../../lib/datos.js";
import { rutas } from "./index.js";

interface Esquema {
  $ref?: string;
  type?: string;
  enum?: string[];
  pattern?: string;
  required?: string[];
  properties?: Record<string, Esquema>;
  items?: Esquema;
}
interface Contenido {
  schema: Esquema;
  example?: { error: string };
  examples?: Record<string, { value: { error: string } }>;
}
interface Respuesta {
  $ref?: string;
  content?: { "application/json": Contenido };
}
interface Contrato {
  paths: Record<string, Record<string, { operationId: string; responses: Record<string, Respuesta> }>>;
  components: { schemas: Record<string, Esquema>; responses: Record<string, Respuesta> };
}

const contrato = JSON.parse(readFileSync(new URL("../../spec/contextos/prestamos/api.openapi.json", import.meta.url), "utf8")) as Contrato;

function referencia(ref: string): string {
  return ref.split("/").pop() ?? "";
}

function esquemaDe(esquema: Esquema): Esquema {
  if (!esquema.$ref) return esquema;
  const resuelto = contrato.components.schemas[referencia(esquema.$ref)];
  if (!resuelto) throw new Error(`El contrato no define ${esquema.$ref}`);
  return resuelto;
}

function respuestaDe(ruta: string, metodo: string, codigo: string): Contenido {
  const declarada = contrato.paths[ruta]?.[metodo]?.responses[codigo];
  if (!declarada) throw new Error(`El contrato no define ${metodo.toUpperCase()} ${ruta} ${codigo}`);
  const respuesta = declarada.$ref ? contrato.components.responses[referencia(declarada.$ref)] : declarada;
  const contenido = respuesta?.content?.["application/json"];
  if (!contenido) throw new Error(`El contrato no define el cuerpo de ${metodo.toUpperCase()} ${ruta} ${codigo}`);
  return contenido;
}

/** Los mensajes de error que el contrato da para esa respuesta. */
function mensajesDe(ruta: string, metodo: string, codigo: string): string[] {
  const contenido = respuestaDe(ruta, metodo, codigo);
  if (contenido.example) return [contenido.example.error];
  return Object.values(contenido.examples ?? {}).map((ejemplo) => ejemplo.value.error);
}

/** Comprueba que el valor cumple el esquema: campos obligatorios, sin campos de más, tipo, valores y formato. */
function cumple(valor: unknown, esquema: Esquema, donde = "cuerpo"): void {
  const definicion = esquemaDe(esquema);
  if (definicion.type === "array") {
    expect(Array.isArray(valor), `${donde} debe ser una lista`).toBe(true);
    for (const elemento of valor as unknown[]) cumple(elemento, definicion.items ?? {}, `${donde}[]`);
    return;
  }
  if (definicion.type === "object") {
    const objeto = valor as Record<string, unknown>;
    const propiedades = definicion.properties ?? {};
    for (const campo of definicion.required ?? []) expect(objeto, `${donde}: falta el campo «${campo}»`).toHaveProperty(campo);
    for (const [campo, contenido] of Object.entries(objeto)) {
      const propiedad = propiedades[campo];
      expect(propiedad, `${donde}: el campo «${campo}» no está en el contrato`).toBeDefined();
      if (propiedad) cumple(contenido, propiedad, `${donde}.${campo}`);
    }
    return;
  }
  expect(typeof valor, `${donde}: tipo`).toBe(definicion.type);
  if (definicion.enum) expect(definicion.enum, `${donde}: valor`).toContain(valor);
  if (definicion.pattern) expect(valor as string, `${donde}: formato`).toMatch(new RegExp(definicion.pattern));
}

const IT = "it@empresa.com";
const ANA = "ana@empresa.com";
const FUTURA = "2099-01-01";

async function servidor() {
  process.env["CORREOS_IT"] = IT;
  const almacen = almacenEnMemoria();
  for (const [id, nombre] of [
    ["pc-01", "Portátil 01"],
    ["pc-02", "Portátil 02"],
  ] as const) {
    await almacen.guardar("equipos_equipos", id, { id, nombre });
  }
  const app = await crearServidor({
    googleClientId: "cliente",
    verificarToken: (token) =>
      Promise.resolve(token === "it" ? { email: IT, nombre: "IT" } : token === "ana" ? { email: ANA, nombre: "Ana" } : null),
    almacen,
    contextos: [rutas],
  });
  return (metodo: "GET" | "POST", url: string, token: string | undefined, payload?: object) =>
    app.inject({ method: metodo, url, headers: token ? { authorization: `Bearer ${token}` } : {}, payload });
}

type Enviar = Awaited<ReturnType<typeof servidor>>;

/** Comprueba el código, el cuerpo según el contrato y, si es un error, su mensaje. */
function esperarError(respuesta: { statusCode: number; json: () => unknown }, ruta: string, metodo: string, codigo: number, mensaje: string) {
  expect(respuesta.statusCode).toBe(codigo);
  cumple(respuesta.json(), respuestaDe(ruta, metodo, String(codigo)).schema);
  expect(mensajesDe(ruta, metodo, String(codigo))).toContain(mensaje);
  expect(respuesta.json()).toEqual({ error: mensaje });
}

function esperarExito(respuesta: { statusCode: number; json: () => unknown }, ruta: string, metodo: string, codigo: number) {
  expect(respuesta.statusCode).toBe(codigo);
  cumple(respuesta.json(), respuestaDe(ruta, metodo, String(codigo)).schema);
  return respuesta.json() as Record<string, unknown>;
}

const SIN_SESION = "Inicia sesión con Google.";
const SOLO_IT = "Solo IT puede hacer esto.";
const NO_EXISTE = "No existe el equipo";
const NO_DISPONIBLE = "El equipo no está disponible";

afterEach(() => {
  delete process.env["CORREOS_IT"];
});

describe("el contrato de préstamos", () => {
  it("declara las ocho operaciones del anexo con sus códigos", () => {
    const declarado = Object.entries(contrato.paths).flatMap(([ruta, metodos]) =>
      Object.entries(metodos).map(([metodo, operacion]) => `${metodo.toUpperCase()} ${ruta} ${Object.keys(operacion.responses).sort().join(",")}`),
    );
    expect(declarado.sort()).toEqual(
      [
        "GET /api/equipos 200,401",
        "POST /api/equipos/{id}/solicitud 201,400,401,404,409",
        "POST /api/equipos/{id}/entrega 200,401,403,404,409",
        "POST /api/equipos/{id}/prestamo 201,400,401,403,404,409",
        "POST /api/equipos/{id}/devolucion 200,401,403,404,409",
        "GET /api/prestamos/vencidos 200,401,403",
        "GET /api/equipos/{id}/historial 200,401,403,404",
      ].sort(),
    );
  });

  it("falla si un campo de la respuesta cambia de nombre (devolucion → fechaDevolucion)", () => {
    const renombrado = { id: "pc-01", nombre: "Portátil 01", estado: "reservado", persona: ANA, fechaDevolucion: FUTURA };
    expect(() => {
      cumple([renombrado], respuestaDe("/api/equipos", "get", "200").schema);
    }).toThrow();
  });
});

describe("contrato de GET /api/equipos (Ver los equipos)", () => {
  const ruta = "/api/equipos";

  it("200: lista cada equipo con id, nombre y estado, y persona y devolucion si está reservado", async () => {
    const enviar = await servidor();
    await enviar("POST", "/api/equipos/pc-02/solicitud", "ana", { devolucion: FUTURA });
    const lista = esperarExito(await enviar("GET", ruta, "ana"), ruta, "get", 200) as unknown as Record<string, unknown>[];
    expect(lista).toEqual([
      { id: "pc-01", nombre: "Portátil 01", estado: "disponible" },
      { id: "pc-02", nombre: "Portátil 02", estado: "reservado", persona: ANA, devolucion: FUTURA },
    ]);
  });

  it("401: sin token o con un token no válido", async () => {
    const enviar = await servidor();
    for (const token of [undefined, "falso"]) esperarError(await enviar("GET", ruta, token), ruta, "get", 401, SIN_SESION);
  });
});

describe("contrato de POST /api/equipos/{id}/solicitud (Pedir un equipo)", () => {
  const ruta = "/api/equipos/{id}/solicitud";
  const url = (id: string) => `/api/equipos/${id}/solicitud`;

  it("201: el equipo queda reservado a nombre de quien lo pide", async () => {
    const enviar = await servidor();
    const equipo = esperarExito(await enviar("POST", url("pc-01"), "ana", { devolucion: FUTURA }), ruta, "post", 201);
    expect(equipo).toEqual({ id: "pc-01", nombre: "Portátil 01", estado: "reservado", persona: ANA, devolucion: FUTURA });
  });

  it("400: falta, no es válida o ya ha pasado la fecha de devolución", async () => {
    const enviar = await servidor();
    esperarError(await enviar("POST", url("pc-01"), "ana", {}), ruta, "post", 400, "Falta la fecha de devolución");
    esperarError(await enviar("POST", url("pc-01"), "ana", { devolucion: "2026-02-30" }), ruta, "post", 400, "La fecha de devolución no es válida");
    esperarError(await enviar("POST", url("pc-01"), "ana", { devolucion: "2020-01-01" }), ruta, "post", 400, "La fecha de devolución ya ha pasado");
  });

  it("401: sin token", async () => {
    const enviar = await servidor();
    esperarError(await enviar("POST", url("pc-01"), undefined, { devolucion: FUTURA }), ruta, "post", 401, SIN_SESION);
  });

  it("404: el equipo no existe", async () => {
    const enviar = await servidor();
    esperarError(await enviar("POST", url("no-existe"), "ana", { devolucion: FUTURA }), ruta, "post", 404, NO_EXISTE);
  });

  it("409: el equipo ya está reservado", async () => {
    const enviar = await servidor();
    await enviar("POST", url("pc-01"), "ana", { devolucion: FUTURA });
    esperarError(await enviar("POST", url("pc-01"), "ana", { devolucion: FUTURA }), ruta, "post", 409, NO_DISPONIBLE);
  });
});

describe("contrato de POST /api/equipos/{id}/entrega (Entregar un equipo reservado)", () => {
  const ruta = "/api/equipos/{id}/entrega";
  const url = (id: string) => `/api/equipos/${id}/entrega`;

  async function conReserva(): Promise<Enviar> {
    const enviar = await servidor();
    await enviar("POST", "/api/equipos/pc-01/solicitud", "ana", { devolucion: FUTURA });
    return enviar;
  }

  it("200: el equipo queda prestado con la persona y la devolucion de la solicitud", async () => {
    const enviar = await conReserva();
    const equipo = esperarExito(await enviar("POST", url("pc-01"), "it"), ruta, "post", 200);
    expect(equipo).toEqual({ id: "pc-01", nombre: "Portátil 01", estado: "prestado", persona: ANA, devolucion: FUTURA });
  });

  it("401: sin token", async () => {
    const enviar = await conReserva();
    esperarError(await enviar("POST", url("pc-01"), undefined), ruta, "post", 401, SIN_SESION);
  });

  it("403: una cuenta que no es de IT", async () => {
    const enviar = await conReserva();
    esperarError(await enviar("POST", url("pc-01"), "ana"), ruta, "post", 403, SOLO_IT);
  });

  it("404: el equipo no existe", async () => {
    const enviar = await conReserva();
    esperarError(await enviar("POST", url("no-existe"), "it"), ruta, "post", 404, NO_EXISTE);
  });

  it("409: el equipo no está reservado", async () => {
    const enviar = await conReserva();
    esperarError(await enviar("POST", url("pc-02"), "it"), ruta, "post", 409, "El equipo no está reservado");
  });
});

describe("contrato de POST /api/equipos/{id}/prestamo (Prestar en el mostrador)", () => {
  const ruta = "/api/equipos/{id}/prestamo";
  const url = (id: string) => `/api/equipos/${id}/prestamo`;
  const cuerpo = { persona: ANA, devolucion: FUTURA };

  it("201: el equipo queda prestado a la persona con su devolucion", async () => {
    const enviar = await servidor();
    const equipo = esperarExito(await enviar("POST", url("pc-01"), "it", cuerpo), ruta, "post", 201);
    expect(equipo).toEqual({ id: "pc-01", nombre: "Portátil 01", estado: "prestado", persona: ANA, devolucion: FUTURA });
  });

  it("400: faltan la persona o la fecha, o la fecha no es válida", async () => {
    const enviar = await servidor();
    esperarError(await enviar("POST", url("pc-01"), "it", { devolucion: FUTURA }), ruta, "post", 400, "Faltan la persona o la fecha de devolución");
    esperarError(await enviar("POST", url("pc-01"), "it", { persona: ANA }), ruta, "post", 400, "Faltan la persona o la fecha de devolución");
    esperarError(await enviar("POST", url("pc-01"), "it", { persona: ANA, devolucion: "2026-13-01" }), ruta, "post", 400, "La fecha de devolución no es válida");
  });

  it("401: sin token", async () => {
    const enviar = await servidor();
    esperarError(await enviar("POST", url("pc-01"), undefined, cuerpo), ruta, "post", 401, SIN_SESION);
  });

  it("403: una cuenta que no es de IT", async () => {
    const enviar = await servidor();
    esperarError(await enviar("POST", url("pc-01"), "ana", cuerpo), ruta, "post", 403, SOLO_IT);
  });

  it("404: el equipo no existe", async () => {
    const enviar = await servidor();
    esperarError(await enviar("POST", url("no-existe"), "it", cuerpo), ruta, "post", 404, NO_EXISTE);
  });

  it("409: el equipo ya está prestado", async () => {
    const enviar = await servidor();
    await enviar("POST", url("pc-01"), "it", cuerpo);
    esperarError(await enviar("POST", url("pc-01"), "it", cuerpo), ruta, "post", 409, NO_DISPONIBLE);
  });
});

describe("contrato de POST /api/equipos/{id}/devolucion (Apuntar la devolución)", () => {
  const ruta = "/api/equipos/{id}/devolucion";
  const url = (id: string) => `/api/equipos/${id}/devolucion`;

  async function conPrestamo(): Promise<Enviar> {
    const enviar = await servidor();
    await enviar("POST", "/api/equipos/pc-01/prestamo", "it", { persona: ANA, devolucion: FUTURA });
    return enviar;
  }

  it("200: el equipo queda disponible, sin persona ni devolucion", async () => {
    const enviar = await conPrestamo();
    const equipo = esperarExito(await enviar("POST", url("pc-01"), "it"), ruta, "post", 200);
    expect(equipo).toEqual({ id: "pc-01", nombre: "Portátil 01", estado: "disponible" });
  });

  it("401: sin token", async () => {
    const enviar = await conPrestamo();
    esperarError(await enviar("POST", url("pc-01"), undefined), ruta, "post", 401, SIN_SESION);
  });

  it("403: una cuenta que no es de IT", async () => {
    const enviar = await conPrestamo();
    esperarError(await enviar("POST", url("pc-01"), "ana"), ruta, "post", 403, SOLO_IT);
  });

  it("404: el equipo no existe", async () => {
    const enviar = await conPrestamo();
    esperarError(await enviar("POST", url("no-existe"), "it"), ruta, "post", 404, NO_EXISTE);
  });

  it("409: el equipo no está prestado", async () => {
    const enviar = await conPrestamo();
    esperarError(await enviar("POST", url("pc-02"), "it"), ruta, "post", 409, "El equipo no está prestado");
  });
});

describe("contrato de GET /api/prestamos/vencidos (Ver los préstamos vencidos)", () => {
  const ruta = "/api/prestamos/vencidos";

  it("200: lista id, nombre, persona y devolucion de los prestados con la fecha pasada, del más antiguo al más reciente", async () => {
    const enviar = await servidor();
    await enviar("POST", "/api/equipos/pc-01/prestamo", "it", { persona: ANA, devolucion: "2020-03-01" });
    await enviar("POST", "/api/equipos/pc-02/prestamo", "it", { persona: IT, devolucion: "2020-01-01" });
    const lista = esperarExito(await enviar("GET", ruta, "it"), ruta, "get", 200) as unknown as Record<string, unknown>[];
    expect(lista).toEqual([
      { id: "pc-02", nombre: "Portátil 02", persona: IT, devolucion: "2020-01-01" },
      { id: "pc-01", nombre: "Portátil 01", persona: ANA, devolucion: "2020-03-01" },
    ]);
  });

  it("401: sin token", async () => {
    const enviar = await servidor();
    esperarError(await enviar("GET", ruta, undefined), ruta, "get", 401, SIN_SESION);
  });

  it("403: una cuenta que no es de IT", async () => {
    const enviar = await servidor();
    esperarError(await enviar("GET", ruta, "ana"), ruta, "get", 403, SOLO_IT);
  });
});

describe("contrato de GET /api/equipos/{id}/historial (Ver el historial de un equipo)", () => {
  const ruta = "/api/equipos/{id}/historial";
  const url = (id: string) => `/api/equipos/${id}/historial`;

  it("200: lista persona, devolucion y estado de sus préstamos", async () => {
    const enviar = await servidor();
    await enviar("POST", "/api/equipos/pc-01/prestamo", "it", { persona: ANA, devolucion: FUTURA });
    await enviar("POST", "/api/equipos/pc-01/devolucion", "it");
    const lista = esperarExito(await enviar("GET", url("pc-01"), "it"), ruta, "get", 200) as unknown as Record<string, unknown>[];
    expect(lista).toEqual([{ persona: ANA, devolucion: FUTURA, estado: "devuelto" }]);
  });

  it("401: sin token", async () => {
    const enviar = await servidor();
    esperarError(await enviar("GET", url("pc-01"), undefined), ruta, "get", 401, SIN_SESION);
  });

  it("403: una cuenta que no es de IT", async () => {
    const enviar = await servidor();
    esperarError(await enviar("GET", url("pc-01"), "ana"), ruta, "get", 403, SOLO_IT);
  });

  it("404: el equipo no existe", async () => {
    const enviar = await servidor();
    esperarError(await enviar("GET", url("no-existe"), "it"), ruta, "get", 404, NO_EXISTE);
  });
});
