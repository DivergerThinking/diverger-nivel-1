import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Historial } from "./Historial.js";
import { pantallas } from "./index.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

const EQUIPOS = [
  { id: "e-1", nombre: "Portátil 07", estado: "prestado" },
  { id: "e-2", nombre: "Monitor 03", estado: "disponible" },
];

const MOVIMIENTOS = [
  { persona: "luis.gomez@empresa.com", devolucion: "2026-12-15", estado: "prestado" },
  { persona: "ana.perez@empresa.com", devolucion: "2026-12-01", estado: "devuelto" },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function consultar(nombre: string) {
  fireEvent.change(await screen.findByLabelText("Equipo"), { target: { value: nombre } });
  fireEvent.click(screen.getByRole("button", { name: "Consultar historial" }));
}

describe("pantalla del historial de un equipo", () => {
  it("al elegir un equipo enseña sus préstamos en el orden de la API", async () => {
    const fetch = vi.fn((url: string) => Promise.resolve(url === "/api/equipos" ? respuesta(EQUIPOS) : respuesta(MOVIMIENTOS)));
    vi.stubGlobal("fetch", fetch);
    render(<Historial sesion={SESION} />);
    await screen.findByRole("option", { name: "Portátil 07" });
    await consultar("e-1");
    expect(await screen.findByText("luis.gomez@empresa.com")).toBeTruthy();
    expect(screen.getByText("2026-12-01")).toBeTruthy();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "luis.gomez@empresa.com 2026-12-15 prestado",
      "ana.perez@empresa.com 2026-12-01 devuelto",
    ]);
    expect(fetch).toHaveBeenCalledWith("/api/equipos/e-1/historial", { method: "GET", headers: { authorization: "Bearer token-de-it" } });
  });

  it("enseña tal cual el error de la API", async () => {
    vi.stubGlobal("fetch", (url: string) =>
      Promise.resolve(url === "/api/equipos" ? respuesta(EQUIPOS) : respuesta({ error: "No existe el equipo" }, 404)),
    );
    render(<Historial sesion={SESION} />);
    await screen.findByRole("option", { name: "Monitor 03" });
    await consultar("e-2");
    expect((await screen.findByRole("alert")).textContent).toBe("No existe el equipo");
  });

  it("la pantalla es de IT: lo decide la ruta de vencidos", async () => {
    const pantalla = pantallas.find((p) => p.id === "prestamos-historial");
    expect(pantalla?.Componente).toBe(Historial);
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Solo IT puede hacer esto." }, 403)));
    expect(await pantalla?.visible?.(SESION)).toBe(false);
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta([])));
    expect(await pantalla?.visible?.(SESION)).toBe(true);
  });
});
