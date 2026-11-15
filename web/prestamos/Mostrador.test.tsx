import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Mostrador } from "./Mostrador.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla Mostrador de IT", () => {
  it("enseña los equipos y solo ofrece entregar los reservados", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve(
        respuesta([
          { id: "e1", nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-11-20" },
          { id: "e2", nombre: "Monitor 03", estado: "disponible" },
        ]),
      ),
    );
    render(<Mostrador sesion={SESION} />);
    expect(await screen.findByText(/Portátil 07: reservado a ana.perez@empresa.com, devolución 2026-11-20/)).toBeTruthy();
    expect(screen.getByText("Monitor 03: disponible")).toBeTruthy();
    expect(screen.getAllByRole("button").map((boton) => boton.textContent)).toEqual(["Entregar Portátil 07", "Prestar equipo"]);
  });

  const rellenarYPrestar = async (persona: string, devolucion: string) => {
    fireEvent.change(await screen.findByLabelText("Equipo a prestar"), { target: { value: "e2" } });
    fireEvent.change(screen.getByLabelText("Persona"), { target: { value: persona } });
    fireEvent.change(screen.getByLabelText("Fecha de devolución"), { target: { value: devolucion } });
    fireEvent.click(screen.getByRole("button", { name: "Prestar equipo" }));
  };

  it("presta un equipo disponible con la persona y la fecha, con el token, y enseña la lista actualizada", async () => {
    let prestado = false;
    const fetch = vi.fn((_ruta: string, opciones: { method: string }) => {
      if (opciones.method === "POST") {
        prestado = true;
        return Promise.resolve(
          respuesta({ id: "e2", nombre: "Monitor 03", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-10" }, 201),
        );
      }
      return Promise.resolve(
        respuesta([
          prestado
            ? { id: "e2", nombre: "Monitor 03", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-10" }
            : { id: "e2", nombre: "Monitor 03", estado: "disponible" },
        ]),
      );
    });
    vi.stubGlobal("fetch", fetch);
    render(<Mostrador sesion={SESION} />);
    await rellenarYPrestar("luis.gomez@empresa.com", "2026-11-10");
    expect((await screen.findByRole("status")).textContent).toBe("Monitor 03 prestado a luis.gomez@empresa.com hasta el 2026-11-10");
    expect(await screen.findByText(/Monitor 03: prestado a luis.gomez@empresa.com, devolución 2026-11-10/)).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos/e2/prestamo", {
      method: "POST",
      headers: { authorization: "Bearer token-de-it", "content-type": "application/json" },
      body: JSON.stringify({ persona: "luis.gomez@empresa.com", devolucion: "2026-11-10" }),
    });
  });

  it("si la API rechaza el préstamo enseña su mensaje tal cual", async () => {
    vi.stubGlobal("fetch", (_ruta: string, opciones: { method: string }) =>
      Promise.resolve(
        opciones.method === "POST"
          ? respuesta({ error: "Faltan la persona o la fecha de devolución" }, 400)
          : respuesta([{ id: "e2", nombre: "Monitor 03", estado: "disponible" }]),
      ),
    );
    render(<Mostrador sesion={SESION} />);
    await rellenarYPrestar("", "2026-11-20");
    expect((await screen.findByRole("alert")).textContent).toBe("Faltan la persona o la fecha de devolución");
  });

  it("entrega un equipo reservado con el token y enseña la lista actualizada", async () => {
    let entregado = false;
    const fetch = vi.fn((ruta: string, opciones: { method: string }) => {
      if (opciones.method === "POST") {
        entregado = true;
        return Promise.resolve(
          respuesta({ id: "e1", nombre: "Portátil 07", estado: "prestado", persona: "ana.perez@empresa.com", devolucion: "2026-11-20" }),
        );
      }
      return Promise.resolve(
        respuesta([
          {
            id: "e1",
            nombre: "Portátil 07",
            estado: entregado ? "prestado" : "reservado",
            persona: "ana.perez@empresa.com",
            devolucion: "2026-11-20",
          },
        ]),
      );
    });
    vi.stubGlobal("fetch", fetch);
    render(<Mostrador sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Entregar Portátil 07" }));
    expect((await screen.findByRole("status")).textContent).toBe("Portátil 07 entregado a ana.perez@empresa.com hasta el 2026-11-20");
    expect(await screen.findByText(/Portátil 07: prestado a ana.perez@empresa.com/)).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos/e1/entrega", { method: "POST", headers: { authorization: "Bearer token-de-it" } });
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("si la API falla enseña su mensaje tal cual", async () => {
    vi.stubGlobal("fetch", (_ruta: string, opciones: { method: string }) =>
      Promise.resolve(
        opciones.method === "POST"
          ? respuesta({ error: "El equipo no está reservado" }, 409)
          : respuesta([{ id: "e1", nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-11-20" }]),
      ),
    );
    render(<Mostrador sesion={SESION} />);
    fireEvent.click(await screen.findByRole("button", { name: "Entregar Portátil 07" }));
    expect((await screen.findByRole("alert")).textContent).toBe("El equipo no está reservado");
  });
});
