import { describe, expect, it } from "vitest";
import { almacenEnMemoria } from "../../lib/datos.js";
import { listarEquipos, obtenerEquipo } from "./index.js";

describe("obtenerEquipo", () => {
  it("devuelve el equipo dado de alta con ese id", async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "pc-07", { id: "pc-07", nombre: "Portátil 07" });
    expect(await obtenerEquipo(almacen, "pc-07")).toEqual({ id: "pc-07", nombre: "Portátil 07" });
  });

  it("devuelve undefined si el equipo no existe", async () => {
    expect(await obtenerEquipo(almacenEnMemoria(), "no-existe")).toBeUndefined();
  });
});

describe("listarEquipos", () => {
  it("devuelve una lista vacía sin equipos", async () => {
    expect(await listarEquipos(almacenEnMemoria())).toEqual([]);
  });

  it("devuelve todos los equipos ordenados por nombre", async () => {
    const almacen = almacenEnMemoria();
    await almacen.guardar("equipos_equipos", "p2", { id: "p2", nombre: "Proyector 02" });
    await almacen.guardar("equipos_equipos", "pc7", { id: "pc7", nombre: "Portátil 07" });
    expect(await listarEquipos(almacen)).toEqual([
      { id: "pc7", nombre: "Portátil 07" },
      { id: "p2", nombre: "Proyector 02" },
    ]);
  });
});
