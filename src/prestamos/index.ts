// Interfaz pública del contexto «prestamos»: lo único que pueden importar los demás.
import type { FastifyPluginAsync } from "fastify";
import "../../lib/auth.js";
import type { OpcionesContexto } from "../../lib/datos.js";
import { entregarEquipo, esCuentaDeIT, esOperacionDeIT, listarEquipos, prestarEquipo, SOLO_IT, solicitarEquipo, type Equipo } from "./prestamos.js";

export type { Equipo } from "./prestamos.js";

/** Rutas del contrato spec/contextos/prestamos/api.openapi.json. */
export const rutas: FastifyPluginAsync<OpcionesContexto> = (app, { almacen }) => {
  // Las operaciones «solo IT» responden 403 a cualquier otra cuenta antes de llegar a su ruta.
  app.addHook("onRequest", async (request, reply) => {
    if (esOperacionDeIT(request.method, request.url) && !esCuentaDeIT(request.persona?.email)) {
      return reply.code(403).send({ error: SOLO_IT });
    }
  });

  app.get("/api/equipos", async () => {
    const equipos: Equipo[] = await listarEquipos(almacen);
    return equipos;
  });

  app.post<{ Params: { id: string } }>("/api/equipos/:id/solicitud", async (request, reply) => {
    const persona = request.persona?.email;
    if (!persona) return reply.code(401).send({ error: "Inicia sesión con Google." });
    const cuerpo = request.body as { devolucion?: unknown } | null | undefined;
    const resultado = await solicitarEquipo(almacen, request.params.id, persona, cuerpo?.devolucion);
    if (!resultado.ok) return reply.code(resultado.status).send({ error: resultado.error });
    return reply.code(201).send(resultado.equipo);
  });

  app.post<{ Params: { id: string } }>("/api/equipos/:id/entrega", async (request, reply) => {
    const resultado = await entregarEquipo(almacen, request.params.id);
    if (!resultado.ok) return reply.code(resultado.status).send({ error: resultado.error });
    return reply.code(200).send(resultado.equipo);
  });

  app.post<{ Params: { id: string } }>("/api/equipos/:id/prestamo", async (request, reply) => {
    const cuerpo = request.body as { persona?: unknown; devolucion?: unknown } | null | undefined;
    const resultado = await prestarEquipo(almacen, request.params.id, cuerpo?.persona, cuerpo?.devolucion);
    if (!resultado.ok) return reply.code(resultado.status).send({ error: resultado.error });
    return reply.code(201).send(resultado.equipo);
  });
  return Promise.resolve();
};

// Sin encapsular el plugin (lo que hace fastify-plugin), el hook de arriba también alcanza a las rutas «solo IT» que
// aún no tienen manejador, para que respondan 403 a quien no es de IT en vez de 404.
Object.assign(rutas, { [Symbol.for("skip-override")]: true });
