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
    expect(screen.getAllByRole("button").map((boton) => boton.textContent)).toEqual(["Entregar Portátil 07"]);
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
