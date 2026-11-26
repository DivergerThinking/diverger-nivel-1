import { describe, expect, it } from "vitest";
import { esCuentaDeIT } from "./index.js";

const IT = { CORREOS_IT: "it@empresa.com,inventario@empresa.com" };

describe("esCuentaDeIT", () => {
  it("acepta las cuentas de la lista sin distinguir mayúsculas", () => {
    expect(esCuentaDeIT("IT.Empresa@empresa.com", { CORREOS_IT: "it.empresa@empresa.com" })).toBe(true);
    expect(esCuentaDeIT("inventario@empresa.com", IT)).toBe(true);
  });

  it("ignora los espacios alrededor de cada correo de la lista", () => {
    expect(esCuentaDeIT("inventario@empresa.com", { CORREOS_IT: "it@empresa.com , inventario@empresa.com" })).toBe(true);
  });

  it("rechaza cualquier otra cuenta, o ninguna", () => {
    expect(esCuentaDeIT("ana.perez@empresa.com", IT)).toBe(false);
    expect(esCuentaDeIT(undefined, IT)).toBe(false);
  });

  it("sin CORREOS_IT o vacía, nadie es de IT", () => {
    expect(esCuentaDeIT("it@empresa.com", {})).toBe(false);
    expect(esCuentaDeIT("", { CORREOS_IT: "" })).toBe(false);
  });
});
