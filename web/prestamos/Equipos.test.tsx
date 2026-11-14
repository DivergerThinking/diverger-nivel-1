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
  it("llama a GET /api/equipos con el token y enseña los equipos y quién ha iniciado sesión", async () => {
    const fetch = vi.fn(() =>
      Promise.resolve(
        respuesta([
          { id: "e1", nombre: "Portátil 07", estado: "disponible" },
          { id: "e2", nombre: "Proyector 02", estado: "prestado", persona: "ana.perez@empresa.com", devolucion: "2026-11-20" },
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    render(<Equipos sesion={SESION} />);
    expect(await screen.findByText("Portátil 07: disponible")).toBeTruthy();
    expect(screen.getByText("Proyector 02: prestado a ana.perez@empresa.com, devolución 2026-11-20")).toBeTruthy();
    expect(screen.getByText("Sesión iniciada como ana.perez@empresa.com")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos", { method: "GET", headers: { authorization: "Bearer token-de-ana" } });
  });

  it("con 401 enseña el mensaje de la API tal cual", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Inicia sesión con Google." }, 401)));
    render(<Equipos sesion={SESION} />);
    expect((await screen.findByRole("alert")).textContent).toBe("Inicia sesión con Google.");
  });
});
