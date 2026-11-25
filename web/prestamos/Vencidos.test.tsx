import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Vencidos } from "./Vencidos.js";
import { pantallas } from "./index.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla Préstamos vencidos", () => {
  it("lista los vencidos en el orden de la API con nombre, persona y devolución", async () => {
    const fetch = vi.fn(() =>
      Promise.resolve(
        respuesta([
          { id: "3", nombre: "Monitor 03", persona: "luis@empresa.com", devolucion: "2026-11-10" },
          { id: "7", nombre: "Portátil 07", persona: "ana@empresa.com", devolucion: "2026-11-20" },
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    render(<Vencidos sesion={SESION} />);
    const items = await screen.findAllByRole("listitem");
    expect(items.map((i) => i.textContent)).toEqual([
      "Monitor 03: luis@empresa.com, debía devolverlo el 2026-11-10",
      "Portátil 07: ana@empresa.com, debía devolverlo el 2026-11-20",
    ]);
    expect(fetch).toHaveBeenCalledWith("/api/prestamos/vencidos", { method: "GET", headers: { authorization: "Bearer token-de-it" } });
  });

  it("dice que no hay vencidos con una lista vacía", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta([])));
    render(<Vencidos sesion={SESION} />);
    expect(await screen.findByText("No hay préstamos vencidos.")).toBeTruthy();
  });

  it("enseña tal cual el 403 «Solo IT puede hacer esto.» de la API", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Solo IT puede hacer esto." }, 403)));
    render(<Vencidos sesion={SESION} />);
    expect((await screen.findByRole("alert")).textContent).toBe("Solo IT puede hacer esto.");
  });

  it("se registra solo para IT: visible según GET /api/prestamos/vencidos", async () => {
    const pantalla = pantallas.find((p) => p.id === "prestamos-vencidos");
    expect(pantalla?.titulo).toBe("Préstamos vencidos");
    expect(pantalla?.visible).toBeDefined();
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Solo IT puede hacer esto." }, 403)));
    expect(await pantalla?.visible?.(SESION)).toBe(false);
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta([])));
    expect(await pantalla?.visible?.(SESION)).toBe(true);
  });
});
