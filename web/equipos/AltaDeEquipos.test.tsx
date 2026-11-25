import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { AltaDeEquipos } from "./AltaDeEquipos.js";
import { pantallas } from "./index.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function darDeAlta(nombre: string) {
  render(<AltaDeEquipos sesion={SESION} />);
  fireEvent.change(screen.getByLabelText("Nombre del equipo"), { target: { value: nombre } });
  fireEvent.click(screen.getByRole("button", { name: "Dar de alta" }));
}

describe("pantalla Alta de equipos", () => {
  it("da de alta el equipo con el token de la sesión y enseña id, nombre y estado", async () => {
    const fetch = vi.fn(() => Promise.resolve(respuesta({ id: "e1", nombre: "Portátil 07", estado: "disponible" }, 201)));
    vi.stubGlobal("fetch", fetch);
    darDeAlta("Portátil 07");
    expect(await screen.findByText(/Portátil 07 \(id e1, disponible\)/)).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos", {
      method: "POST",
      headers: { authorization: "Bearer token-de-it", "content-type": "application/json" },
      body: JSON.stringify({ nombre: "Portátil 07" }),
    });
  });

  it.each([
    [400, "Falta el nombre del equipo"],
    [409, "Ya hay un equipo con ese nombre"],
    [401, "Inicia sesión con Google."],
  ])("enseña tal cual el error %i de la API", async (status, mensaje) => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: mensaje }, status)));
    darDeAlta("Portátil 07");
    expect((await screen.findByRole("alert")).textContent).toBe(mensaje);
  });

  it("se registra como pantalla solo para IT", () => {
    expect(pantallas.map((p) => p.id)).toEqual(["equipos-alta"]);
    expect(pantallas[0]?.visible).toBeTypeOf("function");
  });
});
