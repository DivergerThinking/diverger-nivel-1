import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Gestion } from "./Gestion.js";
import { pantallas } from "./index.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

const RESERVADO = { id: "42", nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-12-01" };

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla Gestión de préstamos", () => {
  it("lista los equipos con su estado, persona y devolución", async () => {
    const fetch = vi.fn(() => Promise.resolve(respuesta([RESERVADO])));
    vi.stubGlobal("fetch", fetch);
    render(<Gestion sesion={SESION} />);
    expect(await screen.findByText(/Portátil 07: reservado a ana.perez@empresa.com hasta el 2026-12-01/)).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos", { method: "GET", headers: { authorization: "Bearer token-de-it" } });
  });

  it("entrega un equipo reservado con el token de la sesión y recarga la lista", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta([RESERVADO]))
      .mockResolvedValueOnce(respuesta({ ...RESERVADO, estado: "prestado" }))
      .mockResolvedValueOnce(respuesta([{ ...RESERVADO, estado: "prestado" }]));
    vi.stubGlobal("fetch", fetch);
    render(<Gestion sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Entregar Portátil 07" }));
    expect(await screen.findByText(/Portátil 07: prestado a/)).toBeTruthy();
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/equipos/42/entrega", {
      method: "POST",
      headers: { authorization: "Bearer token-de-it" },
    });
  });

  it("enseña tal cual el 403 «Solo IT puede hacer esto.» de la API", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Solo IT puede hacer esto." }, 403)));
    render(<Gestion sesion={SESION} />);
    expect((await screen.findByRole("alert")).textContent).toBe("Solo IT puede hacer esto.");
  });

  it("enseña tal cual el error de la entrega", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta([RESERVADO]))
      .mockResolvedValueOnce(respuesta({ error: "El equipo no está reservado" }, 409));
    vi.stubGlobal("fetch", fetch);
    render(<Gestion sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Entregar Portátil 07" }));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe("El equipo no está reservado");
    });
  });

  it("se registra solo para IT: visible según GET /api/prestamos/vencidos", async () => {
    const gestion = pantallas.find((p) => p.id === "prestamos-gestion");
    expect(gestion?.visible).toBeDefined();
    const fetch = vi.fn(() => Promise.resolve(respuesta({ error: "Solo IT puede hacer esto." }, 403)));
    vi.stubGlobal("fetch", fetch);
    expect(await gestion?.visible?.(SESION)).toBe(false);
    expect(fetch).toHaveBeenCalledWith("/api/prestamos/vencidos", { method: "GET", headers: { authorization: "Bearer token-de-it" } });
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta([])));
    expect(await gestion?.visible?.(SESION)).toBe(true);
  });
});
