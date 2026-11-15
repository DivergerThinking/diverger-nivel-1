// Pantallas del contexto «prestamos»: las que describe spec/contextos/prestamos/pantallas.md.
import { siPuedeLlamar, type Pantalla } from "../pantallas.js";
import { Equipos } from "./Equipos.js";
import { Historial } from "./Historial.js";
import { Mostrador } from "./Mostrador.js";
import { Vencidos } from "./Vencidos.js";

export const pantallas: Pantalla[] = [
  { id: "prestamos-equipos", titulo: "Equipos", Componente: Equipos },
  {
    id: "prestamos-mostrador",
    titulo: "Mostrador de IT",
    Componente: Mostrador,
    visible: siPuedeLlamar("/api/prestamos/vencidos"),
  },
  {
    id: "prestamos-vencidos",
    titulo: "Préstamos vencidos",
    Componente: Vencidos,
    visible: siPuedeLlamar("/api/prestamos/vencidos"),
  },
  {
    id: "prestamos-historial",
    titulo: "Historial de un equipo",
    Componente: Historial,
    visible: siPuedeLlamar("/api/prestamos/vencidos"),
  },
];
