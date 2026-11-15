import { afterEach, describe, expect, it } from "vitest";
import { esCuentaDeIT } from "./cuentas.js";

const LISTA = "it@empresa.com,inventario@empresa.com";

describe("esCuentaDeIT", () => {
  const original = process.env.CORREOS_IT;
  afterEach(() => {
    if (original === undefined) delete process.env.CORREOS_IT;
    else process.env.CORREOS_IT = original;
  });

  it("reconoce las cuentas de la lista sin distinguir mayúsculas", () => {
    expect(esCuentaDeIT("IT@empresa.com", LISTA)).toBe(true);
    expect(esCuentaDeIT("inventario@empresa.com", LISTA)).toBe(true);
  });

  it("no reconoce a un empleado", () => {
    expect(esCuentaDeIT("ana.perez@empresa.com", LISTA)).toBe(false);
  });

  it("tolera espacios y comas sobrantes en la lista", () => {
    expect(esCuentaDeIT("inventario@empresa.com", " it@empresa.com , inventario@empresa.com ,")).toBe(true);
  });

  it("sin lista o con correo vacío nadie es de IT", () => {
    expect(esCuentaDeIT("it@empresa.com", undefined)).toBe(false);
    expect(esCuentaDeIT("it@empresa.com", "")).toBe(false);
    expect(esCuentaDeIT("", ",")).toBe(false);
  });

  it("lee CORREOS_IT del entorno por defecto", () => {
    process.env.CORREOS_IT = LISTA;
    expect(esCuentaDeIT("it@empresa.com")).toBe(true);
    expect(esCuentaDeIT("ana.perez@empresa.com")).toBe(false);
  });
});
