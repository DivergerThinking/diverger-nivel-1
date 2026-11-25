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

  it("presta un equipo disponible en el mostrador con la persona y la fecha, y recarga la lista", async () => {
    const DISPONIBLE = { id: "42", nombre: "Portátil 07", estado: "disponible" };
    const PRESTADO = { ...DISPONIBLE, estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-12-01" };
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta([DISPONIBLE]))
      .mockResolvedValueOnce(respuesta(PRESTADO, 201))
      .mockResolvedValueOnce(respuesta([PRESTADO]));
    vi.stubGlobal("fetch", fetch);
    render(<Gestion sesion={SESION} />);
    fireEvent.change(await screen.findByLabelText("Persona de Portátil 07"), { target: { value: "luis.gomez@empresa.com" } });
    fireEvent.change(screen.getByLabelText("Devolución de Portátil 07"), { target: { value: "2026-12-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Prestar Portátil 07" }));
    expect(await screen.findByText(/Portátil 07: prestado a luis.gomez@empresa.com hasta el 2026-12-01/)).toBeTruthy();
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/equipos/42/prestamo", {
      method: "POST",
      headers: { authorization: "Bearer token-de-it", "content-type": "application/json" },
      body: JSON.stringify({ persona: "luis.gomez@empresa.com", devolucion: "2026-12-01" }),
    });
  });

  it("enseña tal cual el error del préstamo en el mostrador", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta([{ id: "42", nombre: "Portátil 07", estado: "disponible" }]))
      .mockResolvedValueOnce(respuesta({ error: "Faltan la persona o la fecha de devolución" }, 400));
    vi.stubGlobal("fetch", fetch);
    render(<Gestion sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Prestar Portátil 07" }));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe("Faltan la persona o la fecha de devolución");
    });
  });

  it("apunta la devolución de un equipo prestado con el token de la sesión y recarga la lista", async () => {
    const PRESTADO = { ...RESERVADO, estado: "prestado" };
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta([PRESTADO]))
      .mockResolvedValueOnce(respuesta({ id: "42", nombre: "Portátil 07", estado: "disponible" }))
      .mockResolvedValueOnce(respuesta([{ id: "42", nombre: "Portátil 07", estado: "disponible" }]));
    vi.stubGlobal("fetch", fetch);
    render(<Gestion sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Apuntar devolución de Portátil 07" }));
    expect(await screen.findByText(/Portátil 07: disponible/)).toBeTruthy();
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/equipos/42/devolucion", {
      method: "POST",
      headers: { authorization: "Bearer token-de-it" },
    });
  });

  it("enseña tal cual el error «El equipo no está prestado» de la devolución", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta([{ ...RESERVADO, estado: "prestado" }]))
      .mockResolvedValueOnce(respuesta({ error: "El equipo no está prestado" }, 409));
    vi.stubGlobal("fetch", fetch);
    render(<Gestion sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Apuntar devolución de Portátil 07" }));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe("El equipo no está prestado");
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
