import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Mostrador } from "./Mostrador.js";
import { pantallas } from "./index.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

const RESERVADO = { id: "e-1", nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-12-10" };
const DISPONIBLE = { id: "e-2", nombre: "Monitor 03", estado: "disponible" };

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla del mostrador de IT", () => {
  it("lista los equipos y solo ofrece entregar los reservados", async () => {
    const fetch = vi.fn(() => Promise.resolve(respuesta([RESERVADO, DISPONIBLE])));
    vi.stubGlobal("fetch", fetch);
    render(<Mostrador sesion={SESION} />);
    expect(await screen.findByText("Portátil 07")).toBeTruthy();
    expect(screen.getByText("ana.perez@empresa.com")).toBeTruthy();
    expect(screen.getByText("2026-12-10")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Entregar Portátil 07" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Entregar Monitor 03" })).toBeNull();
    expect(fetch).toHaveBeenCalledWith("/api/equipos", { method: "GET", headers: { authorization: "Bearer token-de-it" } });
  });

  it("entrega un equipo reservado con el token de la sesión y recarga la lista", async () => {
    const prestado = { ...RESERVADO, estado: "prestado" };
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta([RESERVADO]))
      .mockResolvedValueOnce(respuesta(prestado))
      .mockResolvedValueOnce(respuesta([prestado]));
    vi.stubGlobal("fetch", fetch);
    render(<Mostrador sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Entregar Portátil 07" }));
    expect(await screen.findByText("prestado")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos/e-1/entrega", { method: "POST", headers: { authorization: "Bearer token-de-it" } });
    expect(screen.queryByRole("button", { name: "Entregar Portátil 07" })).toBeNull();
  });

  it("enseña el mensaje de la API tal cual cuando falla la entrega", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta([RESERVADO]))
      .mockResolvedValueOnce(respuesta({ error: "El equipo no está reservado" }, 409));
    vi.stubGlobal("fetch", fetch);
    render(<Mostrador sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Entregar Portátil 07" }));
    expect((await screen.findByRole("alert")).textContent).toBe("El equipo no está reservado");
  });
});

describe("préstamo en el mostrador", () => {
  const abrir = async () => {
    fireEvent.click(await screen.findByRole("button", { name: "Prestar Monitor 03" }));
  };
  const rellenar = (persona: string, devolucion: string) => {
    fireEvent.change(screen.getByLabelText("Persona"), { target: { value: persona } });
    fireEvent.change(screen.getByLabelText("Fecha de devolución"), { target: { value: devolucion } });
  };

  it("solo ofrece prestar los equipos disponibles", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta([RESERVADO, DISPONIBLE])));
    render(<Mostrador sesion={SESION} />);
    expect(await screen.findByRole("button", { name: "Prestar Monitor 03" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Prestar Portátil 07" })).toBeNull();
  });

  it("presta con la persona y la fecha, con el token de la sesión, y recarga la lista", async () => {
    const prestado = { ...DISPONIBLE, estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-12-15" };
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta([DISPONIBLE]))
      .mockResolvedValueOnce(respuesta(prestado, 201))
      .mockResolvedValueOnce(respuesta([prestado]));
    vi.stubGlobal("fetch", fetch);
    render(<Mostrador sesion={SESION} />);
    await abrir();
    rellenar("luis.gomez@empresa.com", "2026-12-15");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar préstamo" }));
    expect(await screen.findByText("prestado")).toBeTruthy();
    expect(screen.getByText("luis.gomez@empresa.com")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos/e-2/prestamo", {
      method: "POST",
      headers: { authorization: "Bearer token-de-it", "content-type": "application/json" },
      body: JSON.stringify({ persona: "luis.gomez@empresa.com", devolucion: "2026-12-15" }),
    });
    expect(screen.queryByRole("button", { name: "Confirmar préstamo" })).toBeNull();
  });

  it.each([
    [400, "Faltan la persona o la fecha de devolución"],
    [400, "La fecha de devolución no es válida"],
    [409, "El equipo no está disponible"],
    [404, "No existe el equipo"],
  ])("enseña tal cual el error %i de la API: %s", async (status, mensaje) => {
    const fetch = vi.fn().mockResolvedValueOnce(respuesta([DISPONIBLE])).mockResolvedValueOnce(respuesta({ error: mensaje }, status));
    vi.stubGlobal("fetch", fetch);
    render(<Mostrador sesion={SESION} />);
    await abrir();
    rellenar("", "2026-12-15");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar préstamo" }));
    expect((await screen.findByRole("alert")).textContent).toBe(mensaje);
  });
});

describe("pantallas del contexto", () => {
  it("el mostrador es de IT: lo decide la ruta de vencidos", async () => {
    const mostrador = pantallas.find((p) => p.id === "prestamos-mostrador");
    expect(mostrador?.Componente).toBe(Mostrador);
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Solo IT puede hacer esto." }, 403)));
    expect(await mostrador?.visible?.(SESION)).toBe(false);
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta([])));
    expect(await mostrador?.visible?.(SESION)).toBe(true);
  });
});
