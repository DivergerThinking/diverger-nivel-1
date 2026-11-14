// Pantallas del contexto «equipos»: las que describe spec/contextos/equipos/pantallas.md.
import type { Pantalla } from "../pantallas.js";
import { AltaEquipo } from "./AltaEquipo.js";

export const pantallas: Pantalla[] = [{ id: "equipos-alta", titulo: "Alta de equipos", Componente: AltaEquipo }];
