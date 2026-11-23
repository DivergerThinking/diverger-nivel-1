import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Vencidos } from "./Vencidos.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla Préstamos vencidos", () => {
  it("enseña los vencidos en el orden de la API con el token de la sesión", async () => {
    const fetch = vi.fn(() =>
      Promise.resolve(
        respuesta([
          { id: "e2", nombre: "Monitor 03", persona: "luis.garcia@empresa.com", devolucion: "2026-11-10" },
          { id: "e1", nombre: "Portátil 07", persona: "ana.perez@empresa.com", devolucion: "2026-11-18" },
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    render(<Vencidos sesion={SESION} />);
    const lista = await screen.findByLabelText("Préstamos vencidos");
    const filas = Array.from(lista.querySelectorAll("li")).map((fila) => fila.textContent);
    expect(filas).toEqual([
      "Monitor 03: luis.garcia@empresa.com, devolución 2026-11-10",
      "Portátil 07: ana.perez@empresa.com, devolución 2026-11-18",
    ]);
    expect(fetch).toHaveBeenCalledWith("/api/prestamos/vencidos", { method: "GET", headers: { authorization: "Bearer token-de-it" } });
  });

  it("avisa de que no hay vencidos", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta([])));
    render(<Vencidos sesion={SESION} />);
    expect(await screen.findByText("No hay préstamos vencidos.")).toBeTruthy();
  });

  it("enseña tal cual el 403 de la API a quien no es de IT", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Solo IT puede hacer esto." }, 403)));
    render(<Vencidos sesion={SESION} />);
    expect((await screen.findByRole("alert")).textContent).toBe("Solo IT puede hacer esto.");
  });
});
