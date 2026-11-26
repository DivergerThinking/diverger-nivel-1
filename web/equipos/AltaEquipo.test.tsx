import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { AltaEquipo } from "./AltaEquipo.js";
import { pantallas } from "./index.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

function darDeAlta(nombre: string) {
  render(<AltaEquipo sesion={SESION} />);
  fireEvent.change(screen.getByLabelText("Nombre del equipo"), { target: { value: nombre } });
  fireEvent.click(screen.getByRole("button", { name: "Dar de alta" }));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla de alta de equipos", () => {
  it("da de alta el equipo con el token de la sesión y enseña el equipo creado", async () => {
    const fetch = vi.fn(() => Promise.resolve(respuesta({ id: "e-1", nombre: "Monitor 03", estado: "disponible" }, 201)));
    vi.stubGlobal("fetch", fetch);
    darDeAlta("Monitor 03");
    expect(await screen.findByText("e-1")).toBeTruthy();
    expect(screen.getByText("Monitor 03")).toBeTruthy();
    expect(screen.getByText("disponible")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos", {
      method: "POST",
      headers: { authorization: "Bearer token-de-it", "content-type": "application/json" },
      body: JSON.stringify({ nombre: "Monitor 03" }),
    });
  });

  it.each([
    [400, "Falta el nombre del equipo"],
    [403, "Solo IT puede hacer esto."],
    [409, "Ya hay un equipo con ese nombre"],
  ])("enseña el mensaje de la API tal cual con un %i", async (estado, mensaje) => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: mensaje }, estado)));
    darDeAlta("Monitor 03");
    expect((await screen.findByRole("alert")).textContent).toBe(mensaje);
  });
});

describe("pantallas del contexto", () => {
  it("la de alta solo la ve quien puede consultar los vencidos, que son de IT", async () => {
    const fetch = vi.fn(() => Promise.resolve(respuesta([])));
    vi.stubGlobal("fetch", fetch);
    const alta = pantallas.find((p) => p.id === "equipos-alta");
    expect(await alta?.visible?.(SESION)).toBe(true);
    expect(fetch).toHaveBeenCalledWith("/api/prestamos/vencidos", { method: "GET", headers: { authorization: "Bearer token-de-it" } });

    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Solo IT puede hacer esto." }, 403)));
    expect(await alta?.visible?.(SESION)).toBe(false);
  });
});
