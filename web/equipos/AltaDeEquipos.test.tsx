import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { AltaDeEquipos } from "./AltaDeEquipos.js";

const SESION: Sesion = { token: "token-de-it", persona: { email: "it@empresa.com", nombre: "IT" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

function escribirYEnviar(nombre: string) {
  fireEvent.change(screen.getByLabelText("Nombre del equipo"), { target: { value: nombre } });
  fireEvent.click(screen.getByRole("button", { name: "Dar de alta" }));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla Alta de equipos", () => {
  it("da de alta el equipo con el token de la sesión y enseña el equipo creado", async () => {
    const fetch = vi.fn(() => Promise.resolve(respuesta({ id: "e1", nombre: "Portátil 07", estado: "disponible" }, 201)));
    vi.stubGlobal("fetch", fetch);
    render(<AltaDeEquipos sesion={SESION} />);
    escribirYEnviar("Portátil 07");
    const creado = await screen.findByLabelText("Equipo creado");
    expect(creado.textContent).toContain("e1");
    expect(creado.textContent).toContain("Portátil 07");
    expect(creado.textContent).toContain("disponible");
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
  ])("enseña tal cual el mensaje de la API con %i", async (status, mensaje) => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: mensaje }, status)));
    render(<AltaDeEquipos sesion={SESION} />);
    escribirYEnviar("Portátil 07");
    expect((await screen.findByRole("alert")).textContent).toBe(mensaje);
    expect(screen.queryByLabelText("Equipo creado")).toBeNull();
  });
});
