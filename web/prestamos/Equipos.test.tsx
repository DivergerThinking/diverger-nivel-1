import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Equipos } from "./Equipos.js";

const SESION: Sesion = { token: "token-de-ana", persona: { email: "ana.perez@empresa.com", nombre: "Ana" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla Equipos", () => {
  it("pide la lista con el token de la sesión y enseña nombre, estado, persona y devolución", async () => {
    const fetch = vi.fn(() =>
      Promise.resolve(
        respuesta([
          { id: "e1", nombre: "Portátil 07", estado: "disponible" },
          { id: "e2", nombre: "Monitor 03", estado: "prestado", persona: "luis.garcia@empresa.com", devolucion: "2026-12-15" },
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    render(<Equipos sesion={SESION} />);
    const lista = await screen.findByLabelText("Lista de equipos");
    expect(lista.textContent).toContain("Portátil 07: disponible");
    expect(lista.textContent).toContain("Monitor 03: prestado");
    expect(lista.textContent).toContain("luis.garcia@empresa.com");
    expect(lista.textContent).toContain("2026-12-15");
    expect(fetch).toHaveBeenCalledWith("/api/equipos", { method: "GET", headers: { authorization: "Bearer token-de-ana" } });
  });

  it("enseña tal cual el mensaje de la API con 401 y ningún equipo", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Inicia sesión con Google." }, 401)));
    render(<Equipos sesion={SESION} />);
    expect((await screen.findByRole("alert")).textContent).toBe("Inicia sesión con Google.");
    expect(screen.queryByLabelText("Lista de equipos")).toBeNull();
  });
});
