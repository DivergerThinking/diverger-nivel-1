// Pantallas del contexto «prestamos»: las que describe spec/contextos/prestamos/pantallas.md.
import type { Pantalla } from "../pantallas.js";
import { Equipos } from "./Equipos.js";

export const pantallas: Pantalla[] = [{ id: "prestamos-equipos", titulo: "Equipos", Componente: Equipos }];
