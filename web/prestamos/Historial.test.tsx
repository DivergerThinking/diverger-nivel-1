import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Historial } from "./Historial.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

const LISTA = [
  { id: "p7", nombre: "Portátil 07", estado: "reservado" },
  { id: "m3", nombre: "Monitor 03", estado: "disponible" },
];

const HISTORIAL = [
  { persona: "ana.perez@empresa.com", devolucion: "2026-11-20", estado: "reservado" },
  { persona: "luis.gomez@empresa.com", devolucion: "2026-11-10", estado: "devuelto" },
];

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla Historial de un equipo", () => {
  it("enseña los préstamos del equipo elegido en el orden de la API, con el token de la sesión", async () => {
    const fetch = vi.fn((ruta: string) => Promise.resolve(respuesta(ruta === "/api/equipos" ? LISTA : HISTORIAL)));
    vi.stubGlobal("fetch", fetch);
    render(<Historial sesion={SESION} />);
    await screen.findByRole("option", { name: "Portátil 07" });
    fireEvent.change(screen.getByLabelText("Equipo"), { target: { value: "p7" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));
    const filas = await screen.findAllByRole("listitem");
    expect(filas.map((fila) => fila.textContent)).toEqual([
      "ana.perez@empresa.com · devolución 2026-11-20 · reservado",
      "luis.gomez@empresa.com · devolución 2026-11-10 · devuelto",
    ]);
    expect(fetch).toHaveBeenCalledWith("/api/equipos/p7/historial", {
      method: "GET",
      headers: { authorization: "Bearer token-de-it" },
    });
  });

  it("enseña «No existe el equipo» tal cual cuando la API lo responde", async () => {
    vi.stubGlobal("fetch", (ruta: string) =>
      Promise.resolve(ruta === "/api/equipos" ? respuesta(LISTA) : respuesta({ error: "No existe el equipo" }, 404)),
    );
    render(<Historial sesion={SESION} />);
    await screen.findByRole("option", { name: "Monitor 03" });
    fireEvent.change(screen.getByLabelText("Equipo"), { target: { value: "m3" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe("No existe el equipo");
    });
  });

  it("enseña el mensaje de la API si falla al listar los equipos", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Inicia sesión con Google." }, 401)));
    render(<Historial sesion={SESION} />);
    expect((await screen.findByRole("alert")).textContent).toBe("Inicia sesión con Google.");
  });
});
