import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Historial } from "./Historial.js";
import { pantallas } from "./index.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };
const EQUIPOS = [{ id: "42", nombre: "Portátil 42" }];

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla Historial de un equipo", () => {
  it("al elegir un equipo enseña sus préstamos en el orden de la API con el token de la sesión", async () => {
    const fetch = vi.fn((url: string) =>
      Promise.resolve(
        url === "/api/equipos"
          ? respuesta(EQUIPOS)
          : respuesta([
              { persona: "luis.gomez@empresa.com", devolucion: "2026-12-01", estado: "reservado" },
              { persona: "ana.perez@empresa.com", devolucion: "2026-10-15", estado: "devuelto" },
            ]),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    render(<Historial sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Ver historial de Portátil 42" }));
    const lista = await screen.findByRole("list", { name: "Préstamos del equipo" });
    expect(within(lista).getAllByRole("listitem").map((i) => i.textContent)).toEqual([
      "luis.gomez@empresa.com, hasta el 2026-12-01: reservado",
      "ana.perez@empresa.com, hasta el 2026-10-15: devuelto",
    ]);
    expect(fetch).toHaveBeenCalledWith("/api/equipos/42/historial", {
      method: "GET",
      headers: { authorization: "Bearer token-de-it" },
    });
  });

  it("dice que el equipo no tiene préstamos con un historial vacío", async () => {
    vi.stubGlobal("fetch", (url: string) => Promise.resolve(url === "/api/equipos" ? respuesta(EQUIPOS) : respuesta([])));
    render(<Historial sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Ver historial de Portátil 42" }));
    expect(await screen.findByText("Este equipo no tiene préstamos.")).toBeTruthy();
  });

  it("enseña tal cual el 404 «No existe el equipo» de la API", async () => {
    vi.stubGlobal("fetch", (url: string) =>
      Promise.resolve(url === "/api/equipos" ? respuesta(EQUIPOS) : respuesta({ error: "No existe el equipo" }, 404)),
    );
    render(<Historial sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Ver historial de Portátil 42" }));
    expect((await screen.findByRole("alert")).textContent).toBe("No existe el equipo");
  });

  it("se registra solo para IT: visible según GET /api/prestamos/vencidos", async () => {
    const pantalla = pantallas.find((p) => p.id === "prestamos-historial");
    expect(pantalla?.titulo).toBe("Historial de un equipo");
    expect(pantalla?.visible).toBeDefined();
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Solo IT puede hacer esto." }, 403)));
    expect(await pantalla?.visible?.(SESION)).toBe(false);
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta([])));
    expect(await pantalla?.visible?.(SESION)).toBe(true);
  });
});
