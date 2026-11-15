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

  it("enseña «No existe el equipo» si la API responde 404 al entregar", async () => {
    vi.stubGlobal("fetch", (_ruta: string, opciones: { method: string }) =>
      Promise.resolve(opciones.method === "POST" ? respuesta({ error: "No existe el equipo" }, 404) : respuesta(LISTA)),
    );
    render(<GestionPrestamos sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Entregar Portátil 07" }));
    expect((await screen.findByRole("alert")).textContent).toBe("No existe el equipo");
  });
});
