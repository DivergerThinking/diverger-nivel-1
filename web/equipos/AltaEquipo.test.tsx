import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { AltaEquipo } from "./AltaEquipo.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@example.com", nombre: "IT" } };

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

describe("pantalla Alta de equipos", () => {
  it("llama a POST /api/equipos con el token y enseña el equipo creado", async () => {
    const fetch = vi.fn(() => Promise.resolve(respuesta({ id: "e1", nombre: "Portátil 07", estado: "disponible" }, 201)));
    vi.stubGlobal("fetch", fetch);
    darDeAlta("Portátil 07");
    expect(await screen.findByText("Equipo dado de alta: Portátil 07 (disponible)")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos", {
      method: "POST",
      headers: { authorization: "Bearer token-de-it", "content-type": "application/json" },
      body: JSON.stringify({ nombre: "Portátil 07" }),
    });
  });

  it.each([
    [400, "Falta el nombre del equipo"],
    [409, "Ya hay un equipo con ese nombre"],
    [403, "Solo IT puede hacer esto."],
  ])("con %i enseña el mensaje de la API tal cual", async (status, mensaje) => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: mensaje }, status)));
    darDeAlta("x");
    expect((await screen.findByRole("alert")).textContent).toBe(mensaje);
  });
});
