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

describe("pantalla Vencidos", () => {
  it("llama a los vencidos con el token y los enseña en el orden de la API", async () => {
    const fetch = vi.fn(() =>
      Promise.resolve(
        respuesta([
          { id: "e2", nombre: "Monitor 03", persona: "luis.gomez@empresa.com", devolucion: "2026-11-10" },
          { id: "e1", nombre: "Proyector 02", persona: "ana.perez@empresa.com", devolucion: "2026-11-12" },
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    render(<Vencidos sesion={SESION} />);
    const filas = await screen.findAllByRole("listitem");
    expect(filas.map((fila) => fila.textContent)).toEqual([
      "Monitor 03: luis.gomez@empresa.com, devolución 2026-11-10",
      "Proyector 02: ana.perez@empresa.com, devolución 2026-11-12",
    ]);
    expect(fetch).toHaveBeenCalledWith("/api/prestamos/vencidos", {
      method: "GET",
      headers: { authorization: "Bearer token-de-it" },
    });
  });

  it("enseña que no hay vencidos si la lista está vacía", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta([])));
    render(<Vencidos sesion={SESION} />);
    expect(await screen.findByText("No hay préstamos vencidos.")).toBeTruthy();
  });

  it("enseña el mensaje de la API tal cual y ninguna lista cuando no es de IT", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Solo IT puede hacer esto." }, 403)));
    render(<Vencidos sesion={SESION} />);
    expect((await screen.findByRole("alert")).textContent).toBe("Solo IT puede hacer esto.");
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
