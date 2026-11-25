import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { AltaEquipos } from "./AltaEquipos.js";

const SESION: Sesion = { token: "token-de-ana", persona: { email: "ana.perez@empresa.com", nombre: "Ana Pérez" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function darDeAlta(nombre: string) {
  fireEvent.change(screen.getByLabelText("Nombre del equipo"), { target: { value: nombre } });
  fireEvent.click(screen.getByRole("button", { name: "Dar de alta" }));
}

describe("pantalla Alta de equipos", () => {
  it("da de alta el equipo con el token de la sesión y enseña el equipo creado", async () => {
    const fetch = vi.fn(() => Promise.resolve(respuesta({ id: "eq-1", nombre: "Portátil 07", estado: "disponible" }, 201)));
    vi.stubGlobal("fetch", fetch);
    render(<AltaEquipos sesion={SESION} />);
    darDeAlta("Portátil 07");
    expect(await screen.findByText("eq-1")).toBeTruthy();
    expect(screen.getByText("Portátil 07")).toBeTruthy();
    expect(screen.getByText("disponible")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos", {
      method: "POST",
      headers: { authorization: "Bearer token-de-ana", "content-type": "application/json" },
      body: JSON.stringify({ nombre: "Portátil 07" }),
    });
  });

  it.each([
    [400, "Falta el nombre del equipo"],
    [409, "Ya hay un equipo con ese nombre"],
    [401, "Inicia sesión con Google."],
  ])("enseña tal cual el mensaje de la API con un %i", async (status, mensaje) => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: mensaje }, status)));
    render(<AltaEquipos sesion={SESION} />);
    darDeAlta("Portátil 07");
    expect((await screen.findByRole("alert")).textContent).toBe(mensaje);
  });
});
