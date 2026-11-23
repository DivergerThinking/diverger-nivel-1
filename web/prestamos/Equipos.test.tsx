import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

  it("pide un equipo disponible con la fecha y el token, y recarga la lista", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta([{ id: "e1", nombre: "Portátil 07", estado: "disponible" }]))
      .mockResolvedValueOnce(
        respuesta({ id: "e1", nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-12-15" }, 201),
      )
      .mockResolvedValueOnce(
        respuesta([{ id: "e1", nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-12-15" }]),
      );
    vi.stubGlobal("fetch", fetch);
    render(<Equipos sesion={SESION} />);
    const formulario = await screen.findByRole("form", { name: "Pedir Portátil 07" });
    fireEvent.change(within(formulario).getByLabelText("Fecha de devolución"), { target: { value: "2026-12-15" } });
    fireEvent.click(within(formulario).getByRole("button", { name: "Pedir" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Lista de equipos").textContent).toContain("Portátil 07: reservado");
    });
    expect(fetch).toHaveBeenCalledWith("/api/equipos/e1/solicitud", {
      method: "POST",
      headers: { authorization: "Bearer token-de-ana", "content-type": "application/json" },
      body: JSON.stringify({ devolucion: "2026-12-15" }),
    });
    expect(screen.queryByRole("form", { name: "Pedir Portátil 07" })).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("no deja pedir un equipo reservado o prestado", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve(respuesta([{ id: "e2", nombre: "Monitor 03", estado: "reservado", persona: "luis.garcia@empresa.com", devolucion: "2026-12-15" }])),
    );
    render(<Equipos sesion={SESION} />);
    await screen.findByLabelText("Lista de equipos");
    expect(screen.queryByRole("button", { name: "Pedir" })).toBeNull();
  });

  it("enseña tal cual el mensaje de la API cuando pedir falla", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta([{ id: "e1", nombre: "Portátil 07", estado: "disponible" }]))
      .mockResolvedValueOnce(respuesta({ error: "El equipo no está disponible" }, 409));
    vi.stubGlobal("fetch", fetch);
    render(<Equipos sesion={SESION} />);
    const formulario = await screen.findByRole("form", { name: "Pedir Portátil 07" });
    fireEvent.change(within(formulario).getByLabelText("Fecha de devolución"), { target: { value: "2026-12-15" } });
    fireEvent.click(within(formulario).getByRole("button", { name: "Pedir" }));
    expect((await screen.findByRole("alert")).textContent).toBe("El equipo no está disponible");
  });
});
