import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Gestion } from "./Gestion.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

const EQUIPOS = [
  { id: "e1", nombre: "Portátil 07", estado: "disponible" },
  { id: "e2", nombre: "Monitor 03", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-12-15" },
  { id: "e3", nombre: "Proyector 01", estado: "prestado", persona: "luis.garcia@empresa.com", devolucion: "2026-12-20" },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla Gestión de préstamos", () => {
  it("enseña los equipos con la acción de cada estado", async () => {
    const fetch = vi.fn(() => Promise.resolve(respuesta(EQUIPOS)));
    vi.stubGlobal("fetch", fetch);
    render(<Gestion sesion={SESION} />);
    const lista = await screen.findByLabelText("Equipos para gestionar");
    expect(lista.textContent).toContain("Portátil 07: disponible");
    expect(lista.textContent).toContain("ana.perez@empresa.com, devolución 2026-12-15");
    expect(screen.getByRole("button", { name: "Entregar Monitor 03" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Apuntar devolución de Proyector 01" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Prestar" })).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos", { method: "GET", headers: { authorization: "Bearer token-de-it" } });
  });

  it("entrega un equipo reservado con el token de la sesión", async () => {
    const fetch = vi.fn((ruta: string) => Promise.resolve(respuesta(ruta === "/api/equipos" ? EQUIPOS : EQUIPOS[1])));
    vi.stubGlobal("fetch", fetch);
    render(<Gestion sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Entregar Monitor 03" }));
    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/equipos/e2/entrega", { method: "POST", headers: { authorization: "Bearer token-de-it" } });
    });
  });

  it("apunta la devolución de un equipo prestado", async () => {
    const fetch = vi.fn((ruta: string) => Promise.resolve(respuesta(ruta === "/api/equipos" ? EQUIPOS : EQUIPOS[0])));
    vi.stubGlobal("fetch", fetch);
    render(<Gestion sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Apuntar devolución de Proyector 01" }));
    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/equipos/e3/devolucion", {
        method: "POST",
        headers: { authorization: "Bearer token-de-it" },
      });
    });
  });

  it("presta en el mostrador con la persona y la fecha escritas", async () => {
    const fetch = vi.fn((ruta: string) => Promise.resolve(respuesta(ruta === "/api/equipos" ? EQUIPOS : EQUIPOS[1], ruta === "/api/equipos" ? 200 : 201)));
    vi.stubGlobal("fetch", fetch);
    render(<Gestion sesion={SESION} />);
    await screen.findByLabelText("Equipos para gestionar");
    fireEvent.change(screen.getByLabelText("Persona"), { target: { value: "ana.perez@empresa.com" } });
    fireEvent.change(screen.getByLabelText("Fecha de devolución"), { target: { value: "2026-12-15" } });
    fireEvent.click(screen.getByRole("button", { name: "Prestar" }));
    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/equipos/e1/prestamo", {
        method: "POST",
        headers: { authorization: "Bearer token-de-it", "content-type": "application/json" },
        body: JSON.stringify({ persona: "ana.perez@empresa.com", devolucion: "2026-12-15" }),
      });
    });
  });

  it("enseña tal cual el 403 de la API a quien no es de IT", async () => {
    vi.stubGlobal("fetch", (ruta: string) =>
      Promise.resolve(ruta === "/api/equipos" ? respuesta(EQUIPOS) : respuesta({ error: "Solo IT puede hacer esto." }, 403)),
    );
    render(<Gestion sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Entregar Monitor 03" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Solo IT puede hacer esto.");
  });
});
