import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyIdToken = vi.fn();
vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    verifyIdToken = verifyIdToken;
  },
}));

const { tokenDeCabecera, verificadorGoogle } = await import("../../lib/auth.js");

const CLIENTE = "cliente-de-la-aplicacion";

/** Simula a Google: solo acepta tokens emitidos para el cliente pedido. */
function googleEmite(payload: object, emitidoPara = CLIENTE) {
  verifyIdToken.mockImplementation((peticion: { audience: string }) => {
    if (peticion.audience !== emitidoPara) return Promise.reject(new Error("Wrong recipient"));
    return Promise.resolve({ getPayload: () => payload });
  });
}

describe("sesión con Google", () => {
  beforeEach(() => {
    verifyIdToken.mockReset();
  });

  it("acepta a un empleado con el correo verificado y el cliente OAuth de la aplicación", async () => {
    googleEmite({ email: "luis.garcia@empresa.com", email_verified: true, name: "Luis García" });
    const persona = await verificadorGoogle(CLIENTE)("token");
    expect(persona).toEqual({ email: "luis.garcia@empresa.com", nombre: "Luis García" });
  });

  it("acepta a la cuenta de servicio del inventario, que no tiene nombre", async () => {
    googleEmite({ email: "inventario@empresa.com", email_verified: true });
    const persona = await verificadorGoogle(CLIENTE)("token");
    expect(persona).toEqual({ email: "inventario@empresa.com", nombre: "inventario@empresa.com" });
  });

  it("rechaza un token emitido para otro cliente OAuth", async () => {
    googleEmite({ email: "luis.garcia@empresa.com", email_verified: true }, "otro-cliente");
    expect(await verificadorGoogle(CLIENTE)("token")).toBeNull();
  });

  it("rechaza un correo sin verificar", async () => {
    googleEmite({ email: "luis.garcia@empresa.com", email_verified: false });
    expect(await verificadorGoogle(CLIENTE)("token")).toBeNull();
  });

  it("rechaza un token sin correo", async () => {
    googleEmite({ email_verified: true });
    expect(await verificadorGoogle(CLIENTE)("token")).toBeNull();
  });
});

describe("token de la cabecera", () => {
  it("lo toma de «Authorization: Bearer»", () => {
    expect(tokenDeCabecera("Bearer abc.def")).toBe("abc.def");
  });

  it("sin cabecera o con otro esquema no hay token", () => {
    expect(tokenDeCabecera(undefined)).toBeNull();
    expect(tokenDeCabecera("Basic abc")).toBeNull();
    expect(tokenDeCabecera("Bearer ")).toBeNull();
  });
});
