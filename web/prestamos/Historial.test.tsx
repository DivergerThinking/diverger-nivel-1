import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Historial } from "./Historial.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla Historial", () => {
  it("al elegir un equipo llama al historial con el token y enseña los préstamos en el orden de la API", async () => {
    const fetch = vi.fn((ruta: string) =>
      Promise.resolve(
        ruta === "/api/equipos"
          ? respuesta([{ id: "e1", nombre: "Portátil 07", estado: "reservado" }])
          : respuesta([
              { persona: "luis.gomez@empresa.com", devolucion: "2026-11-25", estado: "reservado" },
              { persona: "ana.perez@empresa.com", devolucion: "2026-11-10", estado: "devuelto" },
            ]),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    render(<Historial sesion={SESION} />);
    await screen.findByRole("option", { name: "Portátil 07" });
    fireEvent.change(screen.getByLabelText("Equipo"), { target: { value: "e1" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar historial" }));
    const filas = await screen.findAllByRole("listitem");
    expect(filas.map((fila) => fila.textContent)).toEqual([
      "luis.gomez@empresa.com, devolución 2026-11-25: reservado",
      "ana.perez@empresa.com, devolución 2026-11-10: devuelto",
    ]);
    expect(fetch).toHaveBeenCalledWith("/api/equipos/e1/historial", {
      method: "GET",
      headers: { authorization: "Bearer token-de-it" },
    });
  });

  it("si el equipo no existe enseña el mensaje de la API tal cual", async () => {
    vi.stubGlobal("fetch", (ruta: string) =>
      Promise.resolve(
        ruta === "/api/equipos"
          ? respuesta([{ id: "e1", nombre: "Portátil 07", estado: "disponible" }])
          : respuesta({ error: "No existe el equipo" }, 404),
      ),
    );
    render(<Historial sesion={SESION} />);
    await screen.findByRole("option", { name: "Portátil 07" });
    fireEvent.change(screen.getByLabelText("Equipo"), { target: { value: "e1" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar historial" }));
    expect((await screen.findByRole("alert")).textContent).toBe("No existe el equipo");
  });

  it("enseña que el equipo no se ha prestado nunca si el historial está vacío", async () => {
    vi.stubGlobal("fetch", (ruta: string) =>
      Promise.resolve(
        ruta === "/api/equipos"
          ? respuesta([{ id: "e1", nombre: "Portátil 07", estado: "disponible" }])
          : respuesta([]),
      ),
    );
    render(<Historial sesion={SESION} />);
    await screen.findByRole("option", { name: "Portátil 07" });
    fireEvent.change(screen.getByLabelText("Equipo"), { target: { value: "e1" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar historial" }));
    expect(await screen.findByText("Este equipo no se ha prestado nunca.")).toBeTruthy();
  });
});
