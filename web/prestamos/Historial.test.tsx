import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Historial } from "./Historial.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

const EQUIPOS = [{ id: "e1", nombre: "Portátil 07", estado: "reservado" }];

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla Historial de un equipo", () => {
  it("al elegir un equipo enseña su historial en el orden de la API con el token de la sesión", async () => {
    const fetch = vi.fn((url: string) =>
      Promise.resolve(
        url === "/api/equipos"
          ? respuesta(EQUIPOS)
          : respuesta([
              { persona: "luis.garcia@empresa.com", devolucion: "2026-12-15", estado: "reservado" },
              { persona: "ana.perez@empresa.com", devolucion: "2026-10-15", estado: "devuelto" },
            ]),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    render(<Historial sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Ver historial de Portátil 07" }));
    const lista = await screen.findByLabelText("Historial del equipo");
    expect(Array.from(lista.querySelectorAll("li")).map((fila) => fila.textContent)).toEqual([
      "luis.garcia@empresa.com, devolución 2026-12-15, reservado",
      "ana.perez@empresa.com, devolución 2026-10-15, devuelto",
    ]);
    expect(fetch).toHaveBeenCalledWith("/api/equipos/e1/historial", { method: "GET", headers: { authorization: "Bearer token-de-it" } });
  });

  it("avisa de que el equipo no ha tenido préstamos", async () => {
    vi.stubGlobal("fetch", (url: string) => Promise.resolve(url === "/api/equipos" ? respuesta(EQUIPOS) : respuesta([])));
    render(<Historial sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Ver historial de Portátil 07" }));
    expect(await screen.findByText("Este equipo no ha tenido préstamos.")).toBeTruthy();
  });

  it("enseña tal cual el 404 de la API", async () => {
    vi.stubGlobal("fetch", (url: string) =>
      Promise.resolve(url === "/api/equipos" ? respuesta(EQUIPOS) : respuesta({ error: "No existe el equipo" }, 404)),
    );
    render(<Historial sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Ver historial de Portátil 07" }));
    expect((await screen.findByRole("alert")).textContent).toBe("No existe el equipo");
  });

  it("enseña tal cual el 403 de la API a quien no es de IT", async () => {
    vi.stubGlobal("fetch", (url: string) =>
      Promise.resolve(url === "/api/equipos" ? respuesta(EQUIPOS) : respuesta({ error: "Solo IT puede hacer esto." }, 403)),
    );
    render(<Historial sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Ver historial de Portátil 07" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Solo IT puede hacer esto.");
  });
});
