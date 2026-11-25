import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Sesion } from "../pantallas.js";
import { Equipos } from "./Equipos.js";
import { pantallas } from "./index.js";

const SESION: Sesion = { token: "token-de-ana", persona: { email: "ana.perez@empresa.com", nombre: "Ana" } };

function respuesta(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pantalla Equipos", () => {
  it("lista los equipos con su estado, persona y devolución, llamando con el token de la sesión", async () => {
    const fetch = vi.fn(() =>
      Promise.resolve(
        respuesta([
          { id: "1", nombre: "Portátil 07", estado: "disponible" },
          { id: "2", nombre: "Proyector 02", estado: "prestado", persona: "luis.gomez@empresa.com", devolucion: "2026-12-01" },
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    render(<Equipos sesion={SESION} />);
    expect(await screen.findByText("Portátil 07: disponible")).toBeTruthy();
    expect(screen.getByText("Proyector 02: prestado a luis.gomez@empresa.com hasta el 2026-12-01")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos", { method: "GET", headers: { authorization: "Bearer token-de-ana" } });
  });

  it("avisa de que no hay equipos si la lista llega vacía", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta([])));
    render(<Equipos sesion={SESION} />);
    expect(await screen.findByText("No hay equipos dados de alta.")).toBeTruthy();
  });

  it("enseña tal cual el error 401 de la API", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(respuesta({ error: "Inicia sesión con Google." }, 401)));
    render(<Equipos sesion={SESION} />);
    expect((await screen.findByRole("alert")).textContent).toBe("Inicia sesión con Google.");
  });

  it("pide un equipo disponible con la fecha indicada y enseña el equipo reservado a su nombre", async () => {
    let reservado = false;
    const fetch = vi.fn((ruta: string, opciones: { method: string }) => {
      if (opciones.method === "POST") {
        reservado = true;
        return Promise.resolve(respuesta({ id: "42", nombre: "Portátil 07", estado: "reservado" }, 201));
      }
      return Promise.resolve(
        respuesta([
          reservado
            ? { id: "42", nombre: "Portátil 07", estado: "reservado", persona: "ana.perez@empresa.com", devolucion: "2026-12-01" }
            : { id: "42", nombre: "Portátil 07", estado: "disponible" },
        ]),
      );
    });
    vi.stubGlobal("fetch", fetch);
    render(<Equipos sesion={SESION} />);
    fireEvent.change(await screen.findByLabelText("Fecha de devolución de Portátil 07"), { target: { value: "2026-12-01" } });
    fireEvent.click(screen.getByText("Pedir Portátil 07"));
    expect(await screen.findByText("Portátil 07: reservado a ana.perez@empresa.com hasta el 2026-12-01")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith("/api/equipos/42/solicitud", {
      method: "POST",
      headers: { authorization: "Bearer token-de-ana", "content-type": "application/json" },
      body: JSON.stringify({ devolucion: "2026-12-01" }),
    });
  });

  it("enseña tal cual los errores de la solicitud, también sin fecha", async () => {
    const mensajes = ["Falta la fecha de devolución", "El equipo no está disponible"];
    const fetch = vi.fn((_ruta: string, opciones: { method: string }) =>
      Promise.resolve(
        opciones.method === "POST"
          ? respuesta({ error: mensajes.shift() }, 400)
          : respuesta([{ id: "42", nombre: "Portátil 07", estado: "disponible" }]),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    render(<Equipos sesion={SESION} />);
    fireEvent.click(await screen.findByText("Pedir Portátil 07"));
    expect((await screen.findByRole("alert")).textContent).toBe("Falta la fecha de devolución");
    expect(fetch).toHaveBeenCalledWith(
      "/api/equipos/42/solicitud",
      expect.objectContaining({ body: JSON.stringify({}) }),
    );
    fireEvent.click(screen.getByText("Pedir Portátil 07"));
    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe("El equipo no está disponible");
    });
  });

  it("no ofrece pedir un equipo que no está disponible", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve(respuesta([{ id: "1", nombre: "Proyector 02", estado: "prestado", persona: "luis@empresa.com", devolucion: "2026-12-01" }])),
    );
    render(<Equipos sesion={SESION} />);
    await screen.findByText(/Proyector 02: prestado/);
    expect(screen.queryByText("Pedir Proyector 02")).toBeNull();
  });

  it("se registra como pantalla para cualquiera con sesión", () => {
    expect(pantallas.map((p) => p.id)).toEqual(["prestamos-equipos", "prestamos-gestion", "prestamos-vencidos", "prestamos-historial"]);
    expect(pantallas[0]?.visible).toBeUndefined();
  });
});
