import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Equipos } from "./Equipos.js";
import { pantallas } from "./index.js";

const SESION: Sesion = { token: "token-de-ana", persona: { email: "ana.perez@empresa.com", nombre: "Ana" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

const LISTA = [
  { id: "e-1", nombre: "Portátil 07", estado: "disponible" },
  { id: "e-2", nombre: "Proyector 01", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-12-10" },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla de equipos", () => {
  it("lista los equipos con su estado, persona y devolución, con el token de la sesión", async () => {
    const fetch = vi.fn(() => Promise.resolve(respuesta(LISTA)));
    vi.stubGlobal("fetch", fetch);
    render(<Equipos sesion={SESION} />);
    expect(await screen.findByText("Portátil 07")).toBeTruthy();
    expect(screen.getByText("disponible")).toBeTruthy();
    expect(screen.getByText("prestado")).toBeTruthy();
    expect(screen.getByText("luis.gomez@empresa.com")).toBeTruthy();
    expect(screen.getByText("2026-12-10")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos", { method: "GET", headers: { authorization: "Bearer token-de-ana" } });
  });

  it("pide un equipo disponible con la fecha de devolución y recarga la lista", async () => {
    const reservado = { id: "e-1", nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-12-10" };
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta(LISTA))
      .mockResolvedValueOnce(respuesta(reservado, 201))
      .mockResolvedValueOnce(respuesta([reservado, LISTA[1]]));
    vi.stubGlobal("fetch", fetch);
    render(<Equipos sesion={SESION} />);
    fireEvent.change(await screen.findByLabelText("Fecha de devolución de Portátil 07"), { target: { value: "2026-12-10" } });
    fireEvent.click(screen.getByRole("button", { name: "Pedir Portátil 07" }));
    expect(await screen.findByText("reservado")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos/e-1/solicitud", {
      method: "POST",
      headers: { authorization: "Bearer token-de-ana", "content-type": "application/json" },
      body: JSON.stringify({ devolucion: "2026-12-10" }),
    });
  });

  it("enseña el mensaje de la API tal cual cuando falla la solicitud", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta(LISTA))
      .mockResolvedValueOnce(respuesta({ error: "Falta la fecha de devolución" }, 400));
    vi.stubGlobal("fetch", fetch);
    render(<Equipos sesion={SESION} />);
    await screen.findByText("Portátil 07");
    fireEvent.click(screen.getByRole("button", { name: "Pedir Portátil 07" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Falta la fecha de devolución");
  });

  it("enseña «Inicia sesión con Google.» si la API responde 401 al listar", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Inicia sesión con Google." }, 401)));
    render(<Equipos sesion={SESION} />);
    expect((await screen.findByRole("alert")).textContent).toBe("Inicia sesión con Google.");
  });
});

describe("pantallas del contexto", () => {
  it("la de equipos la ve cualquiera con sesión", () => {
    const equipos = pantallas.find((p) => p.id === "prestamos-equipos");
    expect(equipos?.Componente).toBe(Equipos);
    expect(equipos?.visible).toBeUndefined();
  });
});
