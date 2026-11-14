import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

  it("pide un equipo disponible con su fecha de devolución, con el token, y enseña la lista actualizada", async () => {
    let reservado = false;
    const fetch = vi.fn((ruta: string, opciones: { method: string }) => {
      if (opciones.method === "POST") {
        reservado = true;
        return Promise.resolve(
          respuesta({ id: "e1", nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-11-20" }, 201),
        );
      }
      return Promise.resolve(
        respuesta([
          reservado
            ? { id: "e1", nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-11-20" }
            : { id: "e1", nombre: "Portátil 07", estado: "disponible" },
          { id: "e2", nombre: "Proyector 02", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-11-25" },
        ]),
      );
    });
    vi.stubGlobal("fetch", fetch);
    render(<Equipos sesion={SESION} />);
    await screen.findByText("Portátil 07: disponible");
    const opciones = screen.getAllByRole("option").map((opcion) => opcion.textContent);
    expect(opciones).toEqual(["Elige un equipo", "Portátil 07"]);
    fireEvent.change(screen.getByLabelText("Equipo a pedir"), { target: { value: "e1" } });
    fireEvent.change(screen.getByLabelText("Fecha de devolución"), { target: { value: "2026-11-20" } });
    fireEvent.click(screen.getByRole("button", { name: "Pedir equipo" }));
    expect(await screen.findByText("Portátil 07: reservado a ana.perez@empresa.com, devolución 2026-11-20")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Portátil 07 reservado a tu nombre hasta el 2026-11-20");
    expect(fetch).toHaveBeenCalledWith("/api/equipos/e1/solicitud", {
      method: "POST",
      headers: { authorization: "Bearer token-de-ana", "content-type": "application/json" },
      body: JSON.stringify({ devolucion: "2026-11-20" }),
    });
  });

  it("si la API rechaza la solicitud, enseña su mensaje tal cual", async () => {
    const fetch = vi.fn((_ruta: string, opciones: { method: string }) =>
      Promise.resolve(
        opciones.method === "POST"
          ? respuesta({ error: "El equipo no está disponible" }, 409)
          : respuesta([{ id: "e1", nombre: "Portátil 07", estado: "disponible" }]),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    render(<Equipos sesion={SESION} />);
    await screen.findByText("Portátil 07: disponible");
    fireEvent.change(screen.getByLabelText("Equipo a pedir"), { target: { value: "e1" } });
    fireEvent.change(screen.getByLabelText("Fecha de devolución"), { target: { value: "2026-11-20" } });
    fireEvent.click(screen.getByRole("button", { name: "Pedir equipo" }));
    expect((await screen.findByRole("alert")).textContent).toBe("El equipo no está disponible");
  });

  it("con 401 enseña el mensaje de la API tal cual", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Inicia sesión con Google." }, 401)));
    render(<Equipos sesion={SESION} />);
    expect((await screen.findByRole("alert")).textContent).toBe("Inicia sesión con Google.");
  });
});
