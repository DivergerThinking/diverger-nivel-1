import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Vencidos } from "./Vencidos.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

const VENCIDOS = [
  { id: "m3", nombre: "Monitor 03", persona: "luis.gomez@empresa.com", devolucion: "2026-11-10" },
  { id: "p7", nombre: "Portátil 07", persona: "ana.perez@empresa.com", devolucion: "2026-11-12" },
];

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla Préstamos vencidos", () => {
  it("enseña los vencidos en el orden de la API, con el token de la sesión", async () => {
    const fetch = vi.fn(() => Promise.resolve(respuesta(VENCIDOS)));
    vi.stubGlobal("fetch", fetch);
    render(<Vencidos sesion={SESION} />);
    const filas = await screen.findAllByRole("listitem");
    expect(filas.map((fila) => fila.textContent)).toEqual([
      "Monitor 03 · luis.gomez@empresa.com · devolución 2026-11-10",
      "Portátil 07 · ana.perez@empresa.com · devolución 2026-11-12",
    ]);
    expect(fetch).toHaveBeenCalledWith("/api/prestamos/vencidos", expect.objectContaining({
      headers: { authorization: "Bearer token-de-it" },
    }));
  });

  it("enseña el mensaje de error de la API tal cual", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Solo IT puede hacer esto." }, 403)));
    render(<Vencidos sesion={SESION} />);
    expect((await screen.findByRole("alert")).textContent).toBe("Solo IT puede hacer esto.");
  });
});
