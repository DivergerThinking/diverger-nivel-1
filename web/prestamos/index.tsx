// Pantallas del contexto «prestamos» (ADR 0053 del harness): las que describe spec/contextos/prestamos/pantallas.md.
import { siPuedeLlamar, type Pantalla } from "../pantallas.js";
import { Equipos } from "./Equipos.js";
import { Gestion } from "./Gestion.js";

export const pantallas: Pantalla[] = [
  { id: "prestamos-equipos", titulo: "Equipos", Componente: Equipos },
  {
    id: "prestamos-gestion",
    titulo: "Gestión de préstamos",
    Componente: Gestion,
    visible: siPuedeLlamar("/api/prestamos/vencidos"),
  },
];
