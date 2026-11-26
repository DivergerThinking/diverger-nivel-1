import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Vencidos } from "./Vencidos.js";
import { pantallas } from "./index.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

const VENCIDOS = [
  { id: "e-1", nombre: "Portátil 07", persona: "ana.perez@empresa.com", devolucion: "2026-11-28" },
  { id: "e-2", nombre: "Monitor 03", persona: "luis.gomez@empresa.com", devolucion: "2026-12-01" },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla de préstamos vencidos", () => {
  it("enseña los vencidos en el orden de la API con nombre, persona y devolución", async () => {
    const fetch = vi.fn(() => Promise.resolve(respuesta(VENCIDOS)));
    vi.stubGlobal("fetch", fetch);
    render(<Vencidos sesion={SESION} />);
    expect(await screen.findByText("Portátil 07")).toBeTruthy();
    expect(screen.getByText("ana.perez@empresa.com")).toBeTruthy();
    expect(screen.getByText("2026-11-28")).toBeTruthy();
    expect(screen.getAllByRole("listitem").map((item) => item.querySelector("strong")?.textContent)).toEqual(["Portátil 07", "Monitor 03"]);
    expect(fetch).toHaveBeenCalledWith("/api/prestamos/vencidos", { method: "GET", headers: { authorization: "Bearer token-de-it" } });
  });

  it("no ofrece acciones: solo se consulta", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta(VENCIDOS)));
    render(<Vencidos sesion={SESION} />);
    await screen.findByText("Portátil 07");
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("enseña tal cual el error de la API", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Solo IT puede hacer esto." }, 403)));
    render(<Vencidos sesion={SESION} />);
    expect((await screen.findByRole("alert")).textContent).toBe("Solo IT puede hacer esto.");
  });

  it("la pantalla es de IT: lo decide la ruta de vencidos", async () => {
    const pantalla = pantallas.find((p) => p.id === "prestamos-vencidos");
    expect(pantalla?.Componente).toBe(Vencidos);
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Solo IT puede hacer esto." }, 403)));
    expect(await pantalla?.visible?.(SESION)).toBe(false);
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta([])));
    expect(await pantalla?.visible?.(SESION)).toBe(true);
  });
});
