import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { AltaEquipos } from "./AltaEquipos.js";
import { pantallas } from "./index.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

function darDeAlta(nombre: string) {
  fireEvent.change(screen.getByLabelText("Nombre del equipo"), { target: { value: nombre } });
  fireEvent.click(screen.getByRole("button", { name: "Dar de alta" }));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla Alta de equipos", () => {
  it("da de alta el equipo con el token de la sesión y enseña su nombre y estado", async () => {
    const fetch = vi.fn(() => Promise.resolve(respuesta({ id: "e1", nombre: "Portátil 07", estado: "disponible" }, 201)));
    vi.stubGlobal("fetch", fetch);
    render(<AltaEquipos sesion={SESION} />);
    darDeAlta("Portátil 07");
    expect(await screen.findByText("Equipo dado de alta: Portátil 07 (disponible)")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos", {
      method: "POST",
      headers: { authorization: "Bearer token-de-it", "content-type": "application/json" },
      body: JSON.stringify({ nombre: "Portátil 07" }),
    });
  });

  it("enseña el mensaje de la API si falta el nombre", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Falta el nombre del equipo" }, 400)));
    render(<AltaEquipos sesion={SESION} />);
    darDeAlta("");
    expect((await screen.findByRole("alert")).textContent).toBe("Falta el nombre del equipo");
  });

  it("enseña el mensaje de la API si el nombre está repetido", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Ya hay un equipo con ese nombre" }, 409)));
    render(<AltaEquipos sesion={SESION} />);
    darDeAlta(" portátil 07 ");
    expect((await screen.findByRole("alert")).textContent).toBe("Ya hay un equipo con ese nombre");
  });

  it("solo se enseña a quien puede leer los préstamos vencidos", async () => {
    const fetch = vi.fn(() => Promise.resolve(respuesta({ error: "Solo IT puede hacer esto." }, 403)));
    vi.stubGlobal("fetch", fetch);
    const visible = pantallas[0]?.visible;
    expect(await visible?.(SESION)).toBe(false);
    expect(fetch).toHaveBeenCalledWith("/api/prestamos/vencidos", { method: "GET", headers: { authorization: "Bearer token-de-it" } });
    fetch.mockImplementation(() => Promise.resolve(respuesta([])));
    expect(await visible?.(SESION)).toBe(true);
  });
});
