import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { GestionPrestamos } from "./GestionPrestamos.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

const LISTA = [
  { id: "p7", nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-11-20" },
  { id: "m3", nombre: "Monitor 03", estado: "disponible" },
];

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla Gestión de préstamos", () => {
  it("enseña los equipos y ofrece entregar solo los reservados", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta(LISTA)));
    render(<GestionPrestamos sesion={SESION} />);
    expect(await screen.findByText(/Portátil 07 · reservado · ana.perez@empresa.com · devolución 2026-11-20/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Entregar Portátil 07" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Entregar Monitor 03" })).toBeNull();
  });

  it("entrega el equipo con el token de la sesión y vuelve a cargar la lista", async () => {
    const fetch = vi.fn((_ruta: string, opciones: { method: string }) =>
      Promise.resolve(opciones.method === "POST" ? respuesta({ ...LISTA[0], estado: "prestado" }) : respuesta(LISTA)),
    );
    vi.stubGlobal("fetch", fetch);
    render(<GestionPrestamos sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Entregar Portátil 07" }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/equipos/p7/entrega", {
        method: "POST",
        headers: { authorization: "Bearer token-de-it" },
      });
    });
    await waitFor(() => {
      expect(fetch.mock.calls.filter(([ruta]) => ruta === "/api/equipos")).toHaveLength(2);
    });
  });

  it("enseña el mensaje de error de la API tal cual al entregar", async () => {
    vi.stubGlobal("fetch", (_ruta: string, opciones: { method: string }) =>
      Promise.resolve(opciones.method === "POST" ? respuesta({ error: "El equipo no está reservado" }, 409) : respuesta(LISTA)),
    );
    render(<GestionPrestamos sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Entregar Portátil 07" }));
    expect((await screen.findByRole("alert")).textContent).toBe("El equipo no está reservado");
  });

  it("presta en el mostrador un equipo disponible con la persona y la fecha, con el token de la sesión", async () => {
    const fetch = vi.fn((_ruta: string, opciones: { method: string }) =>
      Promise.resolve(opciones.method === "POST" ? respuesta({ ...LISTA[1], estado: "prestado" }, 201) : respuesta(LISTA)),
    );
    vi.stubGlobal("fetch", fetch);
    render(<GestionPrestamos sesion={SESION} />);
    expect(await screen.findByRole("button", { name: "Prestar Monitor 03" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Prestar Portátil 07" })).toBeNull();
    fireEvent.change(screen.getByLabelText("Persona de Monitor 03"), { target: { value: "luis.gomez@empresa.com" } });
    fireEvent.change(screen.getByLabelText("Devolución de Monitor 03"), { target: { value: "2026-11-20" } });
    fireEvent.click(screen.getByRole("button", { name: "Prestar Monitor 03" }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/equipos/m3/prestamo", {
        method: "POST",
        headers: { authorization: "Bearer token-de-it", "content-type": "application/json" },
        body: JSON.stringify({ persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" }),
      });
    });
    await waitFor(() => {
      expect(fetch.mock.calls.filter(([ruta]) => ruta === "/api/equipos")).toHaveLength(2);
    });
  });

  it.each([
    [400, "Faltan la persona o la fecha de devolución"],
    [400, "La fecha de devolución no es válida"],
    [409, "El equipo no está disponible"],
    [404, "No existe el equipo"],
  ])("enseña el mensaje de la API tal cual si el préstamo falla con %i: %s", async (estado, mensaje) => {
    vi.stubGlobal("fetch", (_ruta: string, opciones: { method: string }) =>
      Promise.resolve(opciones.method === "POST" ? respuesta({ error: mensaje }, estado) : respuesta(LISTA)),
    );
    render(<GestionPrestamos sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Prestar Monitor 03" }));
    expect((await screen.findByRole("alert")).textContent).toBe(mensaje);
  });

  it("ofrece apuntar la devolución solo de los equipos prestados, con el token de la sesión", async () => {
    const prestados = [{ id: "m3", nombre: "Monitor 03", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" }, ...LISTA];
    const fetch = vi.fn((_ruta: string, opciones: { method: string }) =>
      Promise.resolve(opciones.method === "POST" ? respuesta({ id: "m3", nombre: "Monitor 03", estado: "disponible" }) : respuesta(prestados)),
    );
    vi.stubGlobal("fetch", fetch);
    render(<GestionPrestamos sesion={SESION} />);
    expect(screen.queryByRole("button", { name: "Apuntar devolución de Portátil 07" })).toBeNull();
    fireEvent.click(await screen.findByRole("button", { name: "Apuntar devolución de Monitor 03" }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/equipos/m3/devolucion", {
        method: "POST",
        headers: { authorization: "Bearer token-de-it" },
      });
    });
    await waitFor(() => {
      expect(fetch.mock.calls.filter(([ruta]) => ruta === "/api/equipos")).toHaveLength(2);
    });
  });

  it.each([
    [409, "El equipo no está prestado"],
    [404, "No existe el equipo"],
  ])("enseña el mensaje de la API tal cual si la devolución falla con %i: %s", async (estado, mensaje) => {
    const prestado = [{ id: "m3", nombre: "Monitor 03", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" }];
    vi.stubGlobal("fetch", (_ruta: string, opciones: { method: string }) =>
      Promise.resolve(opciones.method === "POST" ? respuesta({ error: mensaje }, estado) : respuesta(prestado)),
    );
    render(<GestionPrestamos sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Apuntar devolución de Monitor 03" }));
    expect((await screen.findByRole("alert")).textContent).toBe(mensaje);
  });

  it("enseña «No existe el equipo» si la API responde 404 al entregar", async () => {
    vi.stubGlobal("fetch", (_ruta: string, opciones: { method: string }) =>
      Promise.resolve(opciones.method === "POST" ? respuesta({ error: "No existe el equipo" }, 404) : respuesta(LISTA)),
    );
    render(<GestionPrestamos sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Entregar Portátil 07" }));
    expect((await screen.findByRole("alert")).textContent).toBe("No existe el equipo");
  });
});
