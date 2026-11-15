import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Equipos } from "./Equipos.js";

const SESION: Sesion = { token: "token-de-ana", persona: { email: "ana.perez@empresa.com", nombre: "Ana" } };

const LISTA = [
  { id: "p7", nombre: "Portátil 07", estado: "disponible" },
  { id: "m3", nombre: "Monitor 03", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-20" },
];

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla Equipos", () => {
  it("enseña los equipos con su estado, persona y devolución, pedidos con el token de la sesión", async () => {
    const fetch = vi.fn(() => Promise.resolve(respuesta(LISTA)));
    vi.stubGlobal("fetch", fetch);
    render(<Equipos sesion={SESION} />);
    expect(await screen.findByText(/Monitor 03 · prestado · luis.gomez@empresa.com · devolución 2026-11-20/)).toBeTruthy();
    expect(screen.getByText(/Portátil 07 · disponible/)).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos", { method: "GET", headers: { authorization: "Bearer token-de-ana" } });
  });

  it("pide el equipo elegido con la fecha y vuelve a cargar la lista", async () => {
    const fetch = vi.fn((ruta: string, opciones: { method: string }) =>
      Promise.resolve(opciones.method === "POST" ? respuesta({ ...LISTA[0], estado: "reservado" }, 201) : respuesta(LISTA)),
    );
    vi.stubGlobal("fetch", fetch);
    render(<Equipos sesion={SESION} />);
    await screen.findByText(/Monitor 03/);
    fireEvent.change(screen.getByLabelText("Equipo"), { target: { value: "p7" } });
    fireEvent.change(screen.getByLabelText("Fecha de devolución"), { target: { value: "2026-11-20" } });
    fireEvent.click(screen.getByRole("button", { name: "Pedir" }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/equipos/p7/solicitud", {
        method: "POST",
        headers: { authorization: "Bearer token-de-ana", "content-type": "application/json" },
        body: JSON.stringify({ devolucion: "2026-11-20" }),
      });
    });
    await waitFor(() => {
      expect(fetch.mock.calls.filter(([ruta]) => ruta === "/api/equipos")).toHaveLength(2);
    });
  });

  it("enseña el mensaje de error de la API tal cual al pedir", async () => {
    vi.stubGlobal("fetch", (_ruta: string, opciones: { method: string }) =>
      Promise.resolve(opciones.method === "POST" ? respuesta({ error: "Falta la fecha de devolución" }, 400) : respuesta(LISTA)),
    );
    render(<Equipos sesion={SESION} />);
    await screen.findByText(/Monitor 03/);
    fireEvent.change(screen.getByLabelText("Equipo"), { target: { value: "p7" } });
    fireEvent.click(screen.getByRole("button", { name: "Pedir" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Falta la fecha de devolución");
  });

  it("enseña «Inicia sesión con Google.» si la API responde 401 al listar", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Inicia sesión con Google." }, 401)));
    render(<Equipos sesion={SESION} />);
    expect((await screen.findByRole("alert")).textContent).toBe("Inicia sesión con Google.");
  });
});
